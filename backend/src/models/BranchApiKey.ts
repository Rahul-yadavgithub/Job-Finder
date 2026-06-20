import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBranchApiKey extends Document {
  branchId: string;
  platformId: Types.ObjectId;
  encryptedKey: string;
  keyIv: string;
  keyTag: string;
  label: string;
  keyType: 'free' | 'paid';
  resetsMonthly: boolean;
  totalLimit: number;
  callsUsed: number;
  quotaResetsAt?: Date;
  resetDay?: number;
  status: 'validating' | 'active' | 'exhausted' | 'invalid' | 'disabled';
  validatedAt?: Date;
  lastUsedAt?: Date;
  addedBy?: string; // Could be Types.ObjectId if referencing a User model, but using string for flexibility/username
  createdAt: Date;
  updatedAt: Date;
}

const BranchApiKeySchema: Schema = new Schema(
  {
    branchId: { type: String, required: true },
    platformId: { type: Schema.Types.ObjectId, ref: 'ApiPlatform', required: true },
    encryptedKey: { type: String, required: true },
    keyIv: { type: String, required: true },
    keyTag: { type: String, required: true },
    label: { type: String, required: true },
    keyType: { type: String, enum: ['free', 'paid'], required: true },
    resetsMonthly: { type: Boolean, required: true },
    totalLimit: { type: Number, required: true },
    callsUsed: { type: Number, default: 0 },
    quotaResetsAt: { type: Date },
    resetDay: { type: Number, min: 1, max: 31 },
    status: { 
      type: String, 
      enum: ['validating', 'active', 'exhausted', 'invalid', 'disabled'], 
      default: 'validating' 
    },
    validatedAt: { type: Date },
    lastUsedAt: { type: Date },
    addedBy: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.BranchApiKey || mongoose.model<IBranchApiKey>('BranchApiKey', BranchApiKeySchema);
