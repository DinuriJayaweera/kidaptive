import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

// ── Types ────────────────────────────────────────────────────────────────────
export interface INotificationSettings {
    emailNotifications: boolean;
    learningReminders: boolean;
    progressReports: boolean;
    weeklyDigest: boolean;
}

export interface IMonitoringSettings {
    trackScreenTime: boolean;
    dailyLimitMinutes: number;
    contentFiltering: boolean;
    activityAlerts: boolean;
}

export interface IRatingPrompt {
    hasRated: boolean;
    neverAskAgain: boolean;
    lastPromptedAt?: Date;
    notNowCount: number;
}

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

    // Parent profile/settings
    phone?: string;
    avatarUrl?: string;
    themePreference: "light" | "dark" | "system";
    notificationSettings: INotificationSettings;
    monitoringSettings: IMonitoringSettings;
    timezone: string;
    dateFormat: string;

    // Child-specific
    parentId?: Types.ObjectId;
    username?: string;
    age?: number;
    avatar?: string;
    loginMethod?: "pin" | "password" | "emoji";
    pin?: string;
    emojiPassword?: string;

    // Game Stats
    totalXP?: number;
    gems?: number;
    streak?: number;
    lastPlayedDate?: Date;
    placementCompleted?: boolean;

    // Achievement-supporting counters
    // (kept on User so we don't have to scan ActivityLog every render)
    perfectQuizzes?: number;
    everLeveledUp?: boolean;

    ratingPrompt?: IRatingPrompt;

    isActive: boolean;

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

        // Parent profile/settings
        phone: { type: String, trim: true },
        avatarUrl: { type: String },
        themePreference: { type: String, enum: ["light", "dark", "system"], default: "system" },
        notificationSettings: {
            emailNotifications: { type: Boolean, default: true },
            learningReminders: { type: Boolean, default: true },
            progressReports: { type: Boolean, default: true },
            weeklyDigest: { type: Boolean, default: false },
        },
        monitoringSettings: {
            trackScreenTime: { type: Boolean, default: true },
            dailyLimitMinutes: { type: Number, default: 60 },
            contentFiltering: { type: Boolean, default: true },
            activityAlerts: { type: Boolean, default: false },
        },
        timezone: { type: String, default: "UTC" },
        dateFormat: { type: String, default: "MM/DD/YYYY" },

        // Child-specific
        parentId: { type: Schema.Types.ObjectId, ref: "User" },
        username: { type: String, unique: true, sparse: true, trim: true },
        age: { type: Number },
        avatar: { type: String, default: "default" },
        loginMethod: { type: String, enum: ["pin", "password", "emoji"] },
        pin: { type: String },
        emojiPassword: { type: String },

        // Game Stats
        totalXP: { type: Number, default: 0 },
        gems: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastPlayedDate: { type: Date },
        placementCompleted: { type: Boolean, default: false },

        // Achievement-supporting counters
        perfectQuizzes: { type: Number, default: 0 },
        everLeveledUp: { type: Boolean, default: false },

        ratingPrompt: {
            hasRated:       { type: Boolean, default: false },
            neverAskAgain:  { type: Boolean, default: false },
            lastPromptedAt: { type: Date },
            notNowCount:    { type: Number, default: 0 },
        },

        isActive: { type: Boolean, default: true },
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
