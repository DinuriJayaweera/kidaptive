import { Request, Response, NextFunction } from 'express';
import Story from '../models/story.model.js';

// GET /api/child/stories — all published stories
export async function getPublishedStories(req: Request, res: Response, next: NextFunction) {
    try {
        const stories = await Story.find({ status: 'published' })
            .select('title description coverImagePath createdAt')
            .sort({ createdAt: -1 })
            .lean();
        res.json(stories);
    } catch (err) { next(err); }
}

// GET /api/child/stories/:id — single published story
export async function getPublishedStory(req: Request, res: Response, next: NextFunction) {
    try {
        const story = await Story.findOne({ _id: req.params.id, status: 'published' })
            .select('title description coverImagePath pdfPath')
            .lean();
        if (!story) return res.status(404).json({ message: 'Story not found.' });
        res.json(story);
    } catch (err) { next(err); }
}
