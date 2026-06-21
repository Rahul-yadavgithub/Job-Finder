import { supabase } from '../config/supabase';
import { sendPlacementEmail } from '../services/email.service';

export class FollowupCronJob {
  static async processFollowups() {
    console.log('[FollowupCron] Starting follow-up check at', new Date().toISOString());

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch all 'sent' requests where next_followup_date <= TODAY
      const { data: requests, error } = await supabase
        .from('communication_requests')
        .select('*')
        .eq('status', 'sent')
        .lte('next_followup_date', today);

      if (error) throw error;

      if (!requests || requests.length === 0) {
        console.log('[FollowupCron] No follow-ups to process today.');
        return;
      }

      console.log(`[FollowupCron] Found ${requests.length} follow-ups to process.`);

      // 2. Fetch follow-up rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('comm_followup_rules')
        .select('*');

      if (rulesError) throw rulesError;

      // Group rules by followup_number
      const rules: Record<number, any> = {};
      rulesData?.forEach(r => { rules[r.followup_number] = r; });

      for (const req of requests) {
        try {
          const nextFollowupNumber = (req.follow_up_count || 0) + 1;
          const maxFollowups = req.max_follow_ups || 2;

          if (nextFollowupNumber > maxFollowups) {
            // Reached max follow-ups, mark as completed (or another status if desired)
            await supabase
              .from('communication_requests')
              .update({ status: 'completed' })
              .eq('id', req.id);
            continue;
          }

          const rule = rules[nextFollowupNumber];
          if (!rule) {
            console.warn(`[FollowupCron] No rule found for followup number ${nextFollowupNumber}`);
            continue;
          }

          // Process subject and body template
          // Very simple substitution for now if needed (e.g., {{hr_name}} -> could parse from email_to if we had a name field)
          const subject = rule.subject_template;
          
          let bodyHtml = rule.body_template;
          // Format text body as HTML (replace \n with <br>)
          bodyHtml = bodyHtml.replace(/\n/g, '<br>');

          // Fetch email template if needed
          let attachmentUrl, attachmentFilename;
          if (req.template_id) {
            const { data: templateData } = await supabase
              .from('email_templates')
              .select('attachment_url, attachment_filename')
              .eq('id', req.template_id)
              .single();
            if (templateData) {
              attachmentUrl = templateData.attachment_url;
              attachmentFilename = templateData.attachment_filename;
            }
          }

          // 3. Dispatch the Email
          await sendPlacementEmail({
            toEmail: req.email_to,
            subject: subject,
            bodyHtml: bodyHtml,
            attachmentUrl: attachmentUrl,
            attachmentFilename: attachmentFilename,
          });

          // 4. Update request record
          let nextFollowupDate = null;
          // Calculate next follow-up date if there is a subsequent rule
          const nextRule = rules[nextFollowupNumber + 1];
          if (nextRule && nextFollowupNumber < maxFollowups) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + nextRule.wait_days);
            nextFollowupDate = nextDate.toISOString().split('T')[0];
          }

          await supabase
            .from('communication_requests')
            .update({
              follow_up_count: nextFollowupNumber,
              last_followup_at: new Date().toISOString(),
              next_followup_date: nextFollowupDate,
              ...(nextFollowupDate === null && nextFollowupNumber === maxFollowups ? { status: 'completed' } : {})
            })
            .eq('id', req.id);

          console.log(`[FollowupCron] Successfully processed follow-up ${nextFollowupNumber} for request ${req.id}`);

        } catch (innerError) {
          console.error(`[FollowupCron] Error processing request ${req.id}:`, innerError);
        }
      }

      console.log('[FollowupCron] Follow-up check finished.');
    } catch (error) {
      console.error('[FollowupCron] Global error:', error);
    }
  }
}
