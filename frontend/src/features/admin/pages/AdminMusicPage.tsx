import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Paper, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Button, IconButton, CircularProgress, Alert,
    Select, MenuItem, FormControl, InputLabel, Tooltip, Zoom, Fab,
} from "@mui/material";
import {
    Add as AddIcon,
    Close as CloseIcon,
    MusicNote as MusicIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CloudUpload as UploadIcon,
    Image as ImageIcon,
    Headphones as AudioIcon,
    Videocam as VideoIcon,
    CheckCircle as PublishedIcon,
    Drafts as DraftIcon,
    PublicOff as UnpublishIcon,
    Public as PublishIcon,
    PlayCircle as PlayIcon,
} from "@mui/icons-material";
import {
    getMusic, createMusic, updateMusic, deleteMusic, toggleMusicStatus, getMusicFileUrl,
    type MusicTrack,
} from "../api/adminMusicApi";

// ── Stat Card ──────────────────────────────────────────────────────────────────

const StatCard = ({
    label, value, icon, accent,
}: {
    label: string; value: number; icon: React.ReactNode; accent: string;
}) => (
    <Box sx={{
        flex: "1 1 0",
        minWidth: { xs: "calc(50% - 6px)", sm: 140 },
        background: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        px: { xs: 2, md: 2.5 },
        py: { xs: 1.75, md: 2 },
        display: "flex", alignItems: "center", gap: 1.75,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "12px", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
            {icon}
        </Box>
        <Box>
            <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontSize: { xs: "1.35rem", md: "1.6rem" }, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                {value}
            </Typography>
            <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 500, mt: 0.3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {label}
            </Typography>
        </Box>
    </Box>
);

// ── Delete dialog ──────────────────────────────────────────────────────────────

function DeleteDialog({ open, title, onClose, onConfirm, loading }: {
    open: boolean; title: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            TransitionComponent={Zoom as any}
            PaperProps={{ sx: { borderRadius: "16px", background: "var(--card-bg)" } }}>
            <DialogTitle sx={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: "var(--text-primary)", pb: 1 }}>
                Delete Track?
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ fontFamily: "'Poppins',sans-serif", color: "var(--text-secondary)", fontSize: 14 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>"{title}"</Box>
                    {" "}will be permanently deleted along with its files. This cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} disabled={loading}
                    sx={{ fontFamily: "'Poppins',sans-serif", textTransform: "none", borderRadius: "10px", color: "var(--text-secondary)" }}>
                    Cancel
                </Button>
                <Button onClick={onConfirm} variant="contained" disabled={loading}
                    sx={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, textTransform: "none", borderRadius: "999px", px: 3.5, background: "#FF5144", "&:hover": { background: "#e84a3e" } }}>
                    {loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Drop Zone ──────────────────────────────────────────────────────────────────

function DropZone({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <Box onClick={onClick}
            sx={{ border: "2px dashed var(--border-color)", borderRadius: "12px", p: 2.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: "#25AFF4", background: "rgba(37,175,244,0.04)" } }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(37,175,244,0.1)", display: "flex", alignItems: "center", justifyContent: "center", "& svg": { fontSize: 22, color: "#25AFF4" } }}>
                {icon}
            </Box>
            <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Poppins',sans-serif", textAlign: "center" }}>
                {label}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 2, py: 0.6, borderRadius: "8px", background: "rgba(37,175,244,0.1)" }}>
                <UploadIcon sx={{ fontSize: 14, color: "#25AFF4" }} />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#25AFF4", fontFamily: "'Poppins',sans-serif" }}>Browse files</Typography>
            </Box>
        </Box>
    );
}

// ── Shared field sx ────────────────────────────────────────────────────────────

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        fontFamily: "'Poppins',sans-serif",
        fontSize: 13,
        "& fieldset": { borderColor: "var(--border-color)" },
        "&:hover fieldset": { borderColor: "#25AFF4" },
        "&.Mui-focused fieldset": { borderColor: "#25AFF4" },
    },
    "& .MuiInputLabel-root": {
        fontFamily: "'Poppins',sans-serif", fontSize: 13,
        "&.Mui-focused": { color: "#25AFF4" },
    },
    "& .MuiInputBase-input": { color: "var(--text-primary)" },
};

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormState {
    title: string; description: string; artist: string; status: "published" | "draft";
    audioFile: File | null; videoFile: File | null; coverFile: File | null; coverPreview: string | null;
}

