import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncJob extends Document {
  branchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  syncedRecords: number;
  failedRecords: number;
  syncErrors: Array<{ companyId: string, error: string }>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SyncJobSchema: Schema = new Schema(
  {
    branchId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    totalRecords: { type: Number, default: 0 },
    syncedRecords: { type: Number, default: 0 },
    failedRecords: { type: Number, default: 0 },
    syncErrors: [{ companyId: { type: String }, error: { type: String } }],
    startedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<ISyncJob>('SyncJob', SyncJobSchema);
