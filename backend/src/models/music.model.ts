import mongoose, { Document, Schema } from 'mongoose';

export interface IMusic extends Document {
    title:           string;
    description:     string;
    artist?:         string;
    coverImagePath?: string;
    audioPath?:      string;
    videoPath?:      string;
    status:          'published' | 'draft';
    createdAt:       Date;
    updatedAt:       Date;
}

const musicSchema = new Schema<IMusic>(
    {
        title:          { type: String, required: true, trim: true },
        description:    { type: String, required: true, trim: true },
        artist:         { type: String, trim: true },
        coverImagePath: { type: String },
        audioPath:      { type: String },
        videoPath:      { type: String },
        status:         { type: String, enum: ['published', 'draft'], default: 'draft' },
    },
    { timestamps: true },
);

musicSchema.index({ status: 1 });

export default mongoose.model<IMusic>('Music', musicSchema);
