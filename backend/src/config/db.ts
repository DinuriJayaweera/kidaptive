import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("❌ MONGO_URI is not defined");
        return;
    }
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", (error as Error).message);
        // Don't exit — server stays up for non-DB routes
    }
}
