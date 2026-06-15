import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHrContact extends Document {
  company_id: Types.ObjectId;
  name?: string;
  mobile?: string;
  email?: string;
  designation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HrContactSchema: Schema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String },
    mobile: { type: String },
    email: { type: String },
    designation: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IHrContact>('HrContact', HrContactSchema);
