import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  category: 'Circuital' | 'Core';
  sheet_tab_ref?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, enum: ['Circuital', 'Core'], required: true, default: 'Circuital' },
    sheet_tab_ref: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IBranch>('Branch', BranchSchema);
