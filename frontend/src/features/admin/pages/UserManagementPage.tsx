import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Button, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, CircularProgress, Snackbar, Alert,
    Zoom, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, InputAdornment, Chip, Divider,
    Pagination, Grid,
} from "@mui/material";
import {
    Search as SearchIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    PauseCircle as SuspendIcon,
    PlayCircle as ActivateIcon,
    Close as CloseIcon,
    People as PeopleIcon,
    FamilyRestroom as ParentIcon,
    ChildCare as ChildIcon,
    PersonOff as SuspendedIcon,
} from "@mui/icons-material";
import {
    getUsers, getUserById, toggleUserStatus, deleteUser, getUserStats,
    type AdminUser, type UserStats,
} from "../api/adminUsersApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
    parent: { label: "Parent", color: "#7c3aed", bg: "#f5f3ff" },
    child:  { label: "Child",  color: "#0369a1", bg: "#f0f9ff" },
    admin:  { label: "Admin",  color: "#b45309", bg: "#fffbeb" },
};

function RoleBadge({ role }: { role: string }) {
    const m = ROLE_META[role] ?? { label: role, color: "#64748b", bg: "#f1f5f9" };
    return (
        <Chip
            label={m.label}
            size="small"
            sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "0.68rem",
                letterSpacing: "0.3px",
                color: m.color,
                backgroundColor: m.bg,
                border: "none",
                height: 22,
            }}
        />
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
                px: 1.2,
                py: 0.3,
                borderRadius: "999px",
                backgroundColor: active ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${active ? "#bbf7d0" : "#fecaca"}`,
            }}
        >
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: active ? "#22c55e" : "#ef4444" }} />
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.68rem", color: active ? "#15803d" : "#dc2626" }}>
                {active ? "Active" : "Suspended"}
            </Typography>
        </Box>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    bg: string;
    onClick?: () => void;
    active?: boolean;
}
function StatCard({ icon, label, value, bg, onClick, active }: StatCardProps) {
    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                borderRadius: "16px",
                p: 3,
                background: "#fff",
                border: active ? "2px solid #25AFF4" : "1px solid #e8ecf1",
                display: "flex",
                alignItems: "center",
                gap: 2,
                cursor: onClick ? "pointer" : "default",
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": onClick ? {
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    transform: "translateY(-2px)",
                } : {},
            }}
        >
            <Box sx={{ p: 1.5, borderRadius: "16px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontSize: 12, fontWeight: 600, mb: 0.3, textTransform: "uppercase" }}>
                    {label}
                </Typography>
                <Typography sx={{ fontFamily: "'Baloo 2', cursive", color: "#111827", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>
                    {value.toLocaleString()}
                </Typography>
            </Box>
        </Paper>
    );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────
function UserDetailModal({ userId, open, onClose }: { userId: string | null; open: boolean; onClose: () => void }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !userId) { setUser(null); return; }
        setLoading(true);
        getUserById(userId).then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    }, [open, userId]);

    const field = (label: string, value: React.ReactNode) => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, mb: 2 }}>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}
            </Typography>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#111827", fontWeight: 500 }}>
                {value || <span style={{ color: "#cbd5e1" }}>—</span>}
            </Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionComponent={Zoom}
            PaperProps={{ sx: { borderRadius: "16px", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" } }}>
            <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 17, color: "#111827", display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: "1px solid #f1f5f9" }}>
                User Details
                <IconButton onClick={onClose} size="small" sx={{ color: "#94a3b8" }}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: "20px !important" }}>
                {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={32} sx={{ color: "#25AFF4" }} /></Box>}
                {!loading && user && (
                    <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, p: 2, borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #25AFF4, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
                                    {user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: "#111827" }}>{user.name}</Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                    <RoleBadge role={user.role} />
                                    <StatusBadge active={user.isActive !== false} />
                                </Box>
                            </Box>
                        </Box>

                        {field("Email", user.email)}
                        {field("Joined", formatDate(user.createdAt))}
                        {field("Auth Provider", user.authProvider === "google" ? "Google" : "Email & Password")}
                        {field("Email Verified", user.emailVerified ? "Yes" : "No")}

                        {user.role === "parent" && (
                            <>
                                <Divider sx={{ my: 2, borderColor: "#f1f5f9" }} />
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}>Parent Info</Typography>
                                {field("Phone", user.phone)}
                                {field("Children", user.childCount !== undefined ? `${user.childCount} child${user.childCount !== 1 ? "ren" : ""}` : "—")}
                            </>
                        )}

                        {user.role === "child" && (
                            <>
                                <Divider sx={{ my: 2, borderColor: "#f1f5f9" }} />
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}>Child Info</Typography>
                                {field("Username", user.username ? `@${user.username}` : undefined)}
                                {field("Age", user.age ? `${user.age} years old` : undefined)}
                                {field("Parent", user.parentName)}
                                {field("Placement Completed", user.placementCompleted ? "Yes" : "No")}
                                <Divider sx={{ my: 2, borderColor: "#f1f5f9" }} />
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}>Game Stats</Typography>
                                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                                    {[
                                        { label: "XP", value: (user.totalXP ?? 0).toLocaleString(), color: "#d4a000", bg: "rgba(253,199,0,0.1)" },
                                        { label: "Gems", value: (user.gems ?? 0).toLocaleString(), color: "#25AFF4", bg: "rgba(37,175,244,0.1)" },
                                        { label: "Streak", value: String(user.streak ?? 0), color: "#FF9447", bg: "rgba(255,148,71,0.1)" },
                                    ].map(s => (
                                        <Box key={s.label} sx={{ p: 1.5, borderRadius: "10px", background: s.bg, textAlign: "center" }}>
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</Typography>
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ borderRadius: "999px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, textTransform: "none", color: "#64748b" }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(total / 8);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeCard, setActiveCard] = useState<string | null>(null);

    const [viewUserId, setViewUserId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });

    const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getUsers({
                page,
                limit: 8,
                role: roleFilter as "all" | "parent" | "child" | "admin",
                status: statusFilter as "all" | "active" | "suspended",
                search: search || undefined,
            });
            setUsers(res.users);
            setTotal(res.total);
        } catch {
            showSnackbar("Failed to load users.", "error");
        } finally {
            setLoading(false);
        }
    }, [page, roleFilter, statusFilter, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        getUserStats().then(setStats).catch(() => {});
    }, []);

    useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

    const handleCardFilter = (role: string | null, status?: string) => {
        if (activeCard === role) {
            setActiveCard(null);
            setRoleFilter("all");
            setStatusFilter("all");
        } else {
            setActiveCard(role);
            setRoleFilter(role ?? "all");
            setStatusFilter(status ?? "all");
        }
        setPage(1);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteUser(deleteTarget._id);
            showSnackbar(`User "${deleteTarget.name}" deleted successfully.`);
            setDeleteTarget(null);
            fetchUsers();
            getUserStats().then(setStats).catch(() => {});
        } catch (err: any) {
            showSnackbar(err?.response?.data?.message ?? "Failed to delete user.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!statusTarget) return;
        setTogglingStatus(true);
        const newStatus = !(statusTarget.isActive !== false);
        try {
            await toggleUserStatus(statusTarget._id, newStatus);
            showSnackbar(`User "${statusTarget.name}" ${newStatus ? "activated" : "suspended"}.`);
            setStatusTarget(null);
            fetchUsers();
            getUserStats().then(setStats).catch(() => {});
        } catch (err: any) {
            showSnackbar(err?.response?.data?.message ?? "Failed to update status.", "error");
        } finally {
            setTogglingStatus(false);
        }
    };

    const headCellSx = {
        fontFamily: "'Poppins', sans-serif",
        color: "#6b7280",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: "0.5px",
        borderBottom: "1px solid #f3f4f6",
        padding: "12px 16px",
        verticalAlign: "middle",
    };

    const cellSx = {
        fontFamily: "'Poppins', sans-serif",
        fontSize: 13,
        color: "#374151",
        borderBottom: "1px solid #f3f4f6",
        padding: "12px 16px",
        verticalAlign: "middle",
        height: 60,
    };

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Page Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: { xs: 2.5, md: 3 }, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 0.5 }}>
                        User Management
                    </Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontSize: { xs: "0.875rem", md: "0.95rem" } }}>
                        View, manage, and moderate all platform users
                    </Typography>
                </Box>
            </Box>

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        icon={<PeopleIcon sx={{ fontSize: 32, color: "#25AFF4" }} />}
                        label="Total Users" value={stats?.total ?? 0} bg="#e0f2fe"
                        active={activeCard === "all"}
                        onClick={() => handleCardFilter("all")}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        icon={<ParentIcon sx={{ fontSize: 32, color: "#7c3aed" }} />}
                        label="Parents" value={stats?.roles.parent ?? 0} bg="#f5f3ff"
                        active={activeCard === "parent"}
                        onClick={() => handleCardFilter("parent")}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        icon={<ChildIcon sx={{ fontSize: 32, color: "#0369a1" }} />}
                        label="Children" value={stats?.roles.child ?? 0} bg="#f0f9ff"
                        active={activeCard === "child"}
                        onClick={() => handleCardFilter("child")}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        icon={<SuspendedIcon sx={{ fontSize: 32, color: "#dc2626" }} />}
                        label="Suspended" value={stats?.suspended ?? 0} bg="#fef2f2"
                        active={activeCard === "suspended"}
                        onClick={() => handleCardFilter("all", activeCard === "suspended" ? "all" : "suspended")}
                    />
                </Grid>
            </Grid>

            {/* Table Card */}
            <Paper elevation={0} sx={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "#fff", mb: 3 }}>

                {/* Toolbar */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, p: 2, borderBottom: "1px solid #f1f5f9", alignItems: "center" }}>
                    <TextField
                        size="small"
                        placeholder="Search by name, email or username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flex: 1, minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: "999px", fontSize: 13, fontFamily: "'Poppins', sans-serif" } }}
                    />
                    <TextField
                        select size="small" value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setActiveCard(null); setPage(1); }}
                        sx={{ minWidth: 130, "& .MuiOutlinedInput-root": { borderRadius: "999px", fontSize: 13, fontFamily: "'Poppins', sans-serif" } }}
                    >
                        <MenuItem value="all">All Roles</MenuItem>
                        <MenuItem value="parent">Parents</MenuItem>
                        <MenuItem value="child">Children</MenuItem>
                        <MenuItem value="admin">Admins</MenuItem>
                    </TextField>
                    <TextField
                        select size="small" value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setActiveCard(null); setPage(1); }}
                        sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: "999px", fontSize: 13, fontFamily: "'Poppins', sans-serif" } }}
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                    </TextField>
                </Box>

                {/* Table */}
                <TableContainer sx={{ overflowX: { xs: "auto", md: "hidden" } }}>
                    <Table sx={{ minWidth: { xs: 560, md: "100%" } }}>
                        <TableHead>
                            <TableRow sx={{ background: "#f9fafb", height: 60 }}>
                                <TableCell sx={{ ...headCellSx }}>USER</TableCell>
                                <TableCell sx={{ ...headCellSx, width: 110 }}>ROLE</TableCell>
                                <TableCell sx={{ ...headCellSx, width: 120 }}>STATUS</TableCell>
                                <TableCell sx={{ ...headCellSx, width: 130 }}>IDENTIFIER</TableCell>
                                <TableCell sx={{ ...headCellSx, width: 130 }}>JOINED</TableCell>
                                <TableCell sx={{ ...headCellSx, width: 120, textAlign: "center" }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6, border: "none" }}>
                                        <CircularProgress size={32} sx={{ color: "#25AFF4" }} />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6, border: "none" }}>
                                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#94a3b8", fontSize: 14 }}>
                                            No users found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : users.map((user) => {
                                const isActive = user.isActive !== false;
                                return (
                                    <TableRow
                                        key={user._id}
                                        hover
                                        sx={{
                                            height: 60,
                                            "&:last-child td": { border: 0 },
                                            transition: "all 0.2s ease",
                                            "&:hover": { backgroundColor: "#f9fafb", transform: "scale(1.005)" },
                                        }}
                                    >
                                        <TableCell sx={cellSx}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Box sx={{
                                                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                                                    background: user.role === "parent"
                                                        ? "linear-gradient(135deg, #a78bfa, #7c3aed)"
                                                        : user.role === "child"
                                                            ? "linear-gradient(135deg, #38bdf8, #0369a1)"
                                                            : "linear-gradient(135deg, #fbbf24, #b45309)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 12, color: "#fff" }}>
                                                        {user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: "#111827" }}>
                                                        {user.name}
                                                    </Typography>
                                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#94a3b8" }}>
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell sx={cellSx}><RoleBadge role={user.role} /></TableCell>

                                        <TableCell sx={cellSx}><StatusBadge active={isActive} /></TableCell>

                                        <TableCell sx={{ ...cellSx, color: "#6b7280" }}>
                                            {user.role === "child"
                                                ? (user.username ? `@${user.username}` : "—")
                                                : user.authProvider === "google" ? "Google" : "Local"}
                                        </TableCell>

                                        <TableCell sx={{ ...cellSx, color: "#6b7280" }}>
                                            {formatDate(user.createdAt)}
                                        </TableCell>

                                        <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                                            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                                                <Tooltip title="View details" placement="top" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setViewUserId(user._id)}
                                                        sx={{ color: "#d1d5db", transition: "all 0.2s ease", "&:hover": { color: "#25AFF4", background: "#e8f7fe", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(37,175,244,0.15)" }, p: 0.75 }}
                                                    >
                                                        <VisibilityIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {user.role !== "admin" && (
                                                    <Tooltip title={isActive ? "Suspend user" : "Activate user"} placement="top" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setStatusTarget(user)}
                                                            sx={{ color: "#d1d5db", transition: "all 0.2s ease", "&:hover": { color: isActive ? "#f59e0b" : "#22c55e", background: isActive ? "#fffbeb" : "#f0fdf4", transform: "scale(1.05)", boxShadow: isActive ? "0 2px 8px rgba(245,158,11,0.15)" : "0 2px 8px rgba(34,197,94,0.15)" }, p: 0.75 }}
                                                        >
                                                            {isActive ? <SuspendIcon sx={{ fontSize: 16 }} /> : <ActivateIcon sx={{ fontSize: 16 }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {user.role !== "admin" && (
                                                    <Tooltip title="Delete user" placement="top" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setDeleteTarget(user)}
                                                            sx={{ color: "#d1d5db", transition: "all 0.2s ease", "&:hover": { color: "#FF5144", background: "#fef2f2", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(255,81,68,0.15)" }, p: 0.75 }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {total > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 1.75, borderTop: "1px solid #f3f4f6", flexWrap: "wrap", gap: 1 }}>
                        <Typography sx={{ color: "#9ca3af", fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>
                            Showing{" "}
                            <Box component="span" sx={{ fontWeight: 700, color: "#374151" }}>{users.length}</Box>
                            {" "}of{" "}
                            <Box component="span" sx={{ fontWeight: 700, color: "#374151" }}>{total}</Box>
                            {" "}users
                        </Typography>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, p) => setPage(p)}
                            shape="circular"
                            size="small"
                            sx={{
                                "& .MuiPaginationItem-root": { fontSize: 13, transition: "all 0.2s ease", fontFamily: "'Poppins', sans-serif", "&:hover": { background: "#f3f4f6" } },
                                "& .MuiPaginationItem-root.Mui-selected": { background: "#3b82f6", color: "white", borderRadius: "50%", "&:hover": { background: "#2563eb" } },
                            }}
                        />
                    </Box>
                )}
            </Paper>

            {/* View Detail Modal */}
            <UserDetailModal userId={viewUserId} open={!!viewUserId} onClose={() => setViewUserId(null)} />

            {/* Suspend / Activate Confirmation */}
            <Dialog open={!!statusTarget} onClose={() => setStatusTarget(null)} maxWidth="xs" fullWidth TransitionComponent={Zoom}
                PaperProps={{ sx: { borderRadius: "16px", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" } }}>
                <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 17, color: "#111827", pb: 1, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {(statusTarget?.isActive !== false) ? "Suspend User" : "Activate User"}
                    <IconButton onClick={() => setStatusTarget(null)} size="small" sx={{ color: "#94a3b8" }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: "20px !important" }}>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#6b7280" }}>
                        {(statusTarget?.isActive !== false)
                            ? `Are you sure you want to suspend "${statusTarget?.name}"? They will be unable to log in.`
                            : `Reactivate "${statusTarget?.name}"? They will regain full access.`}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setStatusTarget(null)} sx={{ borderRadius: "999px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, textTransform: "none", color: "#64748b" }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleToggleStatus} disabled={togglingStatus}
                        sx={{ borderRadius: "999px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none", backgroundColor: (statusTarget?.isActive !== false) ? "#f59e0b" : "#22c55e", "&:hover": { backgroundColor: (statusTarget?.isActive !== false) ? "#d97706" : "#16a34a" }, boxShadow: "none", px: 2.5 }}
                    >
                        {togglingStatus ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : ((statusTarget?.isActive !== false) ? "Suspend" : "Activate")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth TransitionComponent={Zoom}
                PaperProps={{ sx: { borderRadius: "16px", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" } }}>
                <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 17, color: "#111827", pb: 1, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Delete User
                    <IconButton onClick={() => setDeleteTarget(null)} size="small" sx={{ color: "#94a3b8" }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: "20px !important" }}>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#6b7280" }}>
                        Are you sure you want to permanently delete <Box component="strong" sx={{ color: "#111827" }}>"{deleteTarget?.name}"</Box>?
                        {deleteTarget?.role === "parent" && " This will also delete all their children and associated data."}
                        {" "}This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: "999px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, textTransform: "none", color: "#64748b" }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleDelete} disabled={deleting}
                        sx={{ borderRadius: "999px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none", backgroundColor: "#FF5144", "&:hover": { backgroundColor: "#e84a3e" }, boxShadow: "none", px: 2.5 }}
                    >
                        {deleting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ borderRadius: "12px", fontFamily: "'Poppins', sans-serif", fontSize: 13 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
