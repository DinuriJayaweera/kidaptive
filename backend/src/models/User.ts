import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

// ── Types ────────────────────────────────────────────────────────────────────
export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: "parent" | "child" | "admin";
    authProvider: "local" | "google";
    emailVerified: boolean;
    tokenVersion: number;

    // OTP – email verification
    emailOtp?: string;
    emailOtpExpiry?: Date;
    verificationAttempts: number;
    lastVerificationSentAt?: Date;

    // OTP – password reset
    resetOtp?: string;
    resetOtpExpiry?: Date;
    resetOtpAttempts: number;

    // Child-specific
    parentId?: Types.ObjectId;
    username?: string;
    age?: number;
    avatar?: string;
    loginMethod?: "pin" | "password" | "emoji";
    pin?: string;
    emojiPassword?: string;

    createdAt: Date;
    updatedAt: Date;

    // Methods
    comparePassword(candidate: string): Promise<boolean>;
    comparePin(candidate: string): Promise<boolean>;
    compareEmojiPassword(candidate: string): Promise<boolean>;
}

// ── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, required: true },
        role: { type: String, enum: ["parent", "child", "admin"], required: true },
        authProvider: { type: String, enum: ["local", "google"], default: "local" },
        emailVerified: { type: Boolean, default: false },
        tokenVersion: { type: Number, default: 0 },

        // OTP fields
        emailOtp: { type: String },
        emailOtpExpiry: { type: Date },
        verificationAttempts: { type: Number, default: 0 },
        lastVerificationSentAt: { type: Date },

        resetOtp: { type: String },
        resetOtpExpiry: { type: Date },
        resetOtpAttempts: { type: Number, default: 0 },

        // Child-specific
        parentId: { type: Schema.Types.ObjectId, ref: "User" },
        username: { type: String, unique: true, sparse: true, trim: true },
        age: { type: Number },
        avatar: { type: String, default: "default" },
        loginMethod: { type: String, enum: ["pin", "password", "emoji"] },
        pin: { type: String },
        emojiPassword: { type: String },
    },
    { timestamps: true },
);

// ── Pre-save hooks ───────────────────────────────────────────────────────────
userSchema.pre("save", async function () {
    if (this.isModified("password") && this.password) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    if (this.isModified("pin") && this.pin) {
        this.pin = await bcrypt.hash(this.pin, 12);
    }
    if (this.isModified("emojiPassword") && this.emojiPassword) {
        this.emojiPassword = await bcrypt.hash(this.emojiPassword, 12);
    }
});

// ── Instance methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (
    candidate: string,
): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

userSchema.methods.comparePin = async function (
    candidate: string,
): Promise<boolean> {
    if (!this.pin) return false;
    return bcrypt.compare(candidate, this.pin);
};

userSchema.methods.compareEmojiPassword = async function (
    candidate: string,
): Promise<boolean> {
    if (!this.emojiPassword) return false;
    return bcrypt.compare(candidate, this.emojiPassword);
};

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ parentId: 1 });

const User = mongoose.model<IUser>("User", userSchema);
export default User;
