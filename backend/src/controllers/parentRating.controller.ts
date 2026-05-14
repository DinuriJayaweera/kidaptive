import { Request, Response, NextFunction } from "express";
import type { TokenPayload } from "../utils/jwt.js";
import User from "../models/User.js";
import ParentRating from "../models/ParentRating.model.js";
import PlacementQuestion from "../models/placement.model.js";
import QuizQuestion from "../models/quizQuestion.model.js";

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) =>
        fn(req, res).catch(next);

function getUser(req: Request): TokenPayload {
    return (req as Request & { user: TokenPayload }).user;
}

// ── GET /api/parent/rating/prompt-status ─────────────────────────────────────
export const getPromptStatus = wrap(async (req, res) => {
    const user = await User.findById(getUser(req).userId).select("ratingPrompt").lean();
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    const rp = user.ratingPrompt;
    if (rp?.hasRated || rp?.neverAskAgain) {
        res.json({ shouldShow: false });
        return;
    }

    // Cool-off: don't show more than once per 24 h after "Not Now"
    if (rp?.lastPromptedAt) {
        const coolOffMs = 24 * 60 * 60 * 1000;
        if (Date.now() - new Date(rp.lastPromptedAt).getTime() < coolOffMs) {
            res.json({ shouldShow: false });
            return;
        }
    }

    res.json({ shouldShow: true });
});

// ── POST /api/parent/rating ───────────────────────────────────────────────────
export const submitRating = wrap(async (req, res) => {
    const { rating, feedback } = req.body as { rating: number; feedback?: string };
    if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ message: "Rating must be between 1 and 5" });
        return;
    }

    const userId = getUser(req).userId;
    const user = await User.findById(userId).select("name ratingPrompt").lean();
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    await ParentRating.findOneAndUpdate(
        { parentId: userId },
        { parentId: userId, parentName: user.name, rating, feedback: feedback?.trim() || undefined },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await User.updateOne(
        { _id: userId },
        { $set: { "ratingPrompt.hasRated": true } },
    );

    res.json({ message: "Thank you for your feedback!" });
});

// ── POST /api/parent/rating/not-now ──────────────────────────────────────────
export const notNow = wrap(async (req, res) => {
    await User.updateOne(
        { _id: getUser(req).userId },
        {
            $set:  { "ratingPrompt.lastPromptedAt": new Date() },
            $inc:  { "ratingPrompt.notNowCount": 1 },
        },
    );
    res.json({ message: "Dismissed" });
});

// ── POST /api/parent/rating/never-ask ────────────────────────────────────────
export const neverAsk = wrap(async (req, res) => {
    await User.updateOne(
        { _id: getUser(req).userId },
        { $set: { "ratingPrompt.neverAskAgain": true } },
    );
    res.json({ message: "Preference saved" });
});

// ── GET /api/admin/ratings ────────────────────────────────────────────────────
export const getAdminRatings = wrap(async (req, res) => {
    const page  = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(50, parseInt((req.query.limit as string) || "20", 10));
    const skip  = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
        ParentRating.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ParentRating.countDocuments(),
    ]);

    const avgResult = await ParentRating.aggregate([
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const avgRating = avgResult[0]?.avg ?? 0;

    res.json({ ratings, total, page, pages: Math.ceil(total / limit), avgRating });
});

// ── GET /api/ratings/public ───────────────────────────────────────────────────
export const getPublicRatings = wrap(async (req, res) => {
    const ratings = await ParentRating.find({ feedback: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .limit(12)
        .select("parentName rating feedback createdAt")
        .lean();

    // Only expose first name for privacy
    const sanitized = ratings.map((r) => ({
        rating:    r.rating,
        feedback:  r.feedback,
        firstName: (r.parentName || "Parent").split(" ")[0],
        createdAt: r.createdAt,
    }));

    res.json(sanitized);
});

// ── GET /api/stats/public ─────────────────────────────────────────────────────
export const getPublicStats = wrap(async (_req, res) => {
    const [kids, parents, avgResult, questions] = await Promise.all([
        User.countDocuments({ role: "child", isActive: true }),
        User.countDocuments({ role: "parent", isActive: true }),
        ParentRating.aggregate([
            { $group: { _id: null, avg: { $avg: "$rating" } } },
        ]),
        Promise.all([
            PlacementQuestion.countDocuments(),
            QuizQuestion.countDocuments(),
        ]).then(([p, q]) => p + q),
    ]);

    const avgRating = avgResult[0]?.avg ?? 0;

    res.json({
        kids,
        parents,
        avgRating: parseFloat(avgRating.toFixed(1)),
        questions,
    });
});
