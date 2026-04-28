import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
const envPath = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envPath });

async function migrateGems10x() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI is not defined. Check your .env file.");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        // Find all children who have gems > 0
        const children = await User.find({ role: "child", gems: { $gt: 0 } });

        if (children.length === 0) {
            console.log("ℹ️  No children with gems > 0 found. Nothing to migrate.");
            process.exit(0);
        }

        console.log(`🔄 Found ${children.length} children with gems. Multiplying by 10x...`);

        for (const child of children) {
            const oldGems = child.gems || 0;
            const newGems = oldGems * 10;
            child.gems = newGems;
            await child.save();
            console.log(`   ✅ ${child.name} (${child._id}): ${oldGems} → ${newGems} gems`);
        }

        console.log(`\n🎉 Migration complete! Updated ${children.length} children.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrateGems10x();
