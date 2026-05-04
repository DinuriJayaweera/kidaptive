import { useState, useEffect } from "react";
import {
    Box, Typography, Paper, CircularProgress, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from "@mui/material";
import {
    ChildCare as ChildIcon,
    Quiz as QuizIcon,
    Assignment as PlacementIcon,
    Category as CategoryIcon,
} from "@mui/icons-material";
import { getAgeGroupStats, type AgeGroupStat } from "../api/adminAgeGroupsApi";
import { useAdminTheme } from "../context/AdminThemeContext";

// ── Age group colour palette ──────────────────────────────────────────────────
const AG_META: Record<string, { label: string; color: string; bg: string; darkBg: string; border: string; gradient: string }> = {
    "5-6":  { label: "5–6 yrs", color: "#dc2626", bg: "#fff1f2", darkBg: "rgba(239,68,68,0.15)", border: "#fecaca", gradient: "linear-gradient(135deg,#ef4444,#dc2626)" },
    "7-8":  { label: "7–8 yrs", color: "#b45309", bg: "#fffbeb", darkBg: "rgba(245,158,11,0.15)", border: "#fde68a", gradient: "linear-gradient(135deg,#f59e0b,#b45309)" },
    "9-10": { label: "9–10 yrs", color: "#15803d", bg: "#f0fdf4", darkBg: "rgba(34,197,94,0.15)", border: "#bbf7d0", gradient: "linear-gradient(135deg,#22c55e,#15803d)" },
};

// ── Stat pill inside each age-group card ──────────────────────────────────────
function StatPill({ icon, label, value, color, bg, darkBg, isDark }: {
    icon: React.ReactNode; label: string; value: number; color: string; bg: string; darkBg?: string; isDark?: boolean;
}) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "12px", background: isDark ? (darkBg || "var(--bg-subtle)") : bg, border: isDark ? "1px solid var(--border-color)" : "none", flex: 1 }}>
            <Box sx={{ color, flexShrink: 0 }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 20, color: "var(--text-primary)", lineHeight: 1 }}>
                    {value.toLocaleString()}
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}

// ── Age Group Card ────────────────────────────────────────────────────────────
function AgeGroupCard({ stat, isDark }: { stat: AgeGroupStat; isDark: boolean }) {
    const meta = AG_META[stat.ageGroup] ?? { label: stat.ageGroup, color: "#64748b", bg: "#f1f5f9", darkBg: "rgba(100,116,139,0.15)", border: "#e2e8f0", gradient: "linear-gradient(135deg,#64748b,#475569)" };

    return (
        <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", background: "var(--card-bg)", transition: "box-shadow 0.2s, transform 0.2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transform: "translateY(-2px)" } }}>
            {/* Coloured header */}
            <Box sx={{ background: meta.gradient, px: 3, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.6px", mb: 0.3 }}>
                        Age Group
                    </Typography>
                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: 28, color: "#fff", lineHeight: 1 }}>
                        {meta.label}
                    </Typography>
                </Box>
                <Box sx={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChildIcon sx={{ fontSize: 28, color: "#fff" }} />
                </Box>
            </Box>

            {/* Stats grid */}
            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <StatPill icon={<ChildIcon sx={{ fontSize: 18 }} />} label="Children" value={stat.children} color={meta.color} bg={meta.bg} darkBg={meta.darkBg} isDark={isDark} />
                    <StatPill icon={<CategoryIcon sx={{ fontSize: 18 }} />} label="Categories" value={stat.categories.length} color="#25AFF4" bg="#e0f7fe" darkBg="rgba(37,175,244,0.15)" isDark={isDark} />
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <StatPill icon={<QuizIcon sx={{ fontSize: 18 }} />} label="Quiz Qs" value={stat.quizQuestions} color="#8b5cf6" bg="#f5f3ff" darkBg="rgba(139,92,246,0.15)" isDark={isDark} />
                    <StatPill icon={<PlacementIcon sx={{ fontSize: 18 }} />} label="Placement Qs" value={stat.placementQuestions} color="#f59e0b" bg="#fffbeb" darkBg="rgba(245,158,11,0.15)" isDark={isDark} />
                </Box>
            </Box>
        </Paper>
    );
}

// ── Category badge ────────────────────────────────────────────────────────────
function StatusBadge({ status, isDark }: { status: "active" | "pending"; isDark: boolean }) {
    return (
        <Chip
            label={status === "active" ? "Active" : "Pending"}
            size="small"
            sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "0.68rem",
                color: status === "active" ? "#15803d" : "#b45309",
                backgroundColor: status === "active"
                    ? (isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4")
                    : (isDark ? "rgba(245,158,11,0.15)" : "#fffbeb"),
                border: "none",
                height: 22,
            }}
        />
    );
}

