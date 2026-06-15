import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICompanyStatusHistory extends Document {
  company_id: Types.ObjectId;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyStatusHistorySchema: Schema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    field_changed: { type: String, required: true },
    old_value: { type: String },
    new_value: { type: String },
    changed_by: { type: String },
    changed_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

CompanyStatusHistorySchema.index({ company_id: 1, changed_at: -1 });

export default mongoose.model<ICompanyStatusHistory>('CompanyStatusHistory', CompanyStatusHistorySchema);
