import mongoose, { Schema, Types } from "mongoose";

export interface IUnlockedGame {
    _id: Types.ObjectId;
    childId: Types.ObjectId;
    gameId: string;
    unlockedAt: Date;
}

const unlockedGameSchema = new Schema<IUnlockedGame>(
    {
        childId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        gameId: { type: String, required: true, trim: true },
    },
    { timestamps: { createdAt: "unlockedAt", updatedAt: false } }
);

unlockedGameSchema.index({ childId: 1, gameId: 1 }, { unique: true });

const UnlockedGame = mongoose.model<IUnlockedGame>("UnlockedGame", unlockedGameSchema);
export default UnlockedGame;
