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
  companyHash?: string;
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

  // Review & Confirmation
  review_status?: 'scanned' | 'approved';
  confirmation_status?: 'pending' | 'confirmed' | 'not_confirmed';
  contact_status?: 'not_contacted' | 'contacted';
  contact_outcome?: 'call_again' | 'rejected' | 'accepted' | null;
  data_source?: 'scanned' | 'excel_import';

  // Placement Specifics
  drive_type?: string;
  role?: string;
  package?: string;
  expected_month?: string;
  expected_year?: string;
  academic_year?: string;
  
  // Auditing
  reviewed_at?: Date;
  reviewed_by?: string;
  pending_delete?: boolean;

  // Branch Assignment & Sync
  assignedBranch?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastSynced?: Date;
}

const CompanySchema: Schema = new Schema(
  {
    // Core Identity
    companyName: { type: String, required: true },
    normalizedName: { type: String, required: true },
    companyHash: { type: String, unique: true, sparse: true },
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
    careersUrl: { type: String },

    // Review & Confirmation
    review_status: { type: String, enum: ['scanned', 'approved'] },
    confirmation_status: { type: String, enum: ['pending', 'confirmed', 'not_confirmed'] },
    contact_status: { type: String, enum: ['not_contacted', 'contacted'] },
    contact_outcome: { type: String, enum: ['call_again', 'rejected', 'accepted', null] },
    data_source: { type: String, enum: ['scanned', 'excel_import'] },

    // Placement Specifics
    drive_type: { type: String },
    role: { type: String },
    package: { type: String },
    expected_month: { type: String },
    expected_year: { type: String },
    academic_year: { type: String },

    // Auditing
    reviewed_at: { type: Date },
    reviewed_by: { type: String },
    pending_delete: { type: Boolean, default: false },

    // Branch Assignment & Sync
    assignedBranch: { type: String },
    syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
    lastSynced: { type: Date }
  },
  { timestamps: true }
);

// Indexes

CompanySchema.index({ placementScore: -1 });
CompanySchema.index({ review_status: 1, confirmation_status: 1, academic_year: 1, drive_type: 1, role: 1 });

export default mongoose.model<ICompany>('Company', CompanySchema);
