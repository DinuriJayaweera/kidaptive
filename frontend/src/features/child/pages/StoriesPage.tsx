import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { MenuBook as BookIcon } from "@mui/icons-material";
import ChildSidebar from "../components/ChildSidebar";
import { fetchPublishedStories, getStoryFileUrl, type ChildStory } from "../api/storiesApi";

// Warm gradient palettes for books without cover images
const BOOK_GRADIENTS = [
    ["#FF6B6B", "#FF8E53"],
    ["#4ECDC4", "#44A08D"],
    ["#A770EF", "#CF8BF3"],
    ["#F7971E", "#FFD200"],
    ["#56CCF2", "#2F80ED"],
    ["#F953C6", "#B91D73"],
    ["#43E97B", "#38F9D7"],
    ["#FA709A", "#FEE140"],
];

function gradientFor(id: string) {
    const idx = id.charCodeAt(id.length - 1) % BOOK_GRADIENTS.length;
    return BOOK_GRADIENTS[idx];
}

export default function StoriesPage() {
    const navigate = useNavigate();
    const [stories, setStories] = useState<ChildStory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublishedStories()
            .then(setStories)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", background: "#F4F8FB" }}>
            <ChildSidebar activePage="MORE" />

            <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
                {/* ── Hero header ──────────────────────── */}
                <Box sx={{ mb: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                        <Typography sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }}>📚</Typography>
                        <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: { xs: "1.8rem", md: "2.4rem" }, color: "#1A202C", lineHeight: 1.1 }}>
                            Story Time!
                        </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: { xs: "0.9rem", md: "1rem" }, color: "#64748B", fontWeight: 500, ml: 0.5 }}>
                        Pick a book and start your adventure ✨
                    </Typography>
                </Box>

                {/* ── Content ──────────────────────────── */}
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
                        <CircularProgress sx={{ color: "#25AFF4" }} size={44} />
                    </Box>
                ) : stories.length === 0 ? (
                    <Box sx={{ textAlign: "center", pt: 10 }}>
                        <Typography sx={{ fontSize: "3rem", mb: 1.5 }}>🌟</Typography>
                        <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "1.3rem", color: "#64748B" }}>
                            No stories yet!
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: "0.9rem", color: "#94A3B8", mt: 0.5 }}>
                            Check back soon — new stories are coming!
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(4,1fr)", lg: "repeat(5,1fr)" }, gap: { xs: 2, md: 3 } }}>
                        {stories.map(story => (
                            <BookCard key={story._id} story={story} onClick={() => navigate(`/child/stories/${story._id}`)} />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// ── Book Card ──────────────────────────────────────────────

function BookCard({ story, onClick }: { story: ChildStory; onClick: () => void }) {
    const [colors] = useState(() => gradientFor(story._id));

    return (
        <Box onClick={onClick}
            sx={{
                cursor: "pointer",
                userSelect: "none",
                perspective: "800px",
                "&:hover .book-inner": {
                    transform: "rotateY(0deg) translateY(-6px)",
                    boxShadow: "10px 16px 40px rgba(0,0,0,0.25)",
                },
            }}>
            <Box className="book-inner"
                sx={{
                    position: "relative",
                    borderRadius: "4px 12px 12px 4px",
                    overflow: "hidden",
                    transform: "rotateY(-8deg)",
                    transformOrigin: "left center",
                    boxShadow: "6px 8px 24px rgba(0,0,0,0.18), inset -3px 0 8px rgba(0,0,0,0.12)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    background: "#fff",
                }}>

                {/* Spine shadow */}
                <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: "rgba(0,0,0,0.18)", zIndex: 2, borderRadius: "4px 0 0 4px" }} />

                {/* Cover */}
                <Box sx={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
                    {story.coverImagePath ? (
                        <Box component="img"
                            src={getStoryFileUrl(story.coverImagePath)}
                            alt={story.title}
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    ) : (
                        <Box sx={{ width: "100%", height: "100%", background: `linear-gradient(160deg, ${colors[0]} 0%, ${colors[1]} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, p: 1.5 }}>
                            <BookIcon sx={{ fontSize: { xs: 36, md: 44 }, color: "rgba(255,255,255,0.9)" }} />
                            <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: { xs: "0.7rem", md: "0.8rem" }, color: "rgba(255,255,255,0.95)", textAlign: "center", lineHeight: 1.3 }}>
                                {story.title}
                            </Typography>
                        </Box>
                    )}

                    {/* Page edges illusion */}
                    <Box sx={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 6, background: "linear-gradient(to right, rgba(0,0,0,0.05), rgba(255,255,255,0.6))", pointerEvents: "none" }} />
                </Box>

                {/* Title strip at bottom */}
                <Box sx={{ px: 1.5, py: 1, background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: { xs: "0.72rem", md: "0.8rem" }, color: "#1A202C", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {story.title}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
