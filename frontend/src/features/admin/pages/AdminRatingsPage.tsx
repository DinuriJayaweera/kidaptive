import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Card, CardContent, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Pagination, Avatar,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import api from "../../../services/apiClient";

interface Rating {
    _id: string;
    parentId: string;
    parentName: string;
    rating: number;
    feedback?: string;
    createdAt: string;
}

interface RatingsResponse {
    ratings: Rating[];
    total: number;
    page: number;
    pages: number;
    avgRating: number;
}

function StarDisplay({ value }: { value: number }) {
    return (
        <Box sx={{ display: "flex", gap: 0.2, alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((s) =>
                s <= value ? (
                    <StarRoundedIcon key={s} sx={{ fontSize: 18, color: "#FBBF24" }} />
                ) : (
                    <StarBorderRoundedIcon key={s} sx={{ fontSize: 18, color: "#d1d5db" }} />
                ),
            )}
        </Box>
    );
}

const ratingColor = (avg: number) =>
    avg >= 4.5 ? "#16a34a" : avg >= 3.5 ? "#ca8a04" : avg >= 2.5 ? "#ea580c" : "#dc2626";

export default function AdminRatingsPage() {
    const [data, setData]       = useState<RatingsResponse | null>(null);
    const [page, setPage]       = useState(1);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await api.get<RatingsResponse>(`/admin/ratings?page=${p}&limit=20`);
            setData(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(page); }, [load, page]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data?.ratings.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Parent Ratings</Typography>
            <Typography variant="body2" sx={{ color: "var(--text-muted)", mb: 3 }}>
                Feedback submitted by parents after adding their first child.
            </Typography>

            {/* ── Summary cards ── */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                <Card sx={{ flex: "1 1 160px", borderRadius: 3, boxShadow: "none", border: "1px solid var(--border-color)" }}>
                    <CardContent sx={{ textAlign: "center", py: "16px !important" }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: ratingColor(data?.avgRating ?? 0), lineHeight: 1, mb: 0.5 }}>
                            {data ? data.avgRating.toFixed(1) : "—"}
                        </Typography>
                        <StarDisplay value={Math.round(data?.avgRating ?? 0)} />
                        <Typography variant="caption" sx={{ color: "var(--text-muted)", mt: 0.5, display: "block" }}>
                            Average rating
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ flex: "1 1 160px", borderRadius: 3, boxShadow: "none", border: "1px solid var(--border-color)" }}>
                    <CardContent sx={{ textAlign: "center", py: "16px !important" }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#25AFF4", lineHeight: 1, mb: 0.5 }}>
                            {data?.total ?? "—"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "var(--text-muted)" }}>Total ratings</Typography>
                    </CardContent>
                </Card>

                {/* Rating distribution */}
                <Card sx={{ flex: "2 1 280px", borderRadius: 3, boxShadow: "none", border: "1px solid var(--border-color)" }}>
                    <CardContent sx={{ py: "16px !important" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-muted)", mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: 0.8 }}>
                            Distribution
                        </Typography>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = distribution[star] ?? 0;
                            const pct   = data?.total ? (count / data.total) * 100 : 0;
                            return (
                                <Box key={star} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
                                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, width: 10, color: "#475569" }}>{star}</Typography>
                                    <StarRoundedIcon sx={{ fontSize: 14, color: "#FBBF24" }} />
                                    <Box sx={{ flex: 1, height: 8, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                                        <Box sx={{ height: "100%", width: `${pct}%`, background: "#FBBF24", borderRadius: 4, transition: "width 0.5s ease" }} />
                                    </Box>
                                    <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", width: 22 }}>{count}</Typography>
                                </Box>
                            );
                        })}
                    </CardContent>
                </Card>
            </Box>

            {/* ── Ratings table ── */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : !data?.ratings.length ? (
                <Box sx={{ textAlign: "center", py: 8, color: "var(--text-muted)" }}>
                    <Typography sx={{ fontSize: "2rem", mb: 1 }}>⭐</Typography>
                    <Typography>No ratings yet. Ratings will appear here after parents submit feedback.</Typography>
                </Box>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "none", border: "1px solid var(--border-color)" }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-muted)", borderBottom: "2px solid var(--border-color)", py: 1.5 } }}>
                                    <TableCell>Parent</TableCell>
                                    <TableCell>Rating</TableCell>
                                    <TableCell>Feedback</TableCell>
                                    <TableCell>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.ratings.map((r) => (
                                    <TableRow key={r._id} sx={{ "&:hover": { backgroundColor: "var(--bg-subtle)" }, "& td": { py: 1.5, borderColor: "var(--border-color)" } }}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar sx={{ width: 34, height: 34, fontSize: "0.85rem", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                                                    {r.parentName?.[0]?.toUpperCase() ?? "P"}
                                                </Avatar>
                                                <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>{r.parentName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <StarDisplay value={r.rating} />
                                                <Chip
                                                    label={r.rating}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: "0.75rem",
                                                        backgroundColor: r.rating >= 4 ? "#dcfce7" : r.rating >= 3 ? "#fef9c3" : "#fee2e2",
                                                        color:           r.rating >= 4 ? "#16a34a" : r.rating >= 3 ? "#854d0e" : "#dc2626",
                                                        height: 22,
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 380 }}>
                                            <Typography sx={{ fontSize: "0.85rem", color: r.feedback ? "var(--text-primary)" : "var(--text-muted)", fontStyle: r.feedback ? "normal" : "italic" }}>
                                                {r.feedback || "No feedback provided"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                                {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {data.pages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                            <Pagination
                                count={data.pages}
                                page={page}
                                onChange={(_, v) => setPage(v)}
                                color="primary"
                                shape="rounded"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}
