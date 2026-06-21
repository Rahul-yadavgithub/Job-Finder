import { ActivityRepository } from '../repositories/activity.repository';
import { CreateActivityInput, CompanyActivity } from '../types/activity.types';

export class ActivityService {
  private activityRepository: ActivityRepository;

  constructor() {
    this.activityRepository = new ActivityRepository();
  }

  async getActivitiesByCompany(companyId: string): Promise<CompanyActivity[]> {
    const data = await this.activityRepository.getActivitiesByCompany(companyId);
    
    return data.map((row: any) => ({
      id: row.id,
      companyId: row.company_id,
      userId: row.user_id,
      userName: row.users?.name,
      userBranch: row.users?.branches?.name,
      activityType: row.activity_type,
      notes: row.notes,
      metadata: row.metadata,
      createdAt: row.created_at
    }));
  }

  async createActivity(input: CreateActivityInput, userId: string) {
    if (!input.companyId || !input.activityType || !input.notes) {
      throw new Error('Missing required fields for activity creation');
    }
    return this.activityRepository.createActivity(input, userId);
  }
}
