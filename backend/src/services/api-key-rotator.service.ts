import mongoose from 'mongoose';
import axios from 'axios';
import BranchApiKey from '../models/BranchApiKey';
import ApiPlatform from '../models/ApiPlatform';
import ApiKeyUsageLog from '../models/ApiKeyUsageLog';
import ApiKeyRequestQueue from '../models/ApiKeyRequestQueue';
import BranchNotification from '../models/BranchNotification';
import Company, { CompanyStatus } from '../models/Company';
import HrContact from '../models/HrContact';
import { decrypt } from './encryption.service';
import { PlatformAdapter, ApolloAdapter, HunterAdapter, SnovAdapter, LushaAdapter, SkrappAdapter, GetProspectAdapter } from './adapters';

const ADAPTERS: Record<string, PlatformAdapter> = {
  apollo: new ApolloAdapter(),
  hunter: new HunterAdapter(),
  snov: new SnovAdapter(),
  lusha: new LushaAdapter(),
  skrapp: new SkrappAdapter(),
  getprospect: new GetProspectAdapter()
};

export class ApiKeyRotatorService {
  
  /**
   * Fetches the next available key for a given branch and platform.
   * Auto-resets exhausted keys if their monthly quota reset date has passed.
   */
  static async getNextAvailableKey(branchId: string, platformName: string) {
    const platform = await ApiPlatform.findOne({ name: platformName });
    if (!platform) throw new Error(`Platform ${platformName} not found`);

    const now = new Date();

    // 1. Check for exhausted keys that need auto-resetting
    const exhaustedKeys = await BranchApiKey.find({
      branchId,
      platformId: platform._id,
      status: 'exhausted',
      resetsMonthly: true,
      quotaResetsAt: { $lt: now }
    });

    for (const key of exhaustedKeys) {
      // Calculate next reset date (add 1 month)
      const nextReset = new Date(key.quotaResetsAt || now);
      nextReset.setMonth(nextReset.getMonth() + 1);
      
      key.status = 'active';
      key.callsUsed = 0;
      key.quotaResetsAt = nextReset;
      await key.save();
    }

    // 2. Fetch the active key with the lowest usage
    const activeKey = await BranchApiKey.findOne({
      branchId,
      platformId: platform._id,
      status: 'active'
    }).sort({ callsUsed: 1 });

    if (!activeKey) return null;

    // 3. Decrypt the key
    const decryptedValue = decrypt(activeKey.encryptedKey, activeKey.keyIv, activeKey.keyTag);

    return {
      keyRecord: activeKey,
      value: decryptedValue,
      platform
    };
  }

