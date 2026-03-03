import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables based on the current environment
const envPath = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envPath });

async function seedAdmin() {
    console.log("Starting admin seeding process...");

    const {
        ADMIN_NAME,
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        MONGO_URI
    } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGO_URI) {
        console.error("Missing required environment variables. Please check your .env file.");
        console.error("Required vars: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL, role: "admin" });

        if (existingAdmin) {
            console.log(`Admin with email ${ADMIN_EMAIL} already exists. No action taken.`);
            process.exit(0);
        }

        const admin = new User({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: "admin",
            authProvider: "local",
            emailVerified: true // Ensure the admin is verified automatically
        });

        // The save middleware will hash the password
        await admin.save();

        console.log(`Successfully created admin user: ${ADMIN_EMAIL}`);
        process.exit(0);

    } catch (error) {
        console.error("Error during admin seeding:", error);
        process.exit(1);
    }
}

seedAdmin();
