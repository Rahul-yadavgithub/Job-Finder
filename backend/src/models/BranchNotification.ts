import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBranchNotification extends Document {
  branchId: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  isDismissed: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const BranchNotificationSchema: Schema = new Schema(
  {
    branchId: { type: String, required: true },
    type: { type: String, enum: ['warning', 'error', 'info'], required: true },
    message: { type: String, required: true },
    isDismissed: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export default mongoose.models.BranchNotification || mongoose.model<IBranchNotification>('BranchNotification', BranchNotificationSchema);