const EMPTY_FORM: FormState = {
    title: "", description: "", artist: "", status: "draft",
    audioFile: null, videoFile: null, coverFile: null, coverPreview: null,
};

type DialogMode = "add" | "edit" | null;

// ── PAGE ───────────────────────────────────────────────────────────────────────

export default function AdminMusicPage() {
    const [tracks,       setTracks]       = useState<MusicTrack[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [dialogMode,   setDialogMode]   = useState<DialogMode>(null);
    const [editTarget,   setEditTarget]   = useState<MusicTrack | null>(null);
    const [previewTrack, setPreviewTrack] = useState<MusicTrack | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MusicTrack | null>(null);
    const [form,         setForm]         = useState<FormState>(EMPTY_FORM);
    const [saving,       setSaving]       = useState(false);
    const [deleting,     setDeleting]     = useState(false);
    const [formError,    setFormError]    = useState("");

    const audioRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchTracks(); }, []);

    async function fetchTracks() {
        try {
            setLoading(true);
            setTracks(await getMusic());
        } catch { /* silently fail */ }
        finally { setLoading(false); }
    }

    function openAdd() {
        setForm(EMPTY_FORM); setEditTarget(null); setFormError(""); setDialogMode("add");
    }
    function openEdit(track: MusicTrack) {
        setForm({
            title: track.title, description: track.description,
            artist: track.artist ?? "", status: track.status,
            audioFile: null, videoFile: null, coverFile: null,
            coverPreview: track.coverImagePath ? getMusicFileUrl(track.coverImagePath) : null,
        });
        setEditTarget(track); setFormError(""); setDialogMode("edit");
    }
    function closeDialog() {
        setDialogMode(null); setEditTarget(null); setForm(EMPTY_FORM); setFormError("");
    }

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setForm(f => ({ ...f, coverFile: file, coverPreview: ev.target?.result as string }));
        reader.readAsDataURL(file);
    }
    function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(f => ({ ...f, audioFile: e.target.files?.[0] ?? null }));
    }
    function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(f => ({ ...f, videoFile: e.target.files?.[0] ?? null }));
    }

    async function handleSave() {
        if (!form.title.trim())       { setFormError("Title is required."); return; }
        if (!form.description.trim()) { setFormError("Description is required."); return; }
        if (dialogMode === "add" && !form.audioFile && !form.videoFile) {
            setFormError("Please upload at least one audio or video file."); return;
        }

        setSaving(true); setFormError("");
        const fd = new FormData();
        fd.append("title",       form.title.trim());
        fd.append("description", form.description.trim());
        fd.append("artist",      form.artist.trim());
        fd.append("status",      form.status);
        if (form.audioFile) fd.append("audio", form.audioFile);
        if (form.videoFile) fd.append("video", form.videoFile);
        if (form.coverFile) fd.append("cover", form.coverFile);

        try {
            if (dialogMode === "add") {
                const t = await createMusic(fd);
                setTracks(prev => [t, ...prev]);
            } else if (editTarget) {
                const t = await updateMusic(editTarget._id, fd);
                setTracks(prev => prev.map(x => x._id === t._id ? t : x));
            }
            closeDialog();
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? "Failed to save track.");
        } finally { setSaving(false); }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteMusic(deleteTarget._id);
            setTracks(prev => prev.filter(x => x._id !== deleteTarget._id));
            setDeleteTarget(null);
        } finally { setDeleting(false); }
    }

    async function handleToggle(track: MusicTrack) {
        try {
            const updated = await toggleMusicStatus(track._id);
            setTracks(prev => prev.map(x => x._id === updated._id ? updated : x));
        } catch { /* ignore */ }
    }

    const total     = tracks.length;
    const published = tracks.filter(t => t.status === "published").length;
    const drafts    = tracks.filter(t => t.status === "draft").length;

    return (
        <Box sx={{ width: "100%", fontFamily: "'Poppins',sans-serif" }}>

            {/* ── Header ──────────────────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: { xs: 2.5, md: 3 }, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 0.5 }}>
                        Music
                    </Typography>
                    <Typography sx={{ color: "var(--text-secondary)", fontSize: { xs: "0.875rem", md: "0.95rem" }, fontFamily: "'Poppins',sans-serif" }}>
                        Manage and publish music tracks for children.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
                    sx={{ fontFamily: "'Poppins',sans-serif", borderRadius: "999px", textTransform: "none", fontWeight: 600, background: "#25AFF4", px: 3, py: 1, transition: "all 0.2s ease", "&:hover": { background: "#1EA0E6", transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" } }}>
                    Add Track
                </Button>
            </Box>

            {/* ── Stat cards ──────────────────────────────────── */}
            <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, flexWrap: "wrap", mb: 3 }}>
                <StatCard label="TOTAL"     value={total}     icon={<MusicIcon />}     accent="#25AFF4" />
                <StatCard label="PUBLISHED" value={published} icon={<PublishedIcon />} accent="#8EE870" />
                <StatCard label="DRAFTS"    value={drafts}    icon={<DraftIcon />}     accent="#FFCC35" />
            </Box>

            {/* ── Tracks grid ─────────────────────────────────── */}
            <Paper elevation={0} sx={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "var(--card-bg)" }}>
                {loading ? (
                    <Box sx={{ p: 8, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={32} sx={{ color: "#25AFF4" }} />
                    </Box>
                ) : tracks.length === 0 ? (
                    <Box sx={{ py: 10, textAlign: "center" }}>
                        <MusicIcon sx={{ fontSize: 40, color: "var(--border-color)", mb: 1, display: "block", mx: "auto" }} />
                        <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 0.5, fontSize: "0.95rem" }}>
                            No tracks yet
                        </Typography>
                        <Typography sx={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                            Click "Add Track" to upload the first audio file.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" } }}>
                        {tracks.map((track, idx) => (
                            <Box key={track._id} sx={{ borderBottom: "1px solid var(--border-color)", borderRight: { xs: "none", sm: idx % 2 === 0 ? "1px solid var(--border-color)" : "none", md: idx % 3 !== 2 ? "1px solid var(--border-color)" : "none", lg: idx % 4 !== 3 ? "1px solid var(--border-color)" : "none" } }}>
                                <TrackCard
                                    track={track}
                                    onPlay={() => setPreviewTrack(track)}
                                    onEdit={() => openEdit(track)}
                                    onDelete={() => setDeleteTarget(track)}
                                    onToggle={() => handleToggle(track)}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* ══════════════════════════════════════════════════
                ADD / EDIT DIALOG
                ══════════════════════════════════════════════════ */}
            <Dialog open={!!dialogMode} onClose={closeDialog} maxWidth="sm" fullWidth
                TransitionComponent={Zoom as any}
                PaperProps={{ sx: { borderRadius: "16px", background: "var(--card-bg)" } }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                        {dialogMode === "add" ? "Add New Track" : "Edit Track"}
                    </Typography>
                    <IconButton onClick={closeDialog} size="small">
                        <CloseIcon sx={{ fontSize: 18, color: "var(--text-tertiary)" }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ borderColor: "var(--border-color)" }}>
                    {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: 13 }}>{formError}</Alert>}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
                        <TextField label="Title" fullWidth required size="small"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            sx={fieldSx} />

                        <TextField label="Short Description" fullWidth required multiline rows={2} size="small"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            sx={fieldSx} />

                        <TextField label="Artist / Author" fullWidth size="small"
                            value={form.artist}
                            onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                            sx={fieldSx} />

                        <FormControl fullWidth size="small" sx={fieldSx}>
                            <InputLabel>Status</InputLabel>
                            <Select value={form.status} label="Status"
                                onChange={e => setForm(f => ({ ...f, status: e.target.value as "published" | "draft" }))}>
                                <MenuItem value="draft">
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <DraftIcon sx={{ fontSize: 16, color: "#FFCC35" }} /> Draft
                                    </Box>
                                </MenuItem>
                                <MenuItem value="published">
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <PublishedIcon sx={{ fontSize: 16, color: "#8EE870" }} /> Published
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {/* Cover art */}
                        <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", mb: 1, fontFamily: "'Poppins',sans-serif" }}>
                                Cover Art{" "}
                                <Box component="span" sx={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional)</Box>
                            </Typography>
                            <input type="file" accept="image/*" ref={coverRef} style={{ display: "none" }} onChange={handleCoverChange} />
                            {form.coverPreview ? (
                                <Box sx={{ position: "relative", display: "inline-block" }}>
                                    <Box component="img" src={form.coverPreview} alt="cover"
                                        sx={{ height: 100, borderRadius: "10px", objectFit: "cover", border: "1px solid var(--border-color)" }} />
                                    <IconButton size="small"
                                        onClick={() => setForm(f => ({ ...f, coverFile: null, coverPreview: null }))}
                                        sx={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, background: "#FF5144", color: "#fff", "&:hover": { background: "#e84a3e" } }}>
                                        <CloseIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                </Box>
                            ) : (
                                <DropZone icon={<ImageIcon />} label="Click to upload cover art" onClick={() => coverRef.current?.click()} />
                            )}
                        </Box>

                        {/* Audio file */}
                        <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", mb: 1, fontFamily: "'Poppins',sans-serif" }}>
                                Audio File
                                {dialogMode === "edit"
                                    ? <Box component="span" sx={{ color: "var(--text-tertiary)", fontWeight: 400 }}> — leave empty to keep existing</Box>
                                    : <Box component="span" sx={{ color: "var(--text-tertiary)", fontWeight: 400 }}> (at least audio or video required)</Box>}
                            </Typography>
                            <input type="file" accept="audio/*" ref={audioRef} style={{ display: "none" }} onChange={handleAudioChange} />
                            {form.audioFile ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", background: "rgba(37,175,244,0.06)", border: "1px solid rgba(37,175,244,0.2)" }}>
                                    <AudioIcon sx={{ color: "#25AFF4", fontSize: 20 }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#25AFF4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {form.audioFile.name}
                                    </Typography>
                                    <IconButton size="small" onClick={() => { setForm(f => ({ ...f, audioFile: null })); if (audioRef.current) audioRef.current.value = ""; }}>
                                        <CloseIcon sx={{ fontSize: 14, color: "var(--text-tertiary)" }} />
                                    </IconButton>
                                </Box>
                            ) : (
                                <DropZone icon={<AudioIcon />} label="Click to upload audio (MP3, WAV, OGG — max 50 MB)" onClick={() => audioRef.current?.click()} />
                            )}
                        </Box>

                        {/* Video file */}
                        <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", mb: 1, fontFamily: "'Poppins',sans-serif" }}>
                                Video / Music Video{" "}
                                <Box component="span" sx={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional)</Box>
                                {dialogMode === "edit" && <Box component="span" sx={{ color: "var(--text-tertiary)", fontWeight: 400 }}> — leave empty to keep existing</Box>}
                            </Typography>
                            <input type="file" accept="video/*" ref={videoRef} style={{ display: "none" }} onChange={handleVideoChange} />
                            {form.videoFile ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", background: "rgba(142,232,112,0.06)", border: "1px solid rgba(142,232,112,0.25)" }}>
                                    <VideoIcon sx={{ color: "#8EE870", fontSize: 20 }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#2d8c3c", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {form.videoFile.name}
                                    </Typography>
                                    <IconButton size="small" onClick={() => { setForm(f => ({ ...f, videoFile: null })); if (videoRef.current) videoRef.current.value = ""; }}>
                                        <CloseIcon sx={{ fontSize: 14, color: "var(--text-tertiary)" }} />
                                    </IconButton>
                                </Box>
                            ) : (
                                <DropZone icon={<VideoIcon />} label="Click to upload video (MP4, WebM — max 50 MB)" onClick={() => videoRef.current?.click()} />
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={closeDialog} disabled={saving}
                        sx={{ fontFamily: "'Poppins',sans-serif", textTransform: "none", borderRadius: "10px", color: "var(--text-secondary)" }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}
                        sx={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, textTransform: "none", borderRadius: "999px", px: 3.5, background: "#25AFF4", "&:hover": { background: "#1EA0E6" } }}>
                        {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : dialogMode === "add" ? "Upload Track" : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ══════════════════════════════════════════════════
                PREVIEW / PLAY DIALOG
                ══════════════════════════════════════════════════ */}
            <Dialog open={!!previewTrack} onClose={() => setPreviewTrack(null)} maxWidth="xs" fullWidth
                TransitionComponent={Zoom as any}
                PaperProps={{ sx: { borderRadius: "16px", background: "var(--card-bg)" } }}>
                {previewTrack && (
                    <>
                        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid var(--border-color)", pb: 1.5 }}>
                            {previewTrack.videoPath
                                ? <VideoIcon sx={{ color: "#8EE870", fontSize: 22, flexShrink: 0 }} />
                                : <AudioIcon sx={{ color: "#25AFF4", fontSize: 22, flexShrink: 0 }} />}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {previewTrack.title}
                                </Typography>
                                {previewTrack.artist && (
                                    <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)", mt: 0.1, fontFamily: "'Poppins',sans-serif" }}>
                                        {previewTrack.artist}
                                    </Typography>
                                )}
                            </Box>
                            <IconButton onClick={() => setPreviewTrack(null)} size="small" sx={{ flexShrink: 0 }}>
                                <CloseIcon sx={{ fontSize: 18, color: "var(--text-tertiary)" }} />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 2.5, pb: 3 }}>
                            {/* Video player (if track has video) */}
                            {previewTrack.videoPath ? (
                                <Box component="video"
                                    controls
                                    src={getMusicFileUrl(previewTrack.videoPath)}
                                    sx={{ width: "100%", borderRadius: "12px", display: "block", mb: 2, maxHeight: 280, background: "#000" }}
                                />
                            ) : (
                                /* Cover art (audio-only track) */
                                previewTrack.coverImagePath ? (
                                    <Box component="img"
                                        src={getMusicFileUrl(previewTrack.coverImagePath)}
                                        alt={previewTrack.title}
                                        sx={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: "12px", mb: 2.5, display: "block" }}
                                    />
                                ) : (
                                    <Box sx={{ width: "100%", height: 140, borderRadius: "12px", background: "linear-gradient(135deg,rgba(37,175,244,0.15) 0%,rgba(37,175,244,0.05) 100%)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5 }}>
                                        <MusicIcon sx={{ fontSize: 52, color: "#25AFF4", opacity: 0.4 }} />
                                    </Box>
                                )
                            )}
                            {/* Audio player (always show if audioPath exists) */}
                            {previewTrack.audioPath && (
                                <Box component="audio"
                                    controls
                                    autoPlay={false}
                                    src={getMusicFileUrl(previewTrack.audioPath)}
                                    sx={{ width: "100%", borderRadius: "8px", outline: "none", display: "block", mb: previewTrack.description ? 0 : undefined }}
                                />
                            )}
                            <Typography sx={{ mt: 1.5, fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Poppins',sans-serif", lineHeight: 1.6 }}>
                                {previewTrack.description}
                            </Typography>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* ══════════════════════════════════════════════════
                DELETE DIALOG
                ══════════════════════════════════════════════════ */}
            <DeleteDialog
                open={!!deleteTarget}
                title={deleteTarget?.title ?? ""}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
            />

            {/* ── Mobile FAB ───────────────────────────────────── */}
            <Fab onClick={openAdd} aria-label="add track"
                sx={{ display: { xs: "flex", md: "none" }, position: "fixed", bottom: 24, right: 24, background: "#25AFF4", boxShadow: "0 6px 20px rgba(37,175,244,0.45)", "&:hover": { background: "#0fa8ef" } }}>
                <AddIcon sx={{ color: "#fff" }} />
            </Fab>
        </Box>
    );
}

// ── Track Card ─────────────────────────────────────────────────────────────────

function TrackCard({ track, onPlay, onEdit, onDelete, onToggle }: {
    track: MusicTrack; onPlay: () => void; onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
    const isPublished = track.status === "published";

    return (
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "100%", "&:hover": { background: "var(--bg-subtle)" }, transition: "background 0.15s" }}>

            {/* Cover art / placeholder */}
            <Box onClick={onPlay} sx={{ height: 140, borderRadius: "12px", overflow: "hidden", cursor: "pointer", flexShrink: 0, position: "relative", "&:hover .play-pill": { opacity: 1 } }}>
                {track.coverImagePath ? (
                    <Box component="img" src={getMusicFileUrl(track.coverImagePath)} alt={track.title}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                    <Box sx={{ width: "100%", height: "100%", background: "linear-gradient(135deg,rgba(37,175,244,0.15) 0%,rgba(37,175,244,0.05) 100%)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <MusicIcon sx={{ fontSize: 36, color: "#25AFF4" }} />
                        <Typography sx={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "'Poppins',sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            No Cover
                        </Typography>
                    </Box>
                )}
                {/* Video badge */}
                {track.videoPath && (
                    <Box sx={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 0.4, px: 1, py: 0.3, borderRadius: "6px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
                        <VideoIcon sx={{ fontSize: 12, color: "#8EE870" }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#8EE870", fontFamily: "'Poppins',sans-serif", lineHeight: 1 }}>VIDEO</Typography>
                    </Box>
                )}
                {/* Hover overlay */}
                <Box sx={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", "&:hover": { background: "rgba(0,0,0,0.3)" } }}>
                    <Box className="play-pill" sx={{ opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", gap: 0.7, px: 2, py: 0.7, borderRadius: "20px", background: "rgba(255,255,255,0.95)" }}>
                        <PlayIcon sx={{ fontSize: 16, color: "#25AFF4" }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#25AFF4", fontFamily: "'Poppins',sans-serif" }}>Play</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.6 }}>
                    <Chip size="small"
                        label={isPublished ? "Published" : "Draft"}
                        sx={{ fontSize: 10, fontWeight: 700, height: 20, background: isPublished ? "rgba(142,232,112,0.15)" : "rgba(255,204,53,0.15)", color: isPublished ? "#2d8c3c" : "#92600e" }}
                    />
                    <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "'Poppins',sans-serif" }}>
                        {new Date(track.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.3, mb: 0.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {track.title}
                </Typography>
                {track.artist && (
                    <Typography sx={{ fontSize: 11, color: "#25AFF4", fontFamily: "'Poppins',sans-serif", fontWeight: 600, mb: 0.3 }}>
                        {track.artist}
                    </Typography>
                )}
                <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Poppins',sans-serif", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {track.description}
                </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5, borderTop: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", gap: 0.25 }}>
                    <Tooltip title="Play" arrow>
                        <IconButton size="small" onClick={onPlay}
                            sx={{ color: "var(--text-tertiary)", transition: "all 0.2s ease", p: 0.75, "&:hover": { color: "#25AFF4", background: "rgba(37,175,244,0.1)", transform: "scale(1.05)" } }}>
                            <PlayIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit" arrow>
                        <IconButton size="small" onClick={onEdit}
                            sx={{ color: "var(--text-tertiary)", transition: "all 0.2s ease", p: 0.75, "&:hover": { color: "#8EE870", background: "rgba(142,232,112,0.1)", transform: "scale(1.05)" } }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" arrow>
                        <IconButton size="small" onClick={onDelete}
                            sx={{ color: "var(--text-tertiary)", transition: "all 0.2s ease", p: 0.75, "&:hover": { color: "#FF5144", background: "rgba(255,81,68,0.1)", transform: "scale(1.05)" } }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Tooltip title={isPublished ? "Unpublish" : "Publish"} arrow>
                    <IconButton size="small" onClick={onToggle}
                        sx={{ color: "var(--text-tertiary)", transition: "all 0.2s ease", p: 0.75, "&:hover": { color: isPublished ? "#FF5144" : "#8EE870", background: isPublished ? "rgba(255,81,68,0.1)" : "rgba(142,232,112,0.1)", transform: "scale(1.05)" } }}>
                        {isPublished ? <UnpublishIcon sx={{ fontSize: 16 }} /> : <PublishIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}
