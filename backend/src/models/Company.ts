import mongoose, { Schema, Document } from 'mongoose';

export enum CompanyStatus {
  DISCOVERED = 'DISCOVERED',
  VALIDATING = 'VALIDATING',
  ENRICHING = 'ENRICHING',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONTACTED = 'CONTACTED',
  RESPONDED = 'RESPONDED'
}

export interface ICompany extends Document {
  // Core Identity
  companyName: string;
  normalizedName: string;
  website?: string;
  description?: string;
  category?: string;
  foundedYear?: string;
  teamSize?: string;
  fundingStage?: string;
  startupSignals: string[];

  // Discovery & Source
  source: {
    platform: string;
    sourceUrl: string;
    careersUrl?: string;
    discoveryMethod?: 'DISCOVERY' | 'DIRECT';
    discoveredAt: Date;
  };
  discoveryHistory: Array<{
    platform: string;
    sourceUrl: string;
    discoveredAt: Date;
  }>;

  // Hiring & Placement Intelligence
  hiringType?: string;
  internshipAvailable?: boolean;
  fresherHiring?: boolean;
  salaryRawText?: string;
  salaryBand?: string;
  stipendRawText?: string;
  stipendBand?: string;
  placementScore: number;
  placementPriority?: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  aiConfidence: number;

  // Status & Outreach
  status: CompanyStatus;
  outreachStatus?: string;
  lastContactDate?: Date;
  nextFollowupDate?: Date;
  contactOwner?: string;
  responseStatus?: string;
  notes?: string;

  // Contact Discovery
  hrEmail?: string;
  talentAcquisitionEmail?: string;
  founderEmail?: string;
  linkedinCompanyUrl?: string;
  linkedinRecruiterUrl?: string;
  careersUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    // Core Identity
    companyName: { type: String, required: true },
    normalizedName: { type: String, required: true },
    website: { type: String },
    description: { type: String },
    category: { type: String },
    foundedYear: { type: String },
    teamSize: { type: String },
    fundingStage: { type: String },
    startupSignals: [{ type: String }],

    // Discovery & Source
    source: {
      platform: { type: String, required: true },
      sourceUrl: { type: String, required: true },
      careersUrl: { type: String },
      discoveryMethod: { type: String, enum: ['DISCOVERY', 'DIRECT'] },
      discoveredAt: { type: Date, default: Date.now }
    },
    discoveryHistory: [
      {
        platform: { type: String, required: true },
        sourceUrl: { type: String, required: true },
        discoveredAt: { type: Date, default: Date.now }
      }
    ],

    // Hiring & Placement Intelligence
    hiringType: { type: String },
    internshipAvailable: { type: Boolean, default: false },
    fresherHiring: { type: Boolean, default: false },
    salaryRawText: { type: String },
    salaryBand: { type: String },
    stipendRawText: { type: String },
    stipendBand: { type: String },
    placementScore: { type: Number, default: 0 },
    placementPriority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
    confidenceScore: { type: Number, default: 0 },
    aiConfidence: { type: Number, default: 0 },

    // Status & Outreach
    status: {
      type: String,
      enum: Object.values(CompanyStatus),
      default: CompanyStatus.DISCOVERED,
      index: true
    },
    outreachStatus: { type: String, default: 'NOT_CONTACTED' },
    lastContactDate: { type: Date },
    nextFollowupDate: { type: Date },
    contactOwner: { type: String },
    responseStatus: { type: String },
    notes: { type: String },

    // Contact Discovery
    hrEmail: { type: String },
    talentAcquisitionEmail: { type: String },
    founderEmail: { type: String },
    linkedinCompanyUrl: { type: String },
    linkedinRecruiterUrl: { type: String },
    careersUrl: { type: String }
  },
  { timestamps: true }
);

// Indexes
CompanySchema.index({ normalizedName: 1 }, { unique: true });
CompanySchema.index({ placementScore: -1 });

export default mongoose.model<ICompany>('Company', CompanySchema);
