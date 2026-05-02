import User from "../models/User.js";
import { BadRequest, NotFound } from "../utils/AppError.js";

// ── Sanitize parent profile for response ─────────────────────────────────────
function sanitizeParentProfile(user: InstanceType<typeof User>) {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
        memberSince: user.createdAt,
        emailVerified: user.emailVerified,
        authProvider: user.authProvider,
        themePreference: user.themePreference || "system",
        notificationSettings: user.notificationSettings || {
            emailNotifications: true,
            learningReminders: true,
            progressReports: true,
            weeklyDigest: false,
        },
        monitoringSettings: user.monitoringSettings || {
            trackScreenTime: true,
            dailyLimitMinutes: 60,
            contentFiltering: true,
            activityAlerts: false,
        },
        timezone: user.timezone || "UTC",
        dateFormat: user.dateFormat || "MM/DD/YYYY",
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET PARENT PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
export async function getParentProfile(userId: string) {
    const user = await User.findById(userId).select(
        "-password -pin -emailOtp -resetOtp -emailOtpExpiry -resetOtpExpiry -tokenVersion -emojiPassword"
    );
    if (!user) throw NotFound("User not found");
    if (user.role !== "parent") throw BadRequest("Not a parent account");

    // Get child count
    const childCount = await User.countDocuments({ parentId: userId, role: "child" });

    return {
        ...sanitizeParentProfile(user),
        childCount,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PARENT PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
export async function updateParentProfile(
    userId: string,
    data: {
        name?: string;
        phone?: string;
        themePreference?: "light" | "dark" | "system";
        notificationSettings?: {
            emailNotifications?: boolean;
            learningReminders?: boolean;
            progressReports?: boolean;
            weeklyDigest?: boolean;
        };
        monitoringSettings?: {
            trackScreenTime?: boolean;
            dailyLimitMinutes?: number;
            contentFiltering?: boolean;
            activityAlerts?: boolean;
        };
        timezone?: string;
        dateFormat?: string;
    }
) {
    const user = await User.findById(userId);
    if (!user) throw NotFound("User not found");
    if (user.role !== "parent") throw BadRequest("Not a parent account");

    // Update basic fields
    if (data.name !== undefined) {
        if (data.name.trim().length < 2) throw BadRequest("Name must be at least 2 characters");
        user.name = data.name.trim();
    }
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.themePreference !== undefined) user.themePreference = data.themePreference;
    if (data.timezone !== undefined) user.timezone = data.timezone;
    if (data.dateFormat !== undefined) user.dateFormat = data.dateFormat;

    // Merge notification settings
    if (data.notificationSettings) {
        const current = user.notificationSettings || {
            emailNotifications: true,
            learningReminders: true,
            progressReports: true,
            weeklyDigest: false,
        };
        user.notificationSettings = {
            emailNotifications: data.notificationSettings.emailNotifications ?? current.emailNotifications,
            learningReminders: data.notificationSettings.learningReminders ?? current.learningReminders,
            progressReports: data.notificationSettings.progressReports ?? current.progressReports,
            weeklyDigest: data.notificationSettings.weeklyDigest ?? current.weeklyDigest,
        };
    }

    // Merge monitoring settings
    if (data.monitoringSettings) {
        const current = user.monitoringSettings || {
            trackScreenTime: true,
            dailyLimitMinutes: 60,
            contentFiltering: true,
            activityAlerts: false,
        };
        user.monitoringSettings = {
            trackScreenTime: data.monitoringSettings.trackScreenTime ?? current.trackScreenTime,
            dailyLimitMinutes: data.monitoringSettings.dailyLimitMinutes ?? current.dailyLimitMinutes,
            contentFiltering: data.monitoringSettings.contentFiltering ?? current.contentFiltering,
            activityAlerts: data.monitoringSettings.activityAlerts ?? current.activityAlerts,
        };
    }

    await user.save();

    const childCount = await User.countDocuments({ parentId: userId, role: "child" });

    return {
        message: "Profile updated successfully",
        profile: { ...sanitizeParentProfile(user), childCount },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE AVATAR URL
// ═══════════════════════════════════════════════════════════════════════════════
export async function updateParentAvatar(userId: string, avatarUrl: string) {
    const user = await User.findById(userId);
    if (!user) throw NotFound("User not found");
    if (user.role !== "parent") throw BadRequest("Not a parent account");

    user.avatarUrl = avatarUrl;
    await user.save();

    return {
        message: "Avatar updated successfully",
        avatarUrl: user.avatarUrl,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE PARENT ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════════
export async function deleteParentAccount(userId: string, confirmation: string) {
    if (confirmation !== "DELETE") throw BadRequest("Please type DELETE to confirm account deletion");

    const user = await User.findById(userId);
    if (!user) throw NotFound("User not found");
    if (user.role !== "parent") throw BadRequest("Not a parent account");

    // Import models for cleanup
    const CategoryProgress = (await import("../models/categoryProgress.model.js")).default;
    const PlacementResult = (await import("../models/placementResult.model.js")).default;
    const ActivityLog = (await import("../models/activityLog.model.js")).default;

    // Delete all children and their data
    const children = await User.find({ parentId: userId, role: "child" });
    for (const child of children) {
        await CategoryProgress.deleteMany({ childId: child._id });
        await PlacementResult.deleteMany({ childId: child._id });
        await ActivityLog.deleteMany({ childId: child._id });
        await User.deleteOne({ _id: child._id });
    }

    // Delete the parent
    await User.deleteOne({ _id: userId });

    return { message: "Account and all associated data deleted successfully" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD (authenticated)
// ═══════════════════════════════════════════════════════════════════════════════
export async function changeParentPassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
) {
    const user = await User.findById(userId);
    if (!user) throw NotFound("User not found");
    if (user.role !== "parent") throw BadRequest("Not a parent account");

    if (user.authProvider === "google") {
        throw BadRequest("Google accounts cannot change password here.");
    }

    const isMatch = await user.comparePassword(data.currentPassword);
    if (!isMatch) throw BadRequest("Current password is incorrect");

    if (data.newPassword.length < 8) throw BadRequest("New password must be at least 8 characters");
    if (!/[A-Z]/.test(data.newPassword)) throw BadRequest("Password must contain an uppercase letter");
    if (!/[0-9]/.test(data.newPassword)) throw BadRequest("Password must contain a number");
    if (!/[^A-Za-z0-9]/.test(data.newPassword)) throw BadRequest("Password must contain a special character");

    user.password = data.newPassword;
    user.tokenVersion += 1; // Invalidate existing sessions
    await user.save();

    return { message: "Password changed successfully. Please log in again." };
}
