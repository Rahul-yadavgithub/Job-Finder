import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  googleSheetId: string;
  googleSheetName: string;
  targetWorksheet: string;
  serviceAccountEmail: string; // Stored just for UI display
  lastSyncDate?: Date;
  totalSynced: number;
}

const SettingsSchema: Schema = new Schema(
  {
    googleSheetId: { type: String, default: '' },
    googleSheetName: { type: String, default: '' },
    targetWorksheet: { type: String, default: 'Sheet1' },
    serviceAccountEmail: { type: String, default: '' },
    lastSyncDate: { type: Date },
    totalSynced: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