function AgeBadge({ group, isDark }: { group: string; isDark: boolean }) {
    const meta = AG_META[group];
    if (!meta) return null;
    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.2, py: 0.2, borderRadius: "999px", background: isDark ? meta.darkBg : meta.bg, border: `1px solid ${isDark ? "var(--border-color)" : meta.border}`, mr: 0.5, mb: 0.5 }}>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 700, color: meta.color }}>
                {meta.label}
            </Typography>
        </Box>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AgeGroupsPage() {
    const [stats, setStats] = useState<AgeGroupStat[]>([]);
    const [loading, setLoading] = useState(true);
    const { mode } = useAdminTheme();
    const isDark = mode === "dark";

    useEffect(() => {
        let active = true;
        getAgeGroupStats()
            .then((d) => { if (active) setStats(d); })
            .catch(() => {})
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    // Merge all unique categories across all age groups for the table
    const categoryMap = new Map<string, { name: string; status: "active" | "pending"; ageGroups: string[] }>();
    for (const s of stats) {
        for (const cat of s.categories) {
            if (!categoryMap.has(cat._id)) {
                categoryMap.set(cat._id, { name: cat.name, status: cat.status, ageGroups: cat.ageGroups });
            }
        }
    }
    const allCategories = Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    const headCellSx = {
        fontFamily: "'Poppins', sans-serif",
        color: "var(--text-secondary)",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: "0.5px",
        borderBottom: "1px solid var(--border-light)",
        padding: "12px 16px",
        background: "var(--bg-subtle)",
    };

    const cellSx = {
        fontFamily: "'Poppins', sans-serif",
        fontSize: 13,
        color: "var(--text-primary)",
        borderBottom: "1px solid var(--border-light)",
        padding: "12px 16px",
        height: 56,
    };

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
                <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 0.5 }}>
                    Age Groups
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontSize: { xs: "0.875rem", md: "0.95rem" } }}>
                    Overview of the three learning age groups and their content
                </Typography>
            </Box>

            {/* Age Group Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat) => (
                    <Grid key={stat.ageGroup} size={{ xs: 12, sm: 6, md: 4 }}>
                        <AgeGroupCard stat={stat} isDark={isDark} />
                    </Grid>
                ))}
            </Grid>

            {/* Categories Table */}
            <Paper elevation={0} sx={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "var(--card-bg)" }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid var(--border-light)" }}>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                        Categories by Age Group
                    </Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "var(--text-secondary)", mt: 0.3 }}>
                        All categories and which age groups they belong to
                    </Typography>
                </Box>

                {allCategories.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <CategoryIcon sx={{ fontSize: 40, color: "var(--border-color)", mb: 1 }} />
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-tertiary)", fontSize: 14 }}>
                            No categories found. Add categories first.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 500 }}>
                            <TableHead>
                                <TableRow sx={{ height: 48 }}>
                                    <TableCell sx={headCellSx}>CATEGORY NAME</TableCell>
                                    <TableCell sx={headCellSx}>AGE GROUPS</TableCell>
                                    <TableCell sx={{ ...headCellSx, width: 120, textAlign: "center" }}>STATUS</TableCell>
                                    {["5-6", "7-8", "9-10"].map((ag) => {
                                        const s = stats.find((x) => x.ageGroup === ag);
                                        return (
                                            <TableCell key={ag} sx={{ ...headCellSx, width: 110, textAlign: "center" }}>
                                                {ag} YRS
                                                {s && (
                                                    <Typography component="div" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "var(--text-tertiary)", fontWeight: 500, mt: 0.2 }}>
                                                        {s.quizQuestions} quiz Qs
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allCategories.map((cat) => (
                                    <TableRow key={cat.name} hover sx={{ height: 56, transition: "all 0.2s ease", "&:hover": { backgroundColor: "var(--bg-subtle)" }, "&:last-child td": { border: 0 } }}>
                                        <TableCell sx={cellSx}>
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                                                {cat.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={cellSx}>
                                            <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                                                {cat.ageGroups.map((ag) => <AgeBadge key={ag} group={ag} isDark={isDark} />)}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                                            <StatusBadge status={cat.status} isDark={isDark} />
                                        </TableCell>
                                        {["5-6", "7-8", "9-10"].map((ag) => {
                                            const belongs = cat.ageGroups.includes(ag);
                                            const meta = AG_META[ag];
                                            return (
                                                <TableCell key={ag} sx={{ ...cellSx, textAlign: "center" }}>
                                                    {belongs ? (
                                                        <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: meta.gradient, mx: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <Typography sx={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</Typography>
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg-hover)", mx: "auto" }} />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
}
