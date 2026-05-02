import { useState, useEffect } from "react";
import {
    Box, Typography, Button, Grid, Avatar, CircularProgress, Alert, Paper,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Tooltip,
} from "@mui/material";
import {
    AddCircle as AddIcon,
    School as SchoolIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getParentChildrenEnriched, updateChild, deleteChild } from "../api/parentApi";
import type { EnhancedChildProfile } from "../api/parentApi";

const avatarEmojis: Record<string, string> = {
    default: "🦖", dino: "🦕", rocket: "🚀", star: "⭐", bear: "🐻", cat: "🐱", dog: "🐶", unicorn: "🦄",
};

const avatarOptions = Object.entries(avatarEmojis).map(([key, emoji]) => ({ value: key, label: `${emoji} ${key.charAt(0).toUpperCase() + key.slice(1)}` }));

export default function ParentChildrenPage() {
    const navigate = useNavigate();
    const [children, setChildren] = useState<EnhancedChildProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit dialog state
    const [editOpen, setEditOpen] = useState(false);
    const [editChild, setEditChild] = useState<EnhancedChildProfile | null>(null);
    const [editName, setEditName] = useState("");
    const [editAge, setEditAge] = useState<number>(5);
    const [editAvatar, setEditAvatar] = useState("default");
    const [editLoading, setEditLoading] = useState(false);

    // Delete dialog state
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<EnhancedChildProfile | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchChildren = () => {
        setLoading(true);
        getParentChildrenEnriched()
            .then(setChildren)
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load children."))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchChildren(); }, []);

    // ── Edit handlers ──
    const handleEditOpen = (child: EnhancedChildProfile) => {
        setEditChild(child);
        setEditName(child.name);
        setEditAge(child.age);
        setEditAvatar(child.avatar || "default");
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        if (!editChild) return;
        setEditLoading(true);
        try {
            await updateChild(editChild.childId, { name: editName, age: editAge, avatar: editAvatar });
            setEditOpen(false);
            fetchChildren();
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Failed to update child.");
        } finally {
            setEditLoading(false);
        }
    };

    // ── Delete handlers ──
    const handleDeleteOpen = (child: EnhancedChildProfile) => {
        setDeleteTarget(child);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteChild(deleteTarget.childId);
            setDeleteOpen(false);
            fetchChildren();
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Failed to delete child.");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
                        Your Children
                    </Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontSize: 14 }}>
                        Manage profiles and monitor learning progress.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/parent/children/new")}
                    sx={{ backgroundColor: "#25AFF4", borderRadius: "24px", px: 3, textTransform: "none", fontWeight: 600, boxShadow: "none", "&:hover": { backgroundColor: "#1e8cc3", boxShadow: "0 4px 12px rgba(37, 175, 244, 0.3)" } }}
                >
                    Add Child
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

            {/* Children Grid */}
            {loading ? (
                <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
            ) : children.length === 0 ? (
                <Paper elevation={0} sx={{ borderRadius: "16px", p: { xs: 3, md: 5 }, background: "var(--card-bg)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                    <SchoolIcon sx={{ fontSize: 64, color: "#25AFF4", mb: 2 }} />
                    <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", mb: 1 }}>Welcome! Let's add your child</Typography>
                    <Typography sx={{ color: "var(--text-secondary)", mb: 3, maxWidth: 400, mx: "auto", fontSize: 14 }}>Create a child profile so they can start their Kidaptive learning journey.</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/parent/children/new")} sx={{ backgroundColor: "#25AFF4", borderRadius: "24px", textTransform: "none", fontWeight: 700, px: 4, py: 1.3, boxShadow: "none", "&:hover": { backgroundColor: "#1e8cc3" } }}>Add a child</Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {children.map((child) => {
                        const dominantLevel = child.categories && child.categories.length > 0
                            ? child.categories.reduce((prev, current) => (prev.xp > current.xp) ? prev : current).level
                            : "starter";

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={child.childId}>
                                <Paper elevation={0} sx={{ borderRadius: "16px", p: 3, background: "var(--card-bg)", border: "1px solid var(--border-color)", textAlign: "center", transition: "all 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.06)" }, position: "relative" }}>
                                    {/* Action buttons */}
                                    <Box sx={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 0.5 }}>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleEditOpen(child)} sx={{ color: "var(--text-tertiary)", "&:hover": { color: "#25AFF4", background: "var(--bg-subtle)" } }}>
                                                <EditIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => handleDeleteOpen(child)} sx={{ color: "var(--text-tertiary)", "&:hover": { color: "#ef4444", background: "var(--danger-bg)" } }}>
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Avatar className="badge-blue" sx={{ width: 64, height: 64, mx: "auto", mb: 2, fontSize: "2rem" }}>
                                        {avatarEmojis[child.avatar || "default"] ?? "🦖"}
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{child.name}</Typography>
                                    <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", mb: 0.5 }}>Age {child.age} • Level: <Box component="span" sx={{ textTransform: "capitalize" }}>{dominantLevel}</Box></Typography>
                                    <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)", mb: 2 }}>Joined on {new Date(child.createdAt).toLocaleDateString()}</Typography>

                                    <Box sx={{ background: "var(--bg-subtle)", borderRadius: 2, p: 1.5, mb: 3, display: "flex", justifyContent: "center", gap: 3 }}>
                                        <Box>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Total XP</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#25AFF4", fontSize: 18 }}>{child.totalXP}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Gems</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#FFCC35", fontSize: 18 }}>{child.gems}</Typography>
                                        </Box>
                                    </Box>

                                    <Button fullWidth onClick={() => navigate(`/parent/child/${child.childId}`)} sx={{ textTransform: "none", fontWeight: 600, borderRadius: "24px", border: "2px solid var(--border-color)", color: "var(--text-secondary)", "&:hover": { border: "2px solid #25AFF4", color: "#25AFF4", background: "transparent" } }}>
                                        View Progress
                                    </Button>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ── Edit Dialog ── */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
                <DialogTitle sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700 }}>Edit Child Profile</DialogTitle>
                <DialogContent sx={{ pt: "16px !important" }}>
                    <TextField
                        label="Name"
                        fullWidth
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                    />
                    <TextField
                        label="Age"
                        type="number"
                        fullWidth
                        value={editAge}
                        onChange={(e) => setEditAge(Number(e.target.value))}
                        inputProps={{ min: 3, max: 12 }}
                        sx={{ mb: 2 }}
                        size="small"
                    />
                    <TextField
                        select
                        label="Avatar"
                        fullWidth
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        size="small"
                    >
                        {avatarOptions.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setEditOpen(false)} sx={{ textTransform: "none", color: "var(--text-secondary)" }}>Cancel</Button>
                    <Button
                        onClick={handleEditSave}
                        disabled={editLoading || !editName.trim()}
                        variant="contained"
                        sx={{ textTransform: "none", backgroundColor: "#25AFF4", borderRadius: "24px", fontWeight: 600, boxShadow: "none", "&:hover": { backgroundColor: "#1e8cc3" } }}
                    >
                        {editLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Dialog ── */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
                <DialogTitle sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#ef4444" }}>Delete Child</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will permanently remove their profile, all progress data, and placement test results. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: "none", color: "var(--text-secondary)" }}>Cancel</Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        disabled={deleteLoading}
                        variant="contained"
                        sx={{ textTransform: "none", backgroundColor: "#ef4444", borderRadius: "24px", fontWeight: 600, boxShadow: "none", "&:hover": { backgroundColor: "#dc2626" } }}
                    >
                        {deleteLoading ? "Deleting..." : "Delete Child"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
