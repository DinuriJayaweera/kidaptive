import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import Music from '../models/music.model.js';

const MUSIC_DIR = path.join(process.cwd(), 'uploads', 'music');

function unlinkSafe(filename?: string) {
    if (!filename) return;
    fs.unlink(path.join(MUSIC_DIR, path.basename(filename)), () => {});
}

// GET /api/admin/music
export async function getMusic(req: Request, res: Response, next: NextFunction) {
    try {
        const tracks = await Music.find().sort({ createdAt: -1 }).lean();
        res.json(tracks);
    } catch (err) { next(err); }
}

// POST /api/admin/music
export async function createMusic(req: Request, res: Response, next: NextFunction) {
    try {
        const { title, description, artist, status } = req.body as {
            title?: string; description?: string; artist?: string; status?: string;
        };
        if (!title?.trim())       return res.status(400).json({ message: 'Title is required.' });
        if (!description?.trim()) return res.status(400).json({ message: 'Description is required.' });

        const files      = req.files as Record<string, Express.Multer.File[]> | undefined;
        const audioFile  = files?.audio?.[0];
        const videoFile  = files?.video?.[0];
        const coverFile  = files?.cover?.[0];

        if (!audioFile && !videoFile) {
            return res.status(400).json({ message: 'At least one audio or video file is required.' });
        }

        const track = await Music.create({
            title:          title.trim(),
            description:    description.trim(),
            artist:         artist?.trim() || undefined,
            audioPath:      audioFile?.filename,
            videoPath:      videoFile?.filename,
            coverImagePath: coverFile?.filename,
            status:         status === 'published' ? 'published' : 'draft',
        });

        res.status(201).json(track);
    } catch (err) { next(err); }
}

// PUT /api/admin/music/:id
export async function updateMusic(req: Request, res: Response, next: NextFunction) {
    try {
        const track = await Music.findById(req.params.id);
        if (!track) return res.status(404).json({ message: 'Track not found.' });

        const { title, description, artist, status } = req.body as {
            title?: string; description?: string; artist?: string; status?: string;
        };
        const files     = req.files as Record<string, Express.Multer.File[]> | undefined;
        const audioFile = files?.audio?.[0];
        const videoFile = files?.video?.[0];
        const coverFile = files?.cover?.[0];

        if (title?.trim())        track.title       = title.trim();
        if (description?.trim())  track.description = description.trim();
        if (artist !== undefined) track.artist      = artist.trim() || undefined;
        if (status)               track.status      = status === 'published' ? 'published' : 'draft';

        if (audioFile) {
            unlinkSafe(track.audioPath);
            track.audioPath = audioFile.filename;
        }
        if (videoFile) {
            unlinkSafe(track.videoPath);
            track.videoPath = videoFile.filename;
        }
        if (coverFile) {
            unlinkSafe(track.coverImagePath);
            track.coverImagePath = coverFile.filename;
        }

        await track.save();
        res.json(track);
    } catch (err) { next(err); }
}

// DELETE /api/admin/music/:id
export async function deleteMusic(req: Request, res: Response, next: NextFunction) {
    try {
        const track = await Music.findByIdAndDelete(req.params.id);
        if (!track) return res.status(404).json({ message: 'Track not found.' });

        unlinkSafe(track.audioPath);
        unlinkSafe(track.videoPath);
        unlinkSafe(track.coverImagePath);

        res.json({ message: 'Track deleted.' });
    } catch (err) { next(err); }
}

// PATCH /api/admin/music/:id/status
export async function toggleMusicStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const track = await Music.findById(req.params.id);
        if (!track) return res.status(404).json({ message: 'Track not found.' });

        track.status = track.status === 'published' ? 'draft' : 'published';
        await track.save();
        res.json(track);
    } catch (err) { next(err); }
}
