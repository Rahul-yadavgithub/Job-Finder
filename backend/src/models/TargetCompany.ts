import mongoose, { Schema, Document } from 'mongoose';

export interface ITargetCompany extends Document {
  company_name: string;
  expected_month?: string;
  expected_year?: string;
  drive_type?: string;
  role?: string;
  package?: string;
  academic_year?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TargetCompanySchema: Schema = new Schema(
  {
    company_name: { type: String, required: true },
    expected_month: { type: String },
    expected_year: { type: String },
    drive_type: { type: String },
    role: { type: String },
    package: { type: String },
    academic_year: { type: String }
  },
  { timestamps: true }
);

TargetCompanySchema.index({ company_name: 1, academic_year: 1 });

export default mongoose.model<ITargetCompany>('TargetCompany', TargetCompanySchema);
