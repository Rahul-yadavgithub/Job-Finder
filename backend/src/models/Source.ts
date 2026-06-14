import mongoose, { Schema, Document } from 'mongoose';

export interface ISource extends Document {
  platformName: string;
  sourceUrl: string;
  sourceType: string;
  scanMethod: string;
  companyCategory: string;
  scanFrequency: string;
  notes?: string;
  isEnabled: boolean;
  lastScanDate?: Date;
  totalJobsCollected: number;
  healthStatus: 'healthy' | 'error' | 'unknown';
}

const SourceSchema: Schema = new Schema(
  {
    platformName: { type: String, required: true, unique: true },
    sourceUrl: { type: String, required: true },
    sourceType: { type: String, required: true },
    scanMethod: { type: String, required: true },
    companyCategory: { type: String, required: true },
    scanFrequency: { type: String, required: true },
    notes: { type: String },
    isEnabled: { type: Boolean, default: true },
    lastScanDate: { type: Date },
    totalJobsCollected: { type: Number, default: 0 },
    healthStatus: { type: String, enum: ['healthy', 'error', 'unknown'], default: 'unknown' },
  },
  { timestamps: true }
);

export default mongoose.model<ISource>('Source', SourceSchema);
