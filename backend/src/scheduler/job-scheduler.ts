import cron from 'node-cron';
import { ApiKeyRotatorService } from '../services/api-key-rotator.service';

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

  console.log('[Scheduler] Background jobs scheduled successfully.');
}
