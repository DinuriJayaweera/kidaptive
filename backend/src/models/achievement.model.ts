import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Achievement Model
 *
 * Stores ONE document per (child, achievementKey) pair, created the
 * moment the child unlocks an achievement. Locked achievements are NOT
 * stored — they're only known to exist via the static catalog in
 * `services/achievements.service.ts`. Progress for locked achievements
 * is computed live from existing child data, so this collection only
 * needs to persist the *unlock event*.
 */
export interface IAchievement extends Document {
    childId: Types.ObjectId;
    /** Stable key matching the catalog (e.g. "first_crown", "on_fire"). */
    achievementKey: string;
    unlockedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
    {
        childId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        achievementKey: { type: String, required: true },
        unlockedAt: { type: Date, default: () => new Date() },
    },
    { timestamps: true },
);

// One unlock per (child, key) pair — prevents accidental duplicates
achievementSchema.index({ childId: 1, achievementKey: 1 }, { unique: true });

const Achievement = mongoose.model<IAchievement>("Achievement", achievementSchema);
export default Achievement;
