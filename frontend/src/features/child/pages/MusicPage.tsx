import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Dialog, IconButton } from "@mui/material";
import { MusicNote as MusicIcon, Videocam as VideoIcon, Close as CloseIcon, PlayArrow as PlayIcon } from "@mui/icons-material";
import ChildSidebar from "../components/ChildSidebar";
import { fetchPublishedMusic, getMusicFileUrl, type ChildTrack } from "../api/musicApi";

// Warm gradient palettes for tracks without cover images
const MUSIC_GRADIENTS = [
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
    const idx = id.charCodeAt(id.length - 1) % MUSIC_GRADIENTS.length;
    return MUSIC_GRADIENTS[idx];
}

// ── Player Dialog ──────────────────────────────────────────────────────────────

function PlayerDialog({ track, onClose }: { track: ChildTrack; onClose: () => void }) {
    const [colors] = useState(() => gradientFor(track._id));

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                },
            }}>

            {/* Close button */}
            <IconButton onClick={onClose} size="small"
                sx={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: "rgba(0,0,0,0.35)", color: "#fff", "&:hover": { background: "rgba(0,0,0,0.55)" }, width: 32, height: 32 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>

            {/* Video or cover art */}
            {track.videoPath ? (
                <Box component="video"
                    controls
                    autoPlay
                    src={getMusicFileUrl(track.videoPath)}
                    sx={{ width: "100%", display: "block", maxHeight: 280, background: "#000" }}
                />
            ) : track.coverImagePath ? (
                <Box component="img"
                    src={getMusicFileUrl(track.coverImagePath)}
                    alt={track.title}
                    sx={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                />
            ) : (
                <Box sx={{ width: "100%", height: 200, background: `linear-gradient(160deg, ${colors[0]} 0%, ${colors[1]} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MusicIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.8)" }} />
                </Box>
            )}

            {/* Info + audio player */}
            <Box sx={{ p: 2.5 }}>
                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: "1.15rem", color: "#1A202C", lineHeight: 1.2, mb: 0.3 }}>
                    {track.title}
                </Typography>
                {track.artist && (
                    <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: "0.82rem", color: "#25AFF4", fontWeight: 600, mb: 1 }}>
                        {track.artist}
                    </Typography>
                )}
                {track.description && (
                    <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: "0.8rem", color: "#64748B", lineHeight: 1.5, mb: 1.5 }}>
                        {track.description}
                    </Typography>
                )}
                {track.audioPath && (
                    <Box component="audio"
                        controls
                        autoPlay={!track.videoPath}
                        src={getMusicFileUrl(track.audioPath)}
                        sx={{ width: "100%", display: "block", borderRadius: "8px" }}
                    />
                )}
            </Box>
        </Dialog>
    );
}

// ── Music Card ─────────────────────────────────────────────────────────────────

function MusicCard({ track, onClick }: { track: ChildTrack; onClick: () => void }) {
    const [colors] = useState(() => gradientFor(track._id));
    const hasVideo = !!track.videoPath;

    return (
        <Box onClick={onClick}
            sx={{
                cursor: "pointer",
                userSelect: "none",
                "&:hover .card-inner": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                },
                "&:hover .play-overlay": { opacity: 1 },
            }}>
            <Box className="card-inner"
                sx={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    background: "#fff",
                    transition: "transform 0.28s ease, box-shadow 0.28s ease",
                }}>

                {/* Cover area */}
                <Box sx={{ position: "relative", aspectRatio: "1/1", overflow: "hidden" }}>
                    {track.coverImagePath ? (
                        <Box component="img"
                            src={getMusicFileUrl(track.coverImagePath)}
                            alt={track.title}
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    ) : (
                        <Box sx={{ width: "100%", height: "100%", background: `linear-gradient(160deg, ${colors[0]} 0%, ${colors[1]} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MusicIcon sx={{ fontSize: { xs: 40, md: 52 }, color: "rgba(255,255,255,0.85)" }} />
                        </Box>
                    )}

                    {/* Video badge */}
                    {hasVideo && (
                        <Box sx={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 0.4, px: 1, py: 0.3, borderRadius: "6px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                            <VideoIcon sx={{ fontSize: 12, color: "#8EE870" }} />
                            <Typography sx={{ fontSize: 9, fontWeight: 700, color: "#8EE870", fontFamily: "'Poppins',sans-serif", lineHeight: 1 }}>VIDEO</Typography>
                        </Box>
                    )}

                    {/* Play overlay */}
                    <Box className="play-overlay"
                        sx={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                            <PlayIcon sx={{ fontSize: 24, color: "#25AFF4", ml: 0.4 }} />
                        </Box>
                    </Box>
                </Box>

                {/* Title strip */}
                <Box sx={{ px: 1.25, py: 1, background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: { xs: "0.72rem", md: "0.8rem" }, color: "#1A202C", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {track.title}
                    </Typography>
                    {track.artist && (
                        <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: { xs: "0.65rem", md: "0.72rem" }, color: "#25AFF4", fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {track.artist}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MusicPage() {
    const [tracks,  setTracks]  = useState<ChildTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState<ChildTrack | null>(null);

    useEffect(() => {
        fetchPublishedMusic()
            .then(setTracks)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", background: "#F4F8FB" }}>
            <ChildSidebar activePage="PRACTICE" />

            <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>

                {/* Hero header */}
                <Box sx={{ mb: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                        <Typography sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }}>🎵</Typography>
                        <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: { xs: "1.8rem", md: "2.4rem" }, color: "#1A202C", lineHeight: 1.1 }}>
                            Listen Music!
                        </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: { xs: "0.9rem", md: "1rem" }, color: "#64748B", fontWeight: 500, ml: 0.5 }}>
                        Pick a song and start listening 🎶
                    </Typography>
                </Box>

                {/* Content */}
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
                        <CircularProgress sx={{ color: "#25AFF4" }} size={44} />
                    </Box>
                ) : tracks.length === 0 ? (
                    <Box sx={{ textAlign: "center", pt: 10 }}>
                        <Typography sx={{ fontSize: "3rem", mb: 1.5 }}>🎸</Typography>
                        <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "1.3rem", color: "#64748B" }}>
                            No music yet!
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: "0.9rem", color: "#94A3B8", mt: 0.5 }}>
                            Check back soon — new songs are coming!
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(4,1fr)", lg: "repeat(5,1fr)" }, gap: { xs: 2, md: 3 } }}>
                        {tracks.map(track => (
                            <MusicCard key={track._id} track={track} onClick={() => setPlaying(track)} />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Player dialog */}
            {playing && <PlayerDialog track={playing} onClose={() => setPlaying(null)} />}
        </Box>
    );
}
