import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  status: 'active' | 'pending';
  ageGroups: string[];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: ['active', 'pending'], default: 'pending' },
    ageGroups: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', categorySchema);

