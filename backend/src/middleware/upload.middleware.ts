import multer from 'multer';
import path from 'path';
import fs from 'fs';

const STORIES_DIR = path.join(process.cwd(), 'uploads', 'stories');
if (!fs.existsSync(STORIES_DIR)) fs.mkdirSync(STORIES_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, STORIES_DIR),
    filename: (_req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, name);
    },
});

function fileFilter(
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) {
    if (file.fieldname === 'pdf' && file.mimetype === 'application/pdf') return cb(null, true);
    if (file.fieldname === 'cover' && file.mimetype.startsWith('image/'))  return cb(null, true);
    cb(new Error(`Invalid file type for field "${file.fieldname}".`));
}

export const storyUpload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
    fileFilter,
});
