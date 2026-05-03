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

// ── Age group colour palette ──────────────────────────────────────────────────
const AG_META: Record<string, { label: string; color: string; bg: string; border: string; gradient: string }> = {
    "5-6":  { label: "5–6 yrs", color: "#dc2626", bg: "#fff1f2", border: "#fecaca", gradient: "linear-gradient(135deg,#ef4444,#dc2626)" },
    "7-8":  { label: "7–8 yrs", color: "#b45309", bg: "#fffbeb", border: "#fde68a", gradient: "linear-gradient(135deg,#f59e0b,#b45309)" },
    "9-10": { label: "9–10 yrs", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", gradient: "linear-gradient(135deg,#22c55e,#15803d)" },
};

// ── Stat pill inside each age-group card ──────────────────────────────────────
function StatPill({ icon, label, value, color, bg }: {
    icon: React.ReactNode; label: string; value: number; color: string; bg: string;
}) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "12px", background: bg, flex: 1 }}>
            <Box sx={{ color, flexShrink: 0 }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 20, color: "#111827", lineHeight: 1 }}>
                    {value.toLocaleString()}
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}

// ── Age Group Card ────────────────────────────────────────────────────────────
function AgeGroupCard({ stat }: { stat: AgeGroupStat }) {
    const meta = AG_META[stat.ageGroup] ?? { label: stat.ageGroup, color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", gradient: "linear-gradient(135deg,#64748b,#475569)" };

    return (
        <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e8ecf1", overflow: "hidden", background: "#fff", transition: "box-shadow 0.2s, transform 0.2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transform: "translateY(-2px)" } }}>
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
                    <StatPill icon={<ChildIcon sx={{ fontSize: 18 }} />} label="Children" value={stat.children} color={meta.color} bg={meta.bg} />
                    <StatPill icon={<CategoryIcon sx={{ fontSize: 18 }} />} label="Categories" value={stat.categories.length} color="#25AFF4" bg="#e0f7fe" />
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <StatPill icon={<QuizIcon sx={{ fontSize: 18 }} />} label="Quiz Qs" value={stat.quizQuestions} color="#8b5cf6" bg="#f5f3ff" />
                    <StatPill icon={<PlacementIcon sx={{ fontSize: 18 }} />} label="Placement Qs" value={stat.placementQuestions} color="#f59e0b" bg="#fffbeb" />
                </Box>
            </Box>
        </Paper>
    );
}

// ── Category badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "active" | "pending" }) {
    return (
        <Chip
            label={status === "active" ? "Active" : "Pending"}
            size="small"
            sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "0.68rem",
                color: status === "active" ? "#15803d" : "#b45309",
                backgroundColor: status === "active" ? "#f0fdf4" : "#fffbeb",
                border: "none",
                height: 22,
            }}
        />
    );
}

function AgeBadge({ group }: { group: string }) {
    const meta = AG_META[group];
    if (!meta) return null;
    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.2, py: 0.2, borderRadius: "999px", background: meta.bg, border: `1px solid ${meta.border}`, mr: 0.5, mb: 0.5 }}>
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
        color: "#6b7280",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: "0.5px",
        borderBottom: "1px solid #f3f4f6",
        padding: "12px 16px",
        background: "#f9fafb",
    };

    const cellSx = {
        fontFamily: "'Poppins', sans-serif",
        fontSize: 13,
        color: "#374151",
        borderBottom: "1px solid #f3f4f6",
        padding: "12px 16px",
        height: 56,
    };

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
                <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 0.5 }}>
                    Age Groups
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontSize: { xs: "0.875rem", md: "0.95rem" } }}>
                    Overview of the three learning age groups and their content
                </Typography>
            </Box>

            {/* Age Group Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat) => (
                    <Grid key={stat.ageGroup} size={{ xs: 12, sm: 6, md: 4 }}>
                        <AgeGroupCard stat={stat} />
                    </Grid>
                ))}
            </Grid>

            {/* Categories Table */}
            <Paper elevation={0} sx={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "#fff" }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #f3f4f6" }}>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: "#111827" }}>
                        Categories by Age Group
                    </Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#6b7280", mt: 0.3 }}>
                        All categories and which age groups they belong to
                    </Typography>
                </Box>

                {allCategories.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                        <CategoryIcon sx={{ fontSize: 40, color: "#e2e8f0", mb: 1 }} />
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#94a3b8", fontSize: 14 }}>
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
                                                    <Typography component="div" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "#94a3b8", fontWeight: 500, mt: 0.2 }}>
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
                                    <TableRow key={cat.name} hover sx={{ height: 56, transition: "all 0.2s ease", "&:hover": { backgroundColor: "#f9fafb" }, "&:last-child td": { border: 0 } }}>
                                        <TableCell sx={cellSx}>
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: "#111827" }}>
                                                {cat.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={cellSx}>
                                            <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                                                {cat.ageGroups.map((ag) => <AgeBadge key={ag} group={ag} />)}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                                            <StatusBadge status={cat.status} />
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
                                                        <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: "#f3f4f6", mx: "auto" }} />
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
