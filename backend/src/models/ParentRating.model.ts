import mongoose, { Schema, Types } from "mongoose";

export interface IParentRating {
    _id: Types.ObjectId;
    parentId: Types.ObjectId;
    parentName: string;
    rating: number;
    feedback?: string;
    createdAt: Date;
    updatedAt: Date;
}

const parentRatingSchema = new Schema<IParentRating>(
    {
        parentId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
        parentName: { type: String, required: true },
        rating:     { type: Number, required: true, min: 1, max: 5 },
        feedback:   { type: String, trim: true, maxlength: 1000 },
    },
    { timestamps: true },
);

parentRatingSchema.index({ parentId: 1 }, { unique: true });
parentRatingSchema.index({ createdAt: -1 });

const ParentRating = mongoose.model<IParentRating>("ParentRating", parentRatingSchema);
export default ParentRating;
