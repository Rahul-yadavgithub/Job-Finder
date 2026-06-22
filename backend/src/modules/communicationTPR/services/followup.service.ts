import { FollowUpRepository } from '../repositories/followup.repository';
import { CreateFollowUpInput, UpdateFollowUpStatusInput, FollowUp } from '../types/followup.types';

export class FollowUpService {
  private followUpRepository: FollowUpRepository;

  constructor() {
    this.followUpRepository = new FollowUpRepository();
  }

  private formatFollowUp(row: any): FollowUp {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    return {
      id: row.id,
      companyId: row.company_id,
      companyName: company?.company_name,
      assignedTo: row.assigned_to,
      assignedToName: user?.name,
      followUpDate: row.follow_up_date,
      followUpTime: row.follow_up_time,
      reason: row.reason,
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getMyFollowUps(userId: string): Promise<FollowUp[]> {
    const data = await this.followUpRepository.getFollowUpsByUser(userId);
    return data.map(this.formatFollowUp);
  }

  async getCompanyFollowUps(companyId: string): Promise<FollowUp[]> {
    const data = await this.followUpRepository.getFollowUpsByCompany(companyId);
    return data.map(this.formatFollowUp);
  }

  async createFollowUp(input: CreateFollowUpInput, userId: string): Promise<FollowUp> {
    if (!input.companyId || !input.followUpDate || !input.reason) {
      throw new Error('Missing required fields');
    }
    const data = await this.followUpRepository.createFollowUp(input, userId);
    return this.formatFollowUp(data);
  }

  async updateFollowUpStatus(followUpId: string, input: UpdateFollowUpStatusInput): Promise<FollowUp> {
    const data = await this.followUpRepository.updateFollowUpStatus(followUpId, input);
    return this.formatFollowUp(data);
  }

  async deleteFollowUp(followUpId: string): Promise<boolean> {
    return await this.followUpRepository.deleteFollowUp(followUpId);
  }
}
