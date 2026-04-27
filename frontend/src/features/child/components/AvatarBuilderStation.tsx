import { Box, Typography, CircularProgress } from "@mui/material";
import { useState } from "react";

// ── Avatar options ─────────────────────────────────────────────────────────
const AVATAR_ANIMALS = ["🦊", "🐶", "🐱", "🐻", "🐼", "🐸", "🦁", "🐯", "🐨", "🦄", "🐙", "🦋", "🐧", "🦅", "🐺", "🦊", "🐮", "🦀", "🐬", "🦕"];
const AVATAR_HUMANS = ["👦", "👧", "🧒", "👱", "👩‍🦱", "🧑‍🦰", "👩‍🦳", "🧑‍🎤", "🧑‍🚀", "🧑‍🎨", "🧑‍🏫", "🧙", "🦸", "🧝", "🧛"];
const AVATAR_FANTASY = ["🧚", "🧜", "🧞", "🦹", "🤖", "👾", "🎃", "🦊", "🐲", "🔮"];
const AVATAR_SPORTS = ["⚽", "🏀", "🎮", "🎸", "🎨", "🚀", "🌈", "⭐", "🔥", "💎"];

const BG_COLORS = [
    { label: "Sky Blue", value: "rgba(37,175,244,0.18)", border: "#25AFF4" },
    { label: "Sunny", value: "rgba(255,204,53,0.18)", border: "#FFCC35" },
    { label: "Mint", value: "rgba(34,197,94,0.18)", border: "#22C55E" },
    { label: "Lavender", value: "rgba(139,92,246,0.18)", border: "#8B5CF6" },
    { label: "Peach", value: "rgba(251,113,133,0.18)", border: "#FB7185" },
    { label: "Orange", value: "rgba(255,148,71,0.18)", border: "#FF9447" },
    { label: "Teal", value: "rgba(20,184,166,0.18)", border: "#14B8A6" },
    { label: "Rose", value: "rgba(244,63,94,0.18)", border: "#F43F5E" },
];

const TABS = [
    { key: "animals", label: "🐾 Animals", emojis: AVATAR_ANIMALS },
    { key: "humans", label: "👦 People", emojis: AVATAR_HUMANS },
    { key: "fantasy", label: "🧚 Fantasy", emojis: AVATAR_FANTASY },
    { key: "fun", label: "⭐ Fun", emojis: AVATAR_SPORTS },
];

interface AvatarBuilderStationProps {
    currentAvatar: string;
    childName: string;
    onSave: (avatar: string) => void;
    onClose: () => void;
    saving?: boolean;
}

