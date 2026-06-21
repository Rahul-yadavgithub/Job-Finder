import { Response } from 'express';
import { CommunicationTPRRequest } from '../types';
import { supabase } from '../../../config/supabase';

export class DashboardController {
  getOverview = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { data: assignments, error } = await supabase
        .from('company_status')
        .select('mid_status, next_followup_date')
        .in('mid_status', ['interested', 'under_communication', 'ready_for_head_review']);

      if (error) throw error;

      let new_arrivals = 0;
      let active_communications = 0;
      let ready_for_review = 0;
      let overdue_followups = 0;
      let due_today = 0;
      let upcoming = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      assignments.forEach(a => {
        if (a.mid_status === 'interested') new_arrivals++;
        if (a.mid_status === 'under_communication') active_communications++;
        if (a.mid_status === 'ready_for_head_review') ready_for_review++;

        if (a.next_followup_date && a.mid_status === 'under_communication') {
          const followupDate = new Date(a.next_followup_date);
          followupDate.setHours(0, 0, 0, 0);
          
          if (followupDate < today) overdue_followups++;
          else if (followupDate.getTime() === today.getTime()) due_today++;
          else upcoming++;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          active_communications,
          pending_followups: overdue_followups + due_today,
          companies_contacted: active_communications + ready_for_review,
          overdue: overdue_followups,
          due_today,
          upcoming,
          new_arrivals
        }
      });
    } catch (error: any) {
      console.error('getOverview Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard overview' });
    }
  };
}
