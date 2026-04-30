/**
 * Backfill script — CORRECTED logic for earnedLevels.
 *
 * Key rule: A child can't earn Champion without first earning Explorer.
 * The progression is ALWAYS: Starter → Explorer → Champion.
 *
 * To infer what legacy children earned, we cross-reference their
 * CURRENT level with their PLACEMENT level:
 *
 * - Placed at Starter → currently at Explorer = earned Explorer ✓
 * - Placed at Starter → currently at Champion = earned Explorer + Champion ✓
 * - Placed at Explorer → currently at Explorer = earned nothing (started there)
 * - Placed at Explorer → currently at Champion = earned Champion only ✓
 * - Placed at Champion → currently at Champion = earned nothing (started there)
 *
 * Safe to re-run (uses $addToSet).
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import CategoryProgress from "../models/categoryProgress.model.js";
import PlacementResult from "../models/placementResult.model.js";
import { backfillAllChildren } from "../services/achievements.service.js";

dotenv.config();

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error("Missing MONGO_URI / MONGODB_URI in env");
        process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.\n");

    // ── Phase 1: Seed earnedLevels ──
    console.log("Phase 1: Seeding earnedLevels for legacy children...");
    const allProgress = await CategoryProgress.find({});
    let seeded = 0;

    for (const p of allProgress) {
        // Skip if earnedLevels is already populated (not legacy)
        if (p.earnedLevels && p.earnedLevels.length > 0) {
            continue;
        }

        // Find what level they were PLACED at
        const placement = await PlacementResult.findOne({ childId: p.childId });
        let placedLevel = "starter"; // default assumption
        if (placement) {
            const catResult = placement.categoryResults.find(
                (c: any) => c.categoryId === p.categoryId,
            );
            if (catResult?.level) {
                placedLevel = catResult.level;
            }
        }

        const currentLevel = p.level;
        const toAdd: ("explorer" | "champion")[] = [];

        // ── Inference rules ──
        if (placedLevel === "starter") {
            // They started at starter, so any progression past that was earned.
            if (currentLevel === "explorer" || currentLevel === "champion") {
                toAdd.push("explorer");
            }
            if (currentLevel === "champion") {
                toAdd.push("champion");
            }
        } else if (placedLevel === "explorer") {
            // They started at explorer, so only champion was earned (if they reached it).
            if (currentLevel === "champion") {
                toAdd.push("champion");
                // Edge case: if they're at champion but we inferred they started
                // at explorer, they MUST have gone through explorer to get to
                // champion. But since they were placed at explorer, explorer
                // itself wasn't "earned" — only champion was.
                // HOWEVER: the quiz progression from explorer → champion still
                // counts as earning champion. We DON'T add explorer here because
                // they started there.
            }
        }
        // If placedLevel === "champion", they earned nothing (started at top).

        if (toAdd.length > 0) {
            await CategoryProgress.updateOne(
                { _id: p._id },
                { $addToSet: { earnedLevels: { $each: toAdd } } },
            );
            seeded++;
        }
    }
    console.log(`   Seeded earnedLevels on ${seeded} CategoryProgress docs.\n`);

    // ── Phase 2: Run achievement evaluator ──
    console.log("Phase 2: Running achievement evaluator for all children...");
    const start = Date.now();
    const { childrenProcessed, totalUnlocked } = await backfillAllChildren();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(
        `   ✅ Done in ${elapsed}s` +
        `\n   Children processed: ${childrenProcessed}` +
        `\n   New achievements unlocked: ${totalUnlocked}\n`,
    );

    await mongoose.disconnect();
    console.log("Disconnected. Backfill complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
});
