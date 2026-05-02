import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

const envPath = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envPath });

async function resetAdminPassword() {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGO_URI) {
        console.error("Missing ADMIN_EMAIL, ADMIN_PASSWORD, or MONGO_URI in .env");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const admin = await User.findOne({ email: ADMIN_EMAIL, role: "admin" });

    if (!admin) {
        console.error(`No admin found with email: ${ADMIN_EMAIL}`);
        process.exit(1);
    }

    admin.password = ADMIN_PASSWORD; // The User model's pre-save hook will hash it
    await admin.save();

    console.log(`✅ Password reset successfully for: ${ADMIN_EMAIL}`);
    console.log(`   New password: ${ADMIN_PASSWORD}`);
    process.exit(0);
}

resetAdminPassword().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
