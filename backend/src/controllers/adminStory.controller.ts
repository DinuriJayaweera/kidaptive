import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import Story from '../models/story.model.js';

const STORIES_DIR = path.join(process.cwd(), 'uploads', 'stories');

function unlinkSafe(filename?: string) {
    if (!filename) return;
    fs.unlink(path.join(STORIES_DIR, path.basename(filename)), () => {});
}

// GET /api/admin/stories
export async function getStories(req: Request, res: Response, next: NextFunction) {
    try {
        const stories = await Story.find().sort({ createdAt: -1 }).lean();
        res.json(stories);
    } catch (err) { next(err); }
}

// POST /api/admin/stories
export async function createStory(req: Request, res: Response, next: NextFunction) {
    try {
        const { title, description, status } = req.body as {
            title?: string; description?: string; status?: string;
        };
        if (!title?.trim())       return res.status(400).json({ message: 'Title is required.' });
        if (!description?.trim()) return res.status(400).json({ message: 'Description is required.' });

        const files     = req.files as Record<string, Express.Multer.File[]> | undefined;
        const pdfFile   = files?.pdf?.[0];
        const coverFile = files?.cover?.[0];

        if (!pdfFile) return res.status(400).json({ message: 'PDF file is required.' });

        const story = await Story.create({
            title:          title.trim(),
            description:    description.trim(),
            pdfPath:        pdfFile.filename,
            coverImagePath: coverFile?.filename,
            status:         status === 'published' ? 'published' : 'draft',
        });

        res.status(201).json(story);
    } catch (err) { next(err); }
}

// PUT /api/admin/stories/:id
export async function updateStory(req: Request, res: Response, next: NextFunction) {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found.' });

        const { title, description, status } = req.body as {
            title?: string; description?: string; status?: string;
        };
        const files     = req.files as Record<string, Express.Multer.File[]> | undefined;
        const pdfFile   = files?.pdf?.[0];
        const coverFile = files?.cover?.[0];

        if (title?.trim())       story.title       = title.trim();
        if (description?.trim()) story.description = description.trim();
        if (status)              story.status      = status === 'published' ? 'published' : 'draft';

        if (pdfFile) {
            unlinkSafe(story.pdfPath);
            story.pdfPath = pdfFile.filename;
        }
        if (coverFile) {
            unlinkSafe(story.coverImagePath);
            story.coverImagePath = coverFile.filename;
        }

        await story.save();
        res.json(story);
    } catch (err) { next(err); }
}

// DELETE /api/admin/stories/:id
export async function deleteStory(req: Request, res: Response, next: NextFunction) {
    try {
        const story = await Story.findByIdAndDelete(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found.' });

        unlinkSafe(story.pdfPath);
        unlinkSafe(story.coverImagePath);

        res.json({ message: 'Story deleted.' });
    } catch (err) { next(err); }
}

// PATCH /api/admin/stories/:id/status
export async function toggleStoryStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found.' });

        story.status = story.status === 'published' ? 'draft' : 'published';
        await story.save();
        res.json(story);
    } catch (err) { next(err); }
}
