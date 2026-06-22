import cron from 'node-cron';
import { ApiKeyRotatorService } from '../services/api-key-rotator.service';
import { FollowupCronJob } from './followup.cron';
import { DailyReminderCronJob } from './daily-reminder.cron';

/**
 * Initializes all background scheduled jobs for the application.
 */
export function initSchedulers() {
  console.log('[Scheduler] Initializing background jobs...');

  // Run the queue processor every hour at minute 0
  // "0 * * * *" means exactly at the top of every hour.
  // Alternatively, "0 * * * * *" runs every minute if you want faster debugging,
  // but standard production requirement is 1 hour.
  cron.schedule('0 * * * *', async () => {
    console.log(`[Scheduler] Running hourly processQueue task at ${new Date().toISOString()}`);
    try {
      await ApiKeyRotatorService.processQueue();
    } catch (error) {
      console.error('[Scheduler] Error in processQueue cron job:', error);
    }
  });


  // Run the follow-up checker every day at 10:00 AM (server time)
  cron.schedule('0 10 * * *', async () => {
    console.log(`[Scheduler] Running daily FollowupCronJob at ${new Date().toISOString()}`);
    try {
      await FollowupCronJob.processFollowups();
    } catch (error) {
      console.error('[Scheduler] Error in FollowupCronJob cron job:', error);
    }
  });

  // Feature 1: Daily Reminder for Base TPR (10:00 AM)
  cron.schedule('0 10 * * *', async () => {
    try {
      await DailyReminderCronJob.runMorningJob();
    } catch (error) {
      console.error('[Scheduler] Error in morning DailyReminderCronJob:', error);
    }
  });

  // Feature 1: Daily Reminder for Base TPR (12:00 PM)
  cron.schedule('0 12 * * *', async () => {
    try {
      await DailyReminderCronJob.runMiddayJob();
    } catch (error) {
      console.error('[Scheduler] Error in midday DailyReminderCronJob:', error);
    }
  });

  console.log('[Scheduler] Background jobs scheduled successfully.');
}
