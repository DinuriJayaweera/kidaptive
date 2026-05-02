import { useEffect, useState } from "react";
import {
    Box, Typography, CircularProgress, Button,
    Dialog, DialogContent, DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";
import { getGames, unlockGame, type GameCard } from "../services/gamesApi";
import { getDashboardData } from "../services/quizApi";
import wordFinderIcon from "../../../assets/wordfinder.png";
import spellingChallengeIcon from "../../../assets/spellingchallenge.png";
import wordBuilderIcon from "../../../assets/wordbulder.png";

const GAME_ICONS: Record<string, string> = {
    "word-finder": wordFinderIcon,
    "spelling-challenge": spellingChallengeIcon,
    "word-builder": wordBuilderIcon,
};

// ── Confirmation Dialog ───────────────────────────────────────────────────────

function UnlockDialog({
    game,
    currentGems,
    onClose,
    onConfirm,
    loading,
}: {
    game: GameCard | null;
    currentGems: number;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}) {
    if (!game) return null;
    const canAfford = currentGems >= game.gemCost;

    return (
        <Dialog
            open={!!game}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: "24px",
                    p: 1,
                    maxWidth: 380,
                    width: "100%",
                    background: "linear-gradient(135deg, #fff 0%, #F8FAFF 100%)",
                    border: "2px solid #E8ECF1",
                },
            }}
        >
            <DialogContent sx={{ textAlign: "center", pt: 3, pb: 1 }}>
                <Box sx={{ fontSize: "4rem", mb: 1 }}>{game.emoji}</Box>
                <Typography
                    sx={{
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: "1.4rem",
                        color: "#1A202C",
                        mb: 0.5,
                    }}
                >
                    {game.name}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.85rem",
                        color: "#64748B",
                        mb: 2.5,
                    }}
                >
                    {game.description}
                </Typography>

                <Box
                    sx={{
                        backgroundColor: canAfford ? "rgba(37,175,244,0.08)" : "rgba(255,81,68,0.08)",
                        border: `2px solid ${canAfford ? "rgba(37,175,244,0.3)" : "rgba(255,81,68,0.3)"}`,
                        borderRadius: "16px",
                        p: 2,
                        mb: 2,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: "'Baloo 2', sans-serif",
                            fontWeight: 800,
                            fontSize: "1.6rem",
                            color: canAfford ? "#25AFF4" : "#FF5144",
                        }}
                    >
                        💎 {game.gemCost} Gems
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "0.78rem",
                            color: canAfford ? "#25AFF4" : "#FF5144",
                            fontWeight: 600,
                        }}
                    >
                        {canAfford
                            ? `You have ${currentGems} gems — enough to unlock!`
                            : `You need ${game.gemCost - currentGems} more gems`}
                    </Typography>
                </Box>

                {canAfford && (
                    <Typography
                        sx={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "0.82rem",
                            color: "#64748B",
                        }}
                    >
                        Spend <strong>{game.gemCost} gems</strong> to unlock <strong>{game.name}</strong>? This is a one-time purchase — play forever!
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", gap: 1.5, pb: 3, px: 3 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: "30px",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        textTransform: "none",
                        borderColor: "#CBD5E1",
                        color: "#64748B",
                        px: 3,
                        "&:hover": { borderColor: "#94A3B8", backgroundColor: "rgba(0,0,0,0.03)" },
                    }}
                >
                    Cancel
                </Button>
                {canAfford && (
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        variant="contained"
                        sx={{
                            borderRadius: "30px",
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            textTransform: "none",
                            background: "linear-gradient(135deg, #25AFF4 0%, #1d96d4 100%)",
                            px: 3,
                            boxShadow: "0 4px 12px rgba(37,175,244,0.3)",
                            "&:hover": { boxShadow: "0 6px 16px rgba(37,175,244,0.4)" },
                        }}
                    >
                        {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "🔓 Unlock Now!"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

// ── Game Card ─────────────────────────────────────────────────────────────────

function GameCardItem({
    game,
    currentGems,
    onUnlock,
    onPlay,
}: {
    game: GameCard;
    currentGems: number;
    onUnlock: (game: GameCard) => void;
    onPlay: (game: GameCard) => void;
}) {
    const canAfford = currentGems >= game.gemCost;
    const icon = GAME_ICONS[game.id];

    return (
        <Box
            onClick={() => game.unlocked ? onPlay(game) : onUnlock(game)}
            sx={{
                borderRadius: "20px",
                border: `2px solid ${game.unlocked ? game.color + "50" : "#E2E8F0"}`,
                backgroundColor: game.unlocked ? "#fff" : "#F8FAFF",
                p: { xs: 2, sm: 2.5 },
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
                position: "relative",
                transition: "all 0.25s ease",
                textAlign: "center",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 10px 28px ${game.color}30`,
                },
            }}
        >
            {/* Lock / gem badge */}
            {!game.unlocked && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        backgroundColor: canAfford ? "#25AFF4" : "#94A3B8",
                        borderRadius: "12px",
                        px: 1,
                        py: 0.3,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.4,
                    }}
                >
                    <Typography sx={{ fontSize: "0.6rem" }}>💎</Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "0.7rem", color: "#fff" }}>
                        {game.gemCost}
                    </Typography>
                </Box>
            )}

            {/* Game icon */}
            {icon ? (
                <Box
                    component="img"
                    src={icon}
                    alt={game.name}
                    sx={{
                        width: { xs: 72, sm: 96 },
                        height: { xs: 72, sm: 96 },
                        objectFit: "contain",
                        opacity: game.unlocked ? 1 : 0.35,
                        filter: game.unlocked ? "none" : "grayscale(80%)",
                    }}
                />
            ) : (
                <Typography sx={{ fontSize: { xs: "3rem", sm: "4rem" }, opacity: game.unlocked ? 1 : 0.4 }}>
                    {game.emoji}
                </Typography>
            )}

            {/* Name */}
            <Typography
                sx={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: { xs: "0.95rem", sm: "1.1rem" },
                    color: game.unlocked ? "#1A202C" : "#94A3B8",
                    lineHeight: 1.2,
                }}
            >
                {game.name}
            </Typography>
        </Box>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GamesPage() {
    const navigate = useNavigate();
    const [games, setGames] = useState<GameCard[]>([]);
    // Single unified stats — gems is authoritative from games API (includes real balance)
    const [stats, setStats] = useState({ totalXp: 0, streak: 0, gems: 0 });
    const [loading, setLoading] = useState(true);
    const [confirmGame, setConfirmGame] = useState<GameCard | null>(null);
    const [unlocking, setUnlocking] = useState(false);
    const [toast, setToast] = useState<{ message: string; color: string } | null>(null);

    useEffect(() => {
        Promise.allSettled([getGames(), getDashboardData()])
            .then(([gamesResult, dashResult]) => {
                const gamesData = gamesResult.status === "fulfilled" ? gamesResult.value : null;
                const dashData = dashResult.status === "fulfilled" ? dashResult.value : null;

                if (gamesData) setGames(gamesData.games);

                setStats({
                    totalXp: dashData?.stats?.totalXp ?? 0,
                    streak: dashData?.stats?.streak ?? 0,
                    gems: gamesData?.gems ?? dashData?.stats?.gems ?? 0,
                });

                if (gamesResult.status === "rejected") {
                    console.error("Failed to load games:", gamesResult.reason);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const showToast = (message: string, color = "#25AFF4") => {
        setToast({ message, color });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUnlockConfirm = async () => {
        if (!confirmGame) return;
        setUnlocking(true);
        try {
            const result = await unlockGame(confirmGame.id);
            setStats((s) => ({ ...s, gems: result.newGemBalance }));
            setGames((prev) =>
                prev.map((g) => (g.id === confirmGame.id ? { ...g, unlocked: true } : g))
            );
            setConfirmGame(null);
            showToast(`🎉 ${confirmGame.name} unlocked! Go play!`, confirmGame.color);
        } catch (err: any) {
            showToast(err?.response?.data?.message ?? "Could not unlock game.", "#FF5144");
            setConfirmGame(null);
        } finally {
            setUnlocking(false);
        }
    };

    const handlePlay = (game: GameCard) => {
        navigate(`/child/games/${game.id}`);
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    const unlockedCount = games.filter((g) => g.unlocked).length;

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
            <ChildSidebar activePage="MORE" />

            <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 } }}>
                {/* Top stats */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                    <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
                </Box>

                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: "#fff",
                        borderRadius: "24px",
                        border: "2px solid #E8ECF1",
                        p: { xs: 2.5, sm: 3.5 },
                        mb: 4,
                        background: "linear-gradient(135deg, #fff 0%, #F0F9FF 100%)",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                        <Box>
                            <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1.8rem", sm: "2.2rem" }, color: "#1A202C", lineHeight: 1.2 }}>
                                🎮 Game Station
                            </Typography>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", color: "#64748B", mt: 0.5 }}>
                                Spend your gems to unlock learning games. Earn gems by playing!
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                            <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#25AFF4", lineHeight: 1 }}>
                                {unlockedCount} / {games.length}
                            </Typography>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                                Games Unlocked
                            </Typography>
                        </Box>
                    </Box>

                    {/* Gem economy tip */}
                    <Box
                        sx={{
                            mt: 2.5,
                            p: 1.5,
                            borderRadius: "14px",
                            backgroundColor: "rgba(37,175,244,0.07)",
                            border: "1.5px solid rgba(37,175,244,0.2)",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        <Typography sx={{ fontSize: "1.5rem" }}>💡</Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", color: "#0369A1", fontWeight: 500 }}>
                            <strong>Tip:</strong> Complete quizzes to earn gems, then spend them here to unlock games. Each game level you complete also earns you bonus gems!
                        </Typography>
                    </Box>
                </Box>

                {/* Game grid */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                        gap: { xs: 2, sm: 3 },
                    }}
                >
                    {games.map((game) => (
                        <GameCardItem
                            key={game.id}
                            game={game}
                            currentGems={stats.gems}
                            onUnlock={setConfirmGame}
                            onPlay={handlePlay}
                        />
                    ))}
                </Box>
            </Box>

            {/* Unlock confirmation dialog */}
            <UnlockDialog
                game={confirmGame}
                currentGems={stats.gems}
                onClose={() => setConfirmGame(null)}
                onConfirm={handleUnlockConfirm}
                loading={unlocking}
            />

            {/* Toast notification */}
            {toast && (
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 32,
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: toast.color,
                        color: "#fff",
                        px: 3,
                        py: 1.5,
                        borderRadius: "30px",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 700,
                        fontSize: "1rem",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        zIndex: 9999,
                        whiteSpace: "nowrap",
                        animation: "fadeInUp 0.3s ease",
                        "@keyframes fadeInUp": {
                            from: { opacity: 0, transform: "translateX(-50%) translateY(10px)" },
                            to: { opacity: 1, transform: "translateX(-50%) translateY(0)" },
                        },
                    }}
                >
                    {toast.message}
                </Box>
            )}
        </Box>
    );
}
