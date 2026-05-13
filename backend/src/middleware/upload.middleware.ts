import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ── helpers ─────────────────────────────────────────────────────────────────
function makeStorage(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, dir),
        filename:    (_req, file,  cb) => {
            const ext  = path.extname(file.originalname).toLowerCase();
            const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            cb(null, name);
        },
    });
}

// ── Stories upload ───────────────────────────────────────────────────────────
const STORIES_DIR = path.join(process.cwd(), 'uploads', 'stories');

function storyFilter(
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) {
    if (file.fieldname === 'pdf'   && file.mimetype === 'application/pdf') return cb(null, true);
    if (file.fieldname === 'cover' && file.mimetype.startsWith('image/'))  return cb(null, true);
    cb(new Error(`Invalid file type for field "${file.fieldname}".`));
}

export const storyUpload = multer({
    storage:    makeStorage(STORIES_DIR),
    limits:     { fileSize: 50 * 1024 * 1024 },
    fileFilter: storyFilter,
});

// ── Music upload ─────────────────────────────────────────────────────────────
const MUSIC_DIR = path.join(process.cwd(), 'uploads', 'music');

const AUDIO_MIMES = new Set([
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-flac', 'audio/mp4',
    'audio/webm',
]);

const VIDEO_MIMES = new Set([
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska', 'video/mpeg',
]);

function musicFilter(
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) {
    if (file.fieldname === 'audio' && AUDIO_MIMES.has(file.mimetype)) return cb(null, true);
    if (file.fieldname === 'video' && VIDEO_MIMES.has(file.mimetype)) return cb(null, true);
    if (file.fieldname === 'cover' && file.mimetype.startsWith('image/'))  return cb(null, true);
    cb(new Error(`Invalid file type for field "${file.fieldname}".`));
}

export const musicUpload = multer({
    storage:    makeStorage(MUSIC_DIR),
    limits:     { fileSize: 50 * 1024 * 1024 },
    fileFilter: musicFilter,
});
