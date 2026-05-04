import type { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import type { TokenPayload } from "../utils/jwt.js";

type AuthReq = Request & { user: TokenPayload };

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = (req as AuthReq).user;
        const user = await User.findById(userId)
            .select("name email phone avatarUrl themePreference createdAt")
            .lean();
        if (!user) { res.status(404).json({ message: "User not found" }); return; }
        res.json(user);
    } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = (req as AuthReq).user;
        const { name, email, phone, themePreference } = req.body as { name?: string; email?: string; phone?: string; themePreference?: "light" | "dark" };

        if (!name?.trim()) { res.status(400).json({ message: "Name is required" }); return; }
        if (!email?.trim()) { res.status(400).json({ message: "Email is required" }); return; }

        const dupe = await User.findOne({
            email: email.toLowerCase().trim(),
            _id: { $ne: userId },
        });
        if (dupe) { res.status(400).json({ message: "Email already in use" }); return; }

        const $set: Record<string, string> = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
        };
        if (themePreference) {
            $set.themePreference = themePreference;
        }
        const update: Record<string, unknown> = { $set };
        if (phone?.trim()) {
            $set.phone = phone.trim();
        } else {
            update.$unset = { phone: "" };
        }

        const updated = await User.findByIdAndUpdate(userId, update, {
            new: true,
            select: "name email phone avatarUrl themePreference createdAt",
        }).lean();

        res.json(updated);
    } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { userId } = (req as AuthReq).user;
        const { currentPassword, newPassword } = req.body as {
            currentPassword?: string;
            newPassword?: string;
        };

        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: "currentPassword and newPassword are required" });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ message: "New password must be at least 6 characters" });
            return;
        }

        const user = await User.findById(userId);
        if (!user) { res.status(404).json({ message: "User not found" }); return; }

        const valid = await user.comparePassword(currentPassword);
        if (!valid) { res.status(400).json({ message: "Current password is incorrect" }); return; }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) { next(err); }
}
