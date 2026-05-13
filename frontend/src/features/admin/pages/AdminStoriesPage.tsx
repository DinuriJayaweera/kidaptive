import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Paper, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Button, IconButton, CircularProgress, Alert,
    Select, MenuItem, FormControl, InputLabel, Tooltip, Zoom, Fab,
} from "@mui/material";
import {
    Add as AddIcon,
    Close as CloseIcon,
    MenuBook as BookIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CloudUpload as UploadIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    CheckCircle as PublishedIcon,
    Drafts as DraftIcon,
    PublicOff as UnpublishIcon,
    Public as PublishIcon,
} from "@mui/icons-material";
import {
    getStories, createStory, updateStory, deleteStory, toggleStatus, getFileUrl,
    type Story,
} from "../api/adminStoriesApi";

// ── Stat Card (matches other admin pages) ──────────────────

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

// ── Delete dialog (matches other admin pages) ──────────────

function DeleteDialog({ open, title, onClose, onConfirm, loading }: {
    open: boolean; title: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            TransitionComponent={Zoom as any}
            PaperProps={{ sx: { borderRadius: "16px", background: "var(--card-bg)" } }}>
            <DialogTitle sx={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: "var(--text-primary)", pb: 1 }}>
                Delete Story?
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

// ── Drop Zone ──────────────────────────────────────────────

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

// ── Shared field sx ────────────────────────────────────────

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

// ── Form state ─────────────────────────────────────────────

interface FormState {
    title: string; description: string; status: "published" | "draft";
    pdfFile: File | null; coverFile: File | null; coverPreview: string | null;
}

const EMPTY_FORM: FormState = {
    title: "", description: "", status: "draft",
    pdfFile: null, coverFile: null, coverPreview: null,
};

type DialogMode = "add" | "edit" | null;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminStoriesPage() {
    const [stories,      setStories]      = useState<Story[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [dialogMode,   setDialogMode]   = useState<DialogMode>(null);
    const [editTarget,   setEditTarget]   = useState<Story | null>(null);
    const [previewStory, setPreviewStory] = useState<Story | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
    const [form,         setForm]         = useState<FormState>(EMPTY_FORM);
    const [saving,       setSaving]       = useState(false);
    const [deleting,     setDeleting]     = useState(false);
    const [formError,    setFormError]    = useState("");

    const pdfRef   = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchStories(); }, []);

    async function fetchStories() {
        try {
            setLoading(true);
            setStories(await getStories());
        } catch {
            // silently fail — empty state handles it
        } finally { setLoading(false); }
    }

    function openAdd() {
        setForm(EMPTY_FORM); setEditTarget(null); setFormError(""); setDialogMode("add");
    }
    function openEdit(story: Story) {
        setForm({ title: story.title, description: story.description, status: story.status, pdfFile: null, coverFile: null, coverPreview: story.coverImagePath ? getFileUrl(story.coverImagePath) : null });
        setEditTarget(story); setFormError(""); setDialogMode("edit");
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
    function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(f => ({ ...f, pdfFile: e.target.files?.[0] ?? null }));
    }

    async function handleSave() {
        if (!form.title.trim())       { setFormError("Title is required."); return; }
        if (!form.description.trim()) { setFormError("Description is required."); return; }
        if (dialogMode === "add" && !form.pdfFile) { setFormError("Please upload a PDF file."); return; }

        setSaving(true); setFormError("");
        const fd = new FormData();
        fd.append("title",       form.title.trim());
        fd.append("description", form.description.trim());
        fd.append("status",      form.status);
        if (form.pdfFile)   fd.append("pdf",   form.pdfFile);
        if (form.coverFile) fd.append("cover", form.coverFile);

        try {
            if (dialogMode === "add") {
                const s = await createStory(fd);
                setStories(prev => [s, ...prev]);
            } else if (editTarget) {
                const s = await updateStory(editTarget._id, fd);
                setStories(prev => prev.map(x => x._id === s._id ? s : x));
            }
            closeDialog();
        } catch (err: any) {
            setFormError(err?.response?.data?.message ?? "Failed to save story.");
        } finally { setSaving(false); }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteStory(deleteTarget._id);
            setStories(prev => prev.filter(x => x._id !== deleteTarget._id));
            setDeleteTarget(null);
        } finally { setDeleting(false); }
    }

    async function handleToggle(story: Story) {
        try {
            const updated = await toggleStatus(story._id);
            setStories(prev => prev.map(x => x._id === updated._id ? updated : x));
        } catch { /* ignore */ }
    }

    const total     = stories.length;
    const published = stories.filter(s => s.status === "published").length;
    const drafts    = stories.filter(s => s.status === "draft").length;

    return (
        <Box sx={{ width: "100%", fontFamily: "'Poppins',sans-serif" }}>

            {/* ── Header ─────────────────────────────────── */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: { xs: 2.5, md: 3 }, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 0.5 }}>
                        Stories
                    </Typography>
                    <Typography sx={{ color: "var(--text-secondary)", fontSize: { xs: "0.875rem", md: "0.95rem" }, fontFamily: "'Poppins',sans-serif" }}>
                        Manage and publish reading stories for children.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
                    sx={{ fontFamily: "'Poppins',sans-serif", borderRadius: "999px", textTransform: "none", fontWeight: 600, background: "#25AFF4", px: 3, py: 1, transition: "all 0.2s ease", "&:hover": { background: "#1EA0E6", transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" } }}>
                    Add Story
                </Button>
            </Box>

            {/* ── Stat cards ─────────────────────────────── */}
            <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, flexWrap: "wrap", mb: 3 }}>
                <StatCard label="TOTAL"     value={total}     icon={<BookIcon />}      accent="#25AFF4" />
                <StatCard label="PUBLISHED" value={published} icon={<PublishedIcon />} accent="#8EE870" />
                <StatCard label="DRAFTS"    value={drafts}    icon={<DraftIcon />}     accent="#FFCC35" />
            </Box>

            {/* ── Stories grid inside Paper ───────────────── */}
            <Paper elevation={0} sx={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "var(--card-bg)" }}>
                {loading ? (
                    <Box sx={{ p: 8, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={32} sx={{ color: "#25AFF4" }} />
                    </Box>
                ) : stories.length === 0 ? (
                    <Box sx={{ py: 10, textAlign: "center" }}>
                        <BookIcon sx={{ fontSize: 40, color: "var(--border-color)", mb: 1, display: "block", mx: "auto" }} />
                        <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 0.5, fontSize: "0.95rem" }}>
                            No stories yet
                        </Typography>
                        <Typography sx={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                            Click "Add Story" to upload the first PDF story.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" } }}>
                        {stories.map((story, idx) => (
                            <Box key={story._id} sx={{ borderBottom: "1px solid var(--border-color)", borderRight: { xs: "none", sm: idx % 2 === 0 ? "1px solid var(--border-color)" : "none", md: idx % 3 !== 2 ? "1px solid var(--border-color)" : "none", lg: idx % 4 !== 3 ? "1px solid var(--border-color)" : "none" } }}>
                                <StoryCard
                                    story={story}
                                    onPreview={() => setPreviewStory(story)}
                                    onEdit={() => openEdit(story)}
                                    onDelete={() => setDeleteTarget(story)}
                                    onToggle={() => handleToggle(story)}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* ══════════════════════════════════════════════
                ADD / EDIT DIALOG
                ══════════════════════════════════════════════ */}
            <Dialog open={!!dialogMode} onClose={closeDialog} maxWidth="sm" fullWidth
                TransitionComponent={Zoom as any}
                PaperProps={{ sx: { borderRadius: "16px", background: "var(--card-bg)" } }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                        {dialogMode === "add" ? "Add New Story" : "Edit Story"}
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

                        <TextField label="Short Description" fullWidth required multiline rows={3} size="small"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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

                        {/* Cover image */}
                        <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", mb: 1, fontFamily: "'Poppins',sans-serif" }}>
                                Cover Image{" "}
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
                                <DropZone icon={<ImageIcon />} label="Click to upload cover image" onClick={() => coverRef.current?.click()} />
                            )}
                        </Box>

                        {/* PDF */}
                        <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", mb: 1, fontFamily: "'Poppins',sans-serif" }}>
                                PDF File <Box component="span" sx={{ color: "#FF5144" }}>*</Box>
                                {dialogMode === "edit" && <Box component="span" sx={{ color: "var(--text-tertiary)", fontWeight: 400 }}> — leave empty to keep existing</Box>}
                            </Typography>
                            <input type="file" accept="application/pdf" ref={pdfRef} style={{ display: "none" }} onChange={handlePdfChange} />
                            {form.pdfFile ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", background: "rgba(37,175,244,0.06)", border: "1px solid rgba(37,175,244,0.2)" }}>
                                    <PdfIcon sx={{ color: "#25AFF4", fontSize: 20 }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#25AFF4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {form.pdfFile.name}
                                    </Typography>
                                    <IconButton size="small" onClick={() => { setForm(f => ({ ...f, pdfFile: null })); if (pdfRef.current) pdfRef.current.value = ""; }}>
                                        <CloseIcon sx={{ fontSize: 14, color: "var(--text-tertiary)" }} />
                                    </IconButton>
                                </Box>
                            ) : (
                                <DropZone icon={<PdfIcon />} label="Click to upload PDF (max 50 MB)" onClick={() => pdfRef.current?.click()} />
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
                        {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : dialogMode === "add" ? "Upload Story" : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ══════════════════════════════════════════════
                PREVIEW DIALOG
                ══════════════════════════════════════════════ */}
            <Dialog open={!!previewStory} onClose={() => setPreviewStory(null)} maxWidth="lg" fullWidth
                TransitionComponent={Zoom as any}
                PaperProps={{ sx: { borderRadius: "16px", background: "var(--card-bg)", height: "90vh", display: "flex", flexDirection: "column" } }}>
                {previewStory && (
                    <>
                        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid var(--border-color)", pb: 1.5 }}>
                            <PdfIcon sx={{ color: "#25AFF4", fontSize: 22, flexShrink: 0 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {previewStory.title}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)", mt: 0.2, fontFamily: "'Poppins',sans-serif" }}>
                                    {previewStory.description}
                                </Typography>
                            </Box>
                            <Chip
                                size="small"
                                label={previewStory.status === "published" ? "Published" : "Draft"}
                                sx={{ fontSize: 11, fontWeight: 700, flexShrink: 0, background: previewStory.status === "published" ? "rgba(142,232,112,0.15)" : "rgba(255,204,53,0.15)", color: previewStory.status === "published" ? "#2d8c3c" : "#92600e" }}
                            />
                            <IconButton onClick={() => setPreviewStory(null)} size="small" sx={{ flexShrink: 0 }}>
                                <CloseIcon sx={{ fontSize: 18, color: "var(--text-tertiary)" }} />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
                            <Box component="iframe" src={getFileUrl(previewStory.pdfPath)} title={previewStory.title}
                                sx={{ width: "100%", height: "100%", border: "none", display: "block" }} />
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* ══════════════════════════════════════════════
                DELETE DIALOG
                ══════════════════════════════════════════════ */}
            <DeleteDialog
                open={!!deleteTarget}
                title={deleteTarget?.title ?? ""}
                onClose={() => !deleting && setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={deleting}
            />

            {/* ── Mobile FAB ─────────────────────────────── */}
            <Fab onClick={openAdd} aria-label="add story"
                sx={{ display: { xs: "flex", md: "none" }, position: "fixed", bottom: 24, right: 24, background: "#25AFF4", boxShadow: "0 6px 20px rgba(37,175,244,0.45)", "&:hover": { background: "#0fa8ef" } }}>
                <AddIcon sx={{ color: "#fff" }} />
            </Fab>
        </Box>
    );
}

// ── Story Card ─────────────────────────────────────────────

function StoryCard({ story, onPreview, onEdit, onDelete, onToggle }: {
    story: Story; onPreview: () => void; onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
    const isPublished = story.status === "published";

    return (
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "100%", "&:hover": { background: "var(--bg-subtle)" }, transition: "background 0.15s" }}>

            {/* Cover thumbnail */}
            <Box onClick={onPreview} sx={{ height: 150, borderRadius: "12px", overflow: "hidden", cursor: "pointer", flexShrink: 0, position: "relative", "&:hover .preview-pill": { opacity: 1 } }}>
                {story.coverImagePath ? (
                    <Box component="img" src={getFileUrl(story.coverImagePath)} alt={story.title}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                    <Box sx={{ width: "100%", height: "100%", background: "linear-gradient(135deg,rgba(37,175,244,0.15) 0%,rgba(37,175,244,0.05) 100%)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <BookIcon sx={{ fontSize: 36, color: "#25AFF4" }} />
                        <Typography sx={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "'Poppins',sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            No Cover
                        </Typography>
                    </Box>
                )}
                {/* Hover overlay */}
                <Box sx={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", "&:hover": { background: "rgba(0,0,0,0.3)" } }}>
                    <Box className="preview-pill" sx={{ opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", gap: 0.7, px: 2, py: 0.7, borderRadius: "20px", background: "rgba(255,255,255,0.95)" }}>
                        <VisibilityIcon sx={{ fontSize: 14, color: "#25AFF4" }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#25AFF4", fontFamily: "'Poppins',sans-serif" }}>Preview</Typography>
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
                        {new Date(story.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.3, mb: 0.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {story.title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Poppins',sans-serif", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {story.description}
                </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5, borderTop: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", gap: 0.25 }}>
                    <Tooltip title="Preview" arrow>
                        <IconButton size="small" onClick={onPreview}
                            sx={{ color: "var(--text-tertiary)", transition: "all 0.2s ease", p: 0.75, "&:hover": { color: "#25AFF4", background: "rgba(37,175,244,0.1)", transform: "scale(1.05)" } }}>
                            <VisibilityIcon sx={{ fontSize: 16 }} />
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
