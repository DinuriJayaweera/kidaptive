import { Request, Response, NextFunction } from 'express';
import Music from '../models/music.model.js';

// GET /api/child/music
export async function getPublishedMusic(req: Request, res: Response, next: NextFunction) {
    try {
        const tracks = await Music.find({ status: 'published' })
            .select('title description artist coverImagePath audioPath videoPath createdAt')
            .sort({ createdAt: -1 })
            .lean();
        res.json(tracks);
    } catch (err) { next(err); }
}

// GET /api/child/music/:id
export async function getPublishedTrack(req: Request, res: Response, next: NextFunction) {
    try {
        const track = await Music.findOne({ _id: req.params.id, status: 'published' })
            .select('title description artist coverImagePath audioPath videoPath')
            .lean();
        if (!track) return res.status(404).json({ message: 'Track not found.' });
        res.json(track);
    } catch (err) { next(err); }
}
