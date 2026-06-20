import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IApiKeyRequestQueue extends Document {
  branchId: string;
  companyId: string;
  requestType: 'find_hr' | 'enrich_contact';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttemptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeyRequestQueueSchema: Schema = new Schema(
  {
    branchId: { type: String, required: true },
    companyId: { type: String, required: true },
    requestType: { type: String, enum: ['find_hr', 'enrich_contact'], required: true },
    payload: { type: Schema.Types.Mixed },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'], 
      default: 'pending' 
    },
    attempts: { type: Number, default: 0 },
    lastAttemptedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.ApiKeyRequestQueue || mongoose.model<IApiKeyRequestQueue>('ApiKeyRequestQueue', ApiKeyRequestQueueSchema);