export default function AvatarBuilderStation({
    currentAvatar,
    childName,
    onSave,
    onClose,
    saving = false,
}: AvatarBuilderStationProps) {
    const [activeTab, setActiveTab] = useState("animals");
    const [selectedEmoji, setSelectedEmoji] = useState(currentAvatar);
    const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);

    const currentTab = TABS.find((t) => t.key === activeTab) ?? TABS[0];

    return (
        // ── Backdrop ──
        <Box
            onClick={onClose}
            sx={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.45)",
                zIndex: 1200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 1.5, sm: 2 },
            }}
        >
            {/* ── Modal Box ── */}
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    backgroundColor: "#fff",
                    borderRadius: "28px",
                    width: "100%",
                    maxWidth: 520,
                    maxHeight: "92vh",
                    overflowY: "auto",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        background: "linear-gradient(135deg, #25AFF4 0%, #1d96d4 100%)",
                        borderRadius: "28px 28px 0 0",
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.5,
                        position: "relative",
                    }}
                >
                    {/* Close button */}
                    <Box
                        onClick={onClose}
                        sx={{
                            position: "absolute",
                            top: 14,
                            right: 16,
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            transition: "background 0.2s",
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.4)" },
                        }}
                    >
                        ✕
                    </Box>

                    <Typography
                        sx={{
                            fontFamily: "'Baloo 2', sans-serif",
                            fontWeight: 800,
                            fontSize: "1.4rem",
                            color: "#fff",
                            textAlign: "center",
                        }}
                    >
                        🎨 Build Your Avatar!
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "0.84rem",
                            color: "rgba(255,255,255,0.85)",
                            textAlign: "center",
                        }}
                    >
                        Pick your look, {childName}!
                    </Typography>

                    {/* Live Avatar Preview */}
                    <Box
                        sx={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            border: "4px solid rgba(255,255,255,0.6)",
                            backgroundColor: selectedBg.value,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "3.2rem",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                            mt: 1,
                            transition: "all 0.25s ease",
                            animation: "avatarBounce 0.3s ease",
                            "@keyframes avatarBounce": {
                                "0%": { transform: "scale(1)" },
                                "50%": { transform: "scale(1.1)" },
                                "100%": { transform: "scale(1)" },
                            },
                        }}
                    >
                        {selectedEmoji}
                    </Box>
                </Box>

                {/* Builder Body */}
                <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
                    {/* ── Background Color Picker ── */}
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                color: "#374151",
                                mb: 1.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                            }}
                        >
                            🎨 Background Color
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
                            {BG_COLORS.map((bg) => (
                                <Box
                                    key={bg.label}
                                    onClick={() => setSelectedBg(bg)}
                                    title={bg.label}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        backgroundColor: bg.value,
                                        border: selectedBg.value === bg.value
                                            ? `3px solid ${bg.border}`
                                            : "3px solid transparent",
                                        cursor: "pointer",
                                        transition: "all 0.18s ease",
                                        transform: selectedBg.value === bg.value ? "scale(1.2)" : "scale(1)",
                                        boxShadow: selectedBg.value === bg.value
                                            ? `0 0 0 2px #fff, 0 0 0 4px ${bg.border}`
                                            : "none",
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* ── Emoji Category Tabs ── */}
                    <Box sx={{ mb: 2 }}>
                        <Typography
                            sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                color: "#374151",
                                mb: 1.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                            }}
                        >
                            😊 Pick Your Character
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                            {TABS.map((tab) => (
                                <Box
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    sx={{
                                        px: 2,
                                        py: 0.8,
                                        borderRadius: "30px",
                                        border: "2px solid",
                                        borderColor: activeTab === tab.key ? "#25AFF4" : "#E2E8F0",
                                        backgroundColor: activeTab === tab.key ? "rgba(37,175,244,0.1)" : "transparent",
                                        cursor: "pointer",
                                        transition: "all 0.18s ease",
                                        "&:hover": {
                                            borderColor: "#25AFF4",
                                            backgroundColor: "rgba(37,175,244,0.06)",
                                        },
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontWeight: 700,
                                            fontSize: "0.78rem",
                                            color: activeTab === tab.key ? "#25AFF4" : "#64748B",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {tab.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Emoji Grid */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(5, 1fr)",
                                gap: 1,
                                maxHeight: 200,
                                overflowY: "auto",
                                pr: 0.5,
                                "&::-webkit-scrollbar": { width: 4 },
                                "&::-webkit-scrollbar-thumb": {
                                    backgroundColor: "#E2E8F0",
                                    borderRadius: 10,
                                },
                            }}
                        >
                            {currentTab.emojis.map((emoji, i) => (
                                <Box
                                    key={`${emoji}-${i}`}
                                    onClick={() => setSelectedEmoji(emoji)}
                                    sx={{
                                        aspectRatio: "1",
                                        borderRadius: "14px",
                                        border: "2.5px solid",
                                        borderColor: selectedEmoji === emoji ? "#25AFF4" : "#F1F5F9",
                                        backgroundColor: selectedEmoji === emoji
                                            ? "rgba(37,175,244,0.12)"
                                            : "#F9FAFB",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.8rem",
                                        cursor: "pointer",
                                        transition: "all 0.18s ease",
                                        transform: selectedEmoji === emoji ? "scale(1.12)" : "scale(1)",
                                        "&:hover": {
                                            transform: "scale(1.1)",
                                            borderColor: "#25AFF4",
                                        },
                                    }}
                                >
                                    {emoji}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* ── Action Buttons ── */}
                    <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
                        <Box
                            onClick={onClose}
                            sx={{
                                flex: 1,
                                py: 1.4,
                                borderRadius: "30px",
                                border: "2px solid #E2E8F0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.18s ease",
                                "&:hover": { backgroundColor: "#F9FAFB" },
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    color: "#64748B",
                                }}
                            >
                                Cancel
                            </Typography>
                        </Box>

                        <Box
                            onClick={() => !saving && onSave(selectedEmoji)}
                            sx={{
                                flex: 2,
                                py: 1.4,
                                borderRadius: "30px",
                                background: saving
                                    ? "#E2E8F0"
                                    : "linear-gradient(135deg, #25AFF4 0%, #1d96d4 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                                cursor: saving ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: saving ? "none" : "0 4px 16px rgba(37,175,244,0.35)",
                                "&:hover": saving
                                    ? {}
                                    : {
                                        transform: "translateY(-1px)",
                                        boxShadow: "0 6px 20px rgba(37,175,244,0.45)",
                                    },
                            }}
                        >
                            {saving ? (
                                <CircularProgress size={20} sx={{ color: "#94A3B8" }} />
                            ) : (
                                <>
                                    <Typography sx={{ fontSize: "1.1rem" }}>🎉</Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontWeight: 700,
                                            fontSize: "0.95rem",
                                            color: "#fff",
                                        }}
                                    >
                                        Save My Avatar!
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}