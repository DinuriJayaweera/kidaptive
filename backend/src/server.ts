import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { verifySmtpConnection } from "./utils/email.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Start Express immediately
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Connect to MongoDB in background
connectDB().catch((err) => {
    console.error("❌ MongoDB failed:", err.message ?? err);
});

// Verify SMTP in background
verifySmtpConnection();