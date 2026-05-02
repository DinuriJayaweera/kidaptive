/**
 * Diagnostic script — check what's actually in CategoryProgress.
 *
 * Run this to see if earnedLevels is being recorded when children level up.
 *
 * Usage:
 *   npx tsx backend/src/scripts/diagnoseEarnedLevels.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import CategoryProgress from "../models/categoryProgress.model.js";
import PlacementResult from "../models/placementResult.model.js";
import User from "../models/User.js";

dotenv.config();

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error("Missing MONGO_URI");
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected.\n");

    // Find all children
    const children = await User.find({ role: "child" }).select("_id name");
    console.log(`Found ${children.length} children.\n`);

    for (const child of children) {
        console.log(`\n── ${child.name} (${child._id}) ──`);

        const placement = await PlacementResult.findOne({ childId: child._id });
        const progress = await CategoryProgress.find({ childId: child._id });

        if (!placement) {
            console.log("  No placement result.");
            continue;
        }

        console.log(`  Placement completed: ${placement.placementCompleted}`);
        console.log(`  Categories tested: ${placement.categoryResults.length}`);

        for (const cat of placement.categoryResults) {
            const p = progress.find((pr) => pr.categoryId === cat.categoryId);

            console.log(`\n  Category: ${cat.categoryId}`);
            console.log(`    Placed at: ${cat.level}`);
            if (p) {
                console.log(`    Current level: ${p.level}`);
                console.log(`    Champion wins: ${p.championWins || 0}`);
                console.log(`    Quizzes completed: ${p.globalQuizzesCompleted || 0}`);
                console.log(`    earnedLevels: ${JSON.stringify(p.earnedLevels || [])}`);

                // Check if earnedLevels makes sense
                if (p.level === "champion" && (!p.earnedLevels || p.earnedLevels.length === 0)) {
                    console.log(`    ⚠️  WARNING: At champion but earnedLevels is empty!`);
                    if (cat.level === "champion") {
                        console.log(`       → Placed at champion (didn't earn it)`);
                    } else {
                        console.log(`       → Leveled up to champion but earnedLevels not recorded!`);
                        console.log(`       → This means quiz.service.ts isn't recording properly.`);
                    }
                }

                if (p.level === "explorer" && (!p.earnedLevels || !p.earnedLevels.includes("explorer"))) {
                    if (cat.level !== "explorer") {
                        console.log(`    ⚠️  WARNING: At explorer but earnedLevels missing "explorer"!`);
                    }
                }
            } else {
                console.log(`    No CategoryProgress record found.`);
            }
        }
    }

    console.log("\n\n──────────────────────────────────────");
    console.log("SUMMARY");
    console.log("──────────────────────────────────────");

    const allProgress = await CategoryProgress.find({});
    const withEarnedLevels = allProgress.filter((p) => p.earnedLevels && p.earnedLevels.length > 0);
    const atChampion = allProgress.filter((p) => p.level === "champion");
    const atChampionNoEarned = atChampion.filter((p) => !p.earnedLevels || p.earnedLevels.length === 0);

    console.log(`\nTotal CategoryProgress docs: ${allProgress.length}`);
    console.log(`Docs with earnedLevels populated: ${withEarnedLevels.length}`);
    console.log(`Docs at champion level: ${atChampion.length}`);
    console.log(`Docs at champion but earnedLevels empty: ${atChampionNoEarned.length}`);

    if (atChampionNoEarned.length > 0) {
        console.log("\n⚠️  You have children at champion with empty earnedLevels.");
        console.log("This means EITHER:");
        console.log("  1. They were placed at champion (correct — they didn't earn it)");
        console.log("  2. OR quiz.service.ts isn't recording earnedLevels (bug)");
        console.log("\nCheck the per-child output above to see which.");
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error("Diagnostic failed:", err);
    process.exit(1);
});