  /**
   * Logs usage, increments quotas, and marks keys as exhausted if limit reached.
   */
  static async recordUsage(
    branchApiKeyId: string, 
    companyId: string, 
    requestType: 'validate_key' | 'find_hr' | 'enrich_contact',
    responseStatus: 'success' | 'rate_limited' | 'invalid_key' | 'no_result',
    callsRemainingReported?: number
  ) {
    // 1. Log the usage
    await ApiKeyUsageLog.create({
      branchApiKeyId,
      companyId,
      requestType,
      responseStatus,
      callsRemainingReported
    });

    // 2. Increment usage if it was successful or rate limited (a call was made)
    const key = await BranchApiKey.findById(branchApiKeyId);
    if (!key) return;

    if (responseStatus !== 'invalid_key') {
      key.callsUsed += 1;
      key.lastUsedAt = new Date();
    }

    // 3. Check exhaustion
    if (key.callsUsed >= key.totalLimit || responseStatus === 'rate_limited' || responseStatus === 'invalid_key') {
      key.status = responseStatus === 'invalid_key' ? 'invalid' : 'exhausted';
      
      // If it's exhausted and doesn't reset, it's permanently dead
      if (key.status === 'exhausted' && !key.resetsMonthly) {
        // Just stays exhausted forever
      }
    }

    await key.save();

    // 4. Check if ALL keys for this branch+platform are dead, to notify
    if (key.status === 'exhausted' || key.status === 'invalid') {
      const activeCount = await BranchApiKey.countDocuments({
        branchId: key.branchId,
        platformId: key.platformId,
        status: 'active'
      });

      if (activeCount === 0) {
        const platform = await ApiPlatform.findById(key.platformId);
        
        // Prevent spamming the same notification
        const recentNotif = await BranchNotification.findOne({
          branchId: key.branchId,
          type: 'warning',
          message: { $regex: platform?.displayName || '' },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (!recentNotif) {
          await BranchNotification.create({
            branchId: key.branchId,
            type: 'warning',
            message: `All ${platform?.displayName} API keys for this branch are exhausted. Please add a new key.`
          });
        }
      }
    }
  }

  /**
   * Pushes a new request into the database queue.
   */
  static async queueRequest(branchId: string, companyId: string, requestType: 'find_hr' | 'enrich_contact', payload: any) {
    return await ApiKeyRequestQueue.create({
      branchId,
      companyId,
      requestType,
      payload,
      status: 'pending'
    });
  }



  /**
   * Auto-resets exhausted keys based on their monthly cycle.
   */
  static async autoResetKeys() {
    console.log('[RotatorService] Checking for keys to auto-reset...');
    const now = new Date();
    
    const exhaustedKeys = await BranchApiKey.find({
      status: 'exhausted',
      resetsMonthly: true,
      quotaResetsAt: { $lte: now }
    });

    const resetBranches = new Set<string>();

    for (const key of exhaustedKeys) {
      key.callsUsed = 0;
      key.status = 'active';

      let nextReset = new Date(now);
      if (key.resetDay) {
        nextReset.setMonth(nextReset.getMonth() + 1);
        nextReset.setDate(key.resetDay);
      } else {
        nextReset.setMonth(nextReset.getMonth() + 1);
      }
      key.quotaResetsAt = nextReset;

      await key.save();
      resetBranches.add(key.branchId.toString());
    }

    for (const branchId of resetBranches) {
      await BranchNotification.updateMany(
        { branchId, type: 'warning', isDismissed: false, message: /exhausted/i },
        { $set: { isDismissed: true } }
      );
    }
    
    if (exhaustedKeys.length > 0) {
      console.log(`[RotatorService] Auto-reset ${exhaustedKeys.length} keys.`);
    }
  }

  /**
   * Processes all pending queue requests using the unified EnrichmentService.
   */
  static async processQueue() {
    console.log('[RotatorService] Starting queue processing...');
    
    await this.autoResetKeys();

    const pendingJobs = await ApiKeyRequestQueue.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(50);
    const failedCompaniesByBranch: Record<string, any[]> = {};

    for (const job of pendingJobs) {
      try {
        job.status = 'processing';
        job.lastAttemptedAt = new Date();
        job.attempts += 1;
        await job.save();

        const company = await Company.findById(job.companyId);
        if (!company) {
          job.status = 'failed';
          await job.save();
          continue;
        }

        const branchIdStr = job.branchId.toString();

        const { EnrichmentService } = await import('./enrichment.service');
        const success = await EnrichmentService.executeFindHr(company._id.toString(), branchIdStr, company.companyName, false, true);

        if (success) {
          job.status = 'completed';
        } else {
          if (job.attempts >= 5) {
            job.status = 'failed';
            if (!failedCompaniesByBranch[branchIdStr]) {
              failedCompaniesByBranch[branchIdStr] = [];
            }
            failedCompaniesByBranch[branchIdStr].push({
              companyId: company._id,
              companyName: company.companyName,
              timestamp: new Date()
            });
          } else {
            job.status = 'pending';
          }
        }
        await job.save();

      } catch (err) {
        console.error(`[RotatorService] Error processing job ${job._id}:`, err);
        if (job.attempts >= 5) {
          job.status = 'failed';
        } else {
          job.status = 'pending';
        }
        await job.save();
      }
    }

    for (const branchId of Object.keys(failedCompaniesByBranch)) {
      const failures = failedCompaniesByBranch[branchId];
      if (failures.length > 0) {
        await BranchNotification.create({
          branchId,
          type: 'error',
          message: `${failures.length} queued enrichments failed permanently during the last processing cycle.`,
          metadata: { failures }
        });
      }
    }
    
    console.log('[RotatorService] Finished queue processing.');
  }
}
