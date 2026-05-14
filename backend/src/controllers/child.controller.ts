import { Request, Response } from "express";
import type { TokenPayload } from "../utils/jwt.js";
import User from "../models/User.js";

type AuthRequest = Request & { user: TokenPayload };

// ── GET /child/profile ──────────────────────────────────────────────────────
export const getChildProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const child = await User.findById(userId).select(
            "name username age avatar totalXP gems streak role"
        );
        if (!child || child.role !== "child") {
            return res.status(404).json({ message: "Child profile not found." });
        }
        res.json({
            _id: child._id,
            name: child.name,
            username: child.username,
            age: child.age,
            avatar: child.avatar,
            totalXP: child.totalXP ?? 0,
            gems: child.gems ?? 0,
            streak: child.streak ?? 0,
        });
    } catch (error) {
        console.error("Error in getChildProfile:", error);
        res.status(500).json({ message: "Failed to load child profile." });
    }
};

// ── PATCH /child/profile/avatar ─────────────────────────────────────────────
export const updateChildAvatar = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { avatar } = req.body;

        if (!avatar || typeof avatar !== "string") {
            return res.status(400).json({ message: "Avatar value is required." });
        }

        // Validate: must be an emoji (single char or emoji sequence) or a data URL
        const isDataUrl = avatar.startsWith("data:");
        const isEmoji = !isDataUrl && avatar.length <= 12; // emoji sequences are short
        if (!isDataUrl && !isEmoji) {
            return res.status(400).json({ message: "Invalid avatar format." });
        }

        const child = await User.findOneAndUpdate(
            { _id: userId, role: "child" },
            { avatar },
            { new: true }
        );

        if (!child) {
            return res.status(404).json({ message: "Child not found." });
        }

        res.json({ message: "Avatar updated successfully.", avatar: child.avatar });
    } catch (error) {
        console.error("Error in updateChildAvatar:", error);
        res.status(500).json({ message: "Failed to update avatar." });
    }
};

// ── PATCH /child/profile ────────────────────────────────────────────────────
// Allows child to update limited fields (only name for now, age is parent-controlled)
export const updateChildProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { avatar } = req.body;

        const updates: { avatar?: string } = {};
        if (avatar !== undefined) updates.avatar = avatar;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields to update." });
        }

        const child = await User.findOneAndUpdate(
            { _id: userId, role: "child" },
            updates,
            { new: true }
        ).select("name username age avatar totalXP gems streak");

        if (!child) {
            return res.status(404).json({ message: "Child not found." });
        }

        res.json({ message: "Profile updated successfully.", child });
    } catch (error) {
        console.error("Error in updateChildProfile:", error);
        res.status(500).json({ message: "Failed to update profile." });
    }
};