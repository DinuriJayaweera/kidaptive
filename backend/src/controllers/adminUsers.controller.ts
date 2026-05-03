import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import CategoryProgress from "../models/categoryProgress.model.js";
import PlacementResult from "../models/placementResult.model.js";
import ActivityLog from "../models/activityLog.model.js";

const SAFE_SELECT =
    "-password -emailOtp -emailOtpExpiry -resetOtp -resetOtpExpiry -tokenVersion -pin -emojiPassword -verificationAttempts -resetOtpAttempts";

// GET /api/admin/users
export async function getUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const role = req.query.role as string;
        const status = req.query.status as string;
        const search = (req.query.search as string)?.trim();

        const filter: Record<string, unknown> = {};

        if (role && role !== "all") filter.role = role;
        if (status === "active") filter.isActive = true;
        else if (status === "suspended") filter.isActive = false;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { username: { $regex: search, $options: "i" } },
            ];
        }

        const [users, total, counts] = await Promise.all([
            User.find(filter)
                .select(SAFE_SELECT)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
            ]),
        ]);

        const roleCounts: Record<string, number> = { parent: 0, child: 0, admin: 0 };
        for (const c of counts) roleCounts[c._id] = c.count;

        // Normalise isActive for legacy docs that predate the field (treat missing as true)
        const normalisedUsers = users.map((u) => ({
            ...u,
            isActive: u.isActive !== false,
        }));

        res.json({
            users: normalisedUsers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            summary: {
                total: total,
                parent: roleCounts.parent,
                child: roleCounts.child,
                admin: roleCounts.admin,
            },
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/admin/users/:id
export async function getUserById(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.params.id).select(SAFE_SELECT).lean();
        if (!user) return res.status(404).json({ message: "User not found." });

        // For children, also return parent name
        let parentName: string | null = null;
        if (user.role === "child" && user.parentId) {
            const parent = await User.findById(user.parentId).select("name").lean();
            parentName = parent?.name ?? null;
        }

        // For parents, count children
        let childCount = 0;
        if (user.role === "parent") {
            childCount = await User.countDocuments({ parentId: user._id });
        }

        res.json({ ...user, isActive: user.isActive !== false, parentName, childCount });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/admin/users/:id/status
export async function toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ message: "isActive must be a boolean." });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (user.role === "admin") {
            return res.status(403).json({ message: "Cannot suspend admin accounts." });
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            message: `User ${isActive ? "activated" : "suspended"} successfully.`,
            isActive: user.isActive,
        });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (user.role === "admin") {
            return res.status(403).json({ message: "Cannot delete admin accounts." });
        }

        if (user.role === "parent") {
            // Cascade: delete all children and their data
            const children = await User.find({ parentId: user._id }).select("_id").lean();
            const childIds = children.map((c) => c._id);
            await Promise.all([
                User.deleteMany({ parentId: user._id }),
                CategoryProgress.deleteMany({ childId: { $in: childIds } }),
                PlacementResult.deleteMany({ childId: { $in: childIds } }),
                ActivityLog.deleteMany({ childId: { $in: childIds } }),
            ]);
        } else if (user.role === "child") {
            await Promise.all([
                CategoryProgress.deleteMany({ childId: user._id }),
                PlacementResult.deleteMany({ childId: user._id }),
                ActivityLog.deleteMany({ childId: user._id }),
            ]);
        }

        await user.deleteOne();
        res.json({ message: "User deleted successfully." });
    } catch (err) {
        next(err);
    }
}

// GET /api/admin/users/stats
export async function getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
        const [total, active, suspended, byRole, recentSignups] = await Promise.all([
            User.countDocuments(),
            // Treat docs without isActive field as active (legacy data)
            User.countDocuments({ $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
            User.countDocuments({ isActive: false }),
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
            User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),
        ]);

        const roles: Record<string, number> = { parent: 0, child: 0, admin: 0 };
        for (const r of byRole) roles[r._id] = r.count;

        res.json({ total, active, suspended, roles, recentSignups });
    } catch (err) {
        next(err);
    }
}
