import mongoose, { Document, Schema, Types } from "mongoose";

export type ActivityType = "practice" | "quiz_complete" | "xp_earned";

export interface IActivityLog extends Document {
    childId: Types.ObjectId;
    type: ActivityType;
    categoryId?: string;
    description: string;
    xp?: number;
    quizzes?: number;
    durationSeconds?: number;
    score?: number;
    createdAt: Date;
    updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
    {
        childId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["practice", "quiz_complete", "xp_earned"], required: true },
        categoryId: { type: String },
        description: { type: String, required: true },
        xp: { type: Number },
        quizzes: { type: Number },
        durationSeconds: { type: Number },
        score: { type: Number },
    },
    { timestamps: true },
);

activityLogSchema.index({ childId: 1, createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
export default ActivityLog;
