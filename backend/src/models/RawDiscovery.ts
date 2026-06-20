import mongoose, { Schema, Document } from 'mongoose';

export interface IRawDiscovery extends Document {
  scanHistoryId: mongoose.Types.ObjectId;
  companyName: string;
  website?: string;
  description?: string;
  source: string;
  sourceUrl: string;
  careersUrl?: string;
  salaryText?: string;
  normalizedName?: string;
  companyHash?: string;
  validationResult?: any;
  failureReason?: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'DUPLICATE' | 'DISCARDED_LOW_SALARY' | 'MANUALLY_APPROVED';
  createdAt: Date;
  updatedAt: Date;
}

const RawDiscoverySchema: Schema = new Schema(
  {
    scanHistoryId: { type: Schema.Types.ObjectId, ref: 'ScanHistory', required: true },
    companyName: { type: String, required: true },
    website: { type: String },
    description: { type: String },
    source: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    careersUrl: { type: String },
    salaryText: { type: String },
    normalizedName: { type: String },
    companyHash: { type: String },
    validationResult: { type: Schema.Types.Mixed },
    failureReason: { type: String },
    status: { 
      type: String, 
      enum: ['PENDING', 'VALIDATED', 'REJECTED', 'DUPLICATE', 'DISCARDED_LOW_SALARY', 'MANUALLY_APPROVED'], 
      default: 'PENDING' 
    },
  },
  { timestamps: true }
);

// Primary lookup: all raw records for a given scan
RawDiscoverySchema.index({ scanHistoryId: 1, status: 1 });
RawDiscoverySchema.index({ scanHistoryId: 1, createdAt: -1 });

export default mongoose.model<IRawDiscovery>('RawDiscovery', RawDiscoverySchema);
