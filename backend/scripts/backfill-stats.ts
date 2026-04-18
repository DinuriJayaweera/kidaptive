import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import PlacementResult from "../src/models/placementResult.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kidaptive";

const getXPForScore = (s: number) => {
    if (s < 50) return 0;
    if (s < 60) return 20;
    if (s < 70) return 40;
    if (s < 75) return 60;
    if (s < 85) return 80;
    return 100;
};

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const children = await User.find({ role: "child" });
        console.log(`Found ${children.length} children.`);

        for (const child of children) {
            const placement = await PlacementResult.findOne({ childId: child._id });
            if (!placement || !placement.placementCompleted) {
                console.log(`Skipping ${child.name} (no completed placement)`);
                continue;
            }

            let totalPlacementXP = 0;
            let earnedGems = 0;

            for (const result of placement.categoryResults) {
                totalPlacementXP += getXPForScore(result.score);
                if (result.level === "starter") earnedGems += 1;
                else if (result.level === "explorer") earnedGems += 3;
                else if (result.level === "champion") earnedGems += 5;
            }

            const averageXP = placement.categoryResults.length > 0 
                ? Math.round(totalPlacementXP / placement.categoryResults.length)
                : 0;

            let updated = false;

            if ((child.totalXP === undefined || child.totalXP === 0) && averageXP > 0) {
                child.totalXP = averageXP;
                updated = true;
                console.log(`- ${child.name}: updating totalXP to ${averageXP}`);
            }

            if ((child.gems === undefined || child.gems === 0) && earnedGems > 0) {
                child.gems = earnedGems;
                updated = true;
                console.log(`- ${child.name}: updating gems to ${earnedGems}`);
            }

            if (!child.placementCompleted) {
                child.placementCompleted = true;
                updated = true;
                console.log(`- ${child.name}: updating placementCompleted to true`);
            }

            if (updated) {
                await child.save();
            }
        }

        console.log("Backfill complete.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
