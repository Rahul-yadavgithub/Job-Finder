import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IApiKeyUsageLog extends Document {
  branchApiKeyId: Types.ObjectId;
  companyId?: Types.ObjectId;
  requestType: 'validate_key' | 'find_hr' | 'enrich_contact';
  responseStatus: 'success' | 'rate_limited' | 'invalid_key' | 'no_result';
  callsRemainingReported?: number;
  createdAt: Date;
}

const ApiKeyUsageLogSchema: Schema = new Schema(
  {
    branchApiKeyId: { type: Schema.Types.ObjectId, ref: 'BranchApiKey', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    requestType: { 
      type: String, 
      enum: ['validate_key', 'find_hr', 'enrich_contact'], 
      required: true 
    },
    responseStatus: { 
      type: String, 
      enum: ['success', 'rate_limited', 'invalid_key', 'no_result'], 
      required: true 
    },
    callsRemainingReported: { type: Number }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } // Append-only, no update tracking
  }
);

export default mongoose.models.ApiKeyUsageLog || mongoose.model<IApiKeyUsageLog>('ApiKeyUsageLog', ApiKeyUsageLogSchema);
