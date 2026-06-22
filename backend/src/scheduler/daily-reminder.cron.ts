import { supabase } from '../config/supabase';
import { createNotification } from '../utils/notifications';

export class DailyReminderCronJob {
  
  static async runMorningJob() {
    console.log('[DailyReminder] Running 10 AM morning job...');
    await this.processReminders('morning');
  }

  static async runMiddayJob() {
    console.log('[DailyReminder] Running 12 PM midday job...');
    await this.processReminders('midday');
  }

  private static async processReminders(runTime: 'morning' | 'midday') {
    try {
      // Use user's local timezone / IST for 'today'
      const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const todayDate = new Date(today);
      const todayStr = todayDate.toISOString().split('T')[0];

      // Fetch companies scheduled for today
      // Excluding locked/completed ones is implicitly handled by base_status = 'call_again'
      const { data: records, error } = await supabase
        .from('company_status')
        .select(`
          company_id,
          next_followup_date,
          base_status,
          companies!inner (
            company_name,
            created_by
          )
        `)
        .eq('base_status', 'call_again')
        .eq('next_followup_date', todayStr);

      if (error) {
        throw error;
      }

      if (!records || records.length === 0) {
        console.log(`[DailyReminder] No reminders to send for ${runTime}.`);
        return;
      }

      // Group by created_by
      const userTasks: Record<string, any[]> = {};
      
      for (const record of records) {
        // companies is an object because we used !inner, but types can sometimes return arrays depending on setup.
        // We'll safely handle it.
        const comp = Array.isArray(record.companies) ? record.companies[0] : record.companies;
        if (!comp || !comp.created_by) continue;
        
        const userId = comp.created_by;
        if (!userTasks[userId]) userTasks[userId] = [];
        
        userTasks[userId].push({
          company_id: record.company_id,
          company_name: comp.company_name
        });
      }

      // Send notifications
      for (const [userId, companies] of Object.entries(userTasks)) {
        if (companies.length === 0) continue;

        const isMorning = runTime === 'morning';
        const title = isMorning ? "📞 Call Reminder — Morning" : "⏰ Call Reminder — Midday";
        
        let message = '';
        if (companies.length === 1) {
          const compName = companies[0].company_name;
          message = isMorning 
            ? `You have 1 company to contact today: ${compName}. Don't miss your follow-up call.`
            : `These companies are still pending your call today: ${compName}. Please contact them before EOD.`;
        } else {
          // Max 3 names in message
          const list = companies.slice(0, 3).map(c => `• ${c.company_name}`).join('\n');
          const moreCount = companies.length > 3 ? `\n• ...and ${companies.length - 3} more` : '';
          
          message = isMorning
            ? `You have ${companies.length} companies to contact today before end of day:\n${list}${moreCount}\nMake your calls now to stay on track.`
            : `These ${companies.length} companies are still pending your call today:\n${list}${moreCount}\nPlease contact them before EOD.`;
        }

        await createNotification(
          userId,
          'contact_reminder',
          title,
          message,
          { companies, runTime, actionUrl: '/dashboard/companies/today', category: 'company' }
        );
        
        console.log(`[DailyReminder] Sent ${runTime} reminder to user ${userId} for ${companies.length} companies.`);
      }

    } catch (error: any) {
      console.error(`[DailyReminder] Error processing ${runTime} reminders:`, error.message || error);
    }
  }
}
