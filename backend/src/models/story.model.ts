import mongoose, { Document, Schema } from 'mongoose';

export interface IStory extends Document {
    title:          string;
    description:    string;
    coverImagePath?: string;
    pdfPath:        string;
    status:         'published' | 'draft';
    createdAt:      Date;
    updatedAt:      Date;
}

const storySchema = new Schema<IStory>(
    {
        title:          { type: String, required: true, trim: true },
        description:    { type: String, required: true, trim: true },
        coverImagePath: { type: String },
        pdfPath:        { type: String, required: true },
        status:         { type: String, enum: ['published', 'draft'], default: 'draft' },
    },
    { timestamps: true },
);

storySchema.index({ status: 1 });

export default mongoose.model<IStory>('Story', storySchema);
