import mongoose, { Schema, Document } from 'mongoose';

export interface IScanHistory extends Document {
  date: Date;
  platform: string;
  branchId?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  phase?: string;
  scraperUsed?: string;
  scraperVersion?: string;
  rawCompaniesFound: number;
  validatedCompanies: number;
  rejectedCompanies: number;
  duplicatesFound: number;
  newCompaniesAdded: number;
  averagePlacementScore: number;
  averageAiConfidence: number;
}

const ScanHistorySchema: Schema = new Schema(
  {
    date: { type: Date, default: Date.now },
    platform: { type: String, required: true },
    branchId: { type: String },
    durationMs: { type: Number, default: 0 },
    status: { type: String, enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'QUEUED' },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
    phase: { type: String, default: 'Initializing' },
    scraperUsed: { type: String },
    scraperVersion: { type: String },
    rawCompaniesFound: { type: Number, default: 0 },
    validatedCompanies: { type: Number, default: 0 },
    rejectedCompanies: { type: Number, default: 0 },
    duplicatesFound: { type: Number, default: 0 },
    newCompaniesAdded: { type: Number, default: 0 },
    averagePlacementScore: { type: Number, default: 0 },
    averageAiConfidence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Sort by most recent scan (history page default view)
ScanHistorySchema.index({ date: -1 });
// Filter by platform when grouping scan results
ScanHistorySchema.index({ platform: 1, date: -1 });

export default mongoose.model<IScanHistory>('ScanHistory', ScanHistorySchema);
