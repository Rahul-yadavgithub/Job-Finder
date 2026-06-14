import { Queue, Worker, QueueEvents } from 'bullmq';
import { connection } from '../config/redis';
import { JobScraperFactory } from '../services/scraper/JobScraperFactory';
import ScanHistory from '../models/ScanHistory';

export const SCRAPE_QUEUE_NAME = 'scrape-jobs';

export const scrapeQueue = new Queue(SCRAPE_QUEUE_NAME, { connection: connection as any });
export const scrapeQueueEvents = new QueueEvents(SCRAPE_QUEUE_NAME, { connection: connection as any });

// Worker is defined but usually we'd start it in a separate process or conditionally
// For Phase 1 we can run it in the same process for simplicity
export const scrapeWorker = new Worker(
  SCRAPE_QUEUE_NAME,
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} for platform: ${job.data.platform}`);
    
    if (job.data.scanHistoryId) {
      await ScanHistory.findByIdAndUpdate(job.data.scanHistoryId, {
        status: 'RUNNING',
        startedAt: new Date()
      });
    }

    const scraper = JobScraperFactory.getScraper(job.data.platform);
    if (!scraper) {
      throw new Error(`No scraper found for platform: ${job.data.platform}`);
    }
    await scraper.runScan(job.data.scanHistoryId, job.data.sourceUrl);
  },
  { 
    connection: connection as any,
    concurrency: 2 // Maximum 2 concurrent browser instances globally
  }
);

scrapeWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed!`);
});

scrapeWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
});
