import mongoose, { Schema, Types } from "mongoose";

export interface IGameProgress {
    _id: Types.ObjectId;
    childId: Types.ObjectId;
    gameId: string;
    completedLevels: number[];
    highestLevel: number;
    totalGemsEarned: number;
    createdAt: Date;
    updatedAt: Date;
}

const gameProgressSchema = new Schema<IGameProgress>(
    {
        childId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        gameId: { type: String, required: true, trim: true },
        completedLevels: { type: [Number], default: [] },
        highestLevel: { type: Number, default: 0 },
        totalGemsEarned: { type: Number, default: 0 },
    },
    { timestamps: true }
);

gameProgressSchema.index({ childId: 1, gameId: 1 }, { unique: true });

const GameProgress = mongoose.model<IGameProgress>("GameProgress", gameProgressSchema);
export default GameProgress;
