import { useState } from "react";
import { Box, Typography, Stack, Button, ClickAwayListener, Tooltip, useTheme, useMediaQuery } from "@mui/material";
import LogoutIcon from "@mui/icons-material/LogoutRounded";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as logoutApi } from "../../auth/api/authApi";
import logoImg from "../../../assets/logo.png";

import learnIcon from "../../../assets/learn.png";
import lettersIcon from "../../../assets/letters.png";
import practiceIcon from "../../../assets/practice.png";
import leaderboardIcon from "../../../assets/leaderboard.png";
import questsIcon from "../../../assets/quests.png";
import profileIcon from "../../../assets/profile.png";
import moreIcon from "../../../assets/more.png";
import achievementsIcon from "../../../assets/medal.png";

export type NavLabel =
    | "LEARN"
    | "LETTERS"
    | "PRACTICE"
    | "LEADERBOARDS"
    | "ACHIEVEMENTS"
    | "QUESTS"
    | "PROFILE"
    | "MORE";

type NavItemObj = {
    label: NavLabel;
    iconSrc: string;
    route: string;
    tooltip: string;
};

const navItems: NavItemObj[] = [
    { label: "LEARN",        iconSrc: learnIcon,        route: "/child/dashboard",    tooltip: "Learn" },
    { label: "LETTERS",      iconSrc: lettersIcon,      route: "/child/letters",      tooltip: "Letters" },
    { label: "PRACTICE",     iconSrc: practiceIcon,     route: "/child/practice",     tooltip: "Practice" },
    { label: "LEADERBOARDS", iconSrc: leaderboardIcon,  route: "/child/leaderboards", tooltip: "Leaderboards" },
    { label: "ACHIEVEMENTS", iconSrc: achievementsIcon, route: "/child/achievements", tooltip: "Achievements" },
    { label: "QUESTS",       iconSrc: questsIcon,       route: "/child/quests",       tooltip: "Quests" },
    { label: "PROFILE",      iconSrc: profileIcon,      route: "/child/profile",      tooltip: "Profile" },
    { label: "MORE",         iconSrc: moreIcon,         route: "",                    tooltip: "Games" },
];

interface ChildSidebarProps {
    activePage?: NavLabel;
}

export default function ChildSidebar({ activePage = "LEARN" }: ChildSidebarProps) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [moreOpen, setMoreOpen] = useState(false);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const isMoreActive = activePage === "MORE";

    const handleLogout = async () => {
        try { await logoutApi(); } catch { /* ignore */ }
        logout();
        navigate("/");
    };

    const handleMoreClick = () => {
        if (isDesktop) {
            setMoreOpen((prev) => !prev);
        } else {
            navigate("/child/games");
        }
    };

    return (
        <>
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: { xs: 64, sm: 72, md: 250 },
                minWidth: { xs: 64, sm: 72, md: 250 },
                height: "100vh",
                flexShrink: 0,
                backgroundColor: "#F4F8FB",
                borderRight: "2px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                py: { xs: 2, md: 4 },
                px: { xs: 0.5, sm: 1, md: 3 },
                overflowY: "auto",
                overflowX: "hidden",
                zIndex: 100,
            }}
        >
            {/* ── Logo (clickable → dashboard) ── */}
            <Box
                onClick={() => navigate("/child/dashboard")}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: { xs: 3, md: 6 },
                    justifyContent: { xs: "center", md: "flex-start" },
                    cursor: "pointer",
                    borderRadius: "12px",
                    transition: "opacity 0.2s",
                    "&:hover": { opacity: 0.8 },
                }}
            >
                <Box
                    component="img"
                    src={logoImg}
                    alt="Kidaptive"
                    sx={{
                        width: { xs: 48, sm: 52, md: 72 },
                        height: { xs: 44, sm: 48, md: 65 },
                        objectFit: "contain",
                        flexShrink: 0,
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
                    }}
                />
                <Typography
                    sx={{
                        display: { xs: "none", md: "block" },
                        ml: "-4px",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: "22px",
                        color: "#25AFF4",
                        letterSpacing: 0.5,
                        lineHeight: 1,
                        userSelect: "none",
                    }}
                >
                    KIDAPTIVE
                </Typography>
            </Box>

            {/* ── Nav Items ── */}
            <Stack spacing={{ xs: 0.5, sm: 0.75, md: 1.5 }} sx={{ flex: 1 }}>
                {navItems.map((item) => {
                    const isActive = item.label === activePage || (item.label === "MORE" && isMoreActive);

                    if (item.label === "MORE") {
                        return (
                            <ClickAwayListener key="MORE" onClickAway={() => setMoreOpen(false)}>
                                <Box>
                                    <Tooltip
                                        title={isDesktop ? "" : "Games"}
                                        placement="right"
                                        arrow
                                    >
                                        <Box
                                            onClick={handleMoreClick}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: { xs: "center", md: "flex-start" },
                                                gap: 2,
                                                py: { xs: 1, md: 1.2 },
                                                px: { xs: 0.5, sm: 1, md: 2 },
                                                borderRadius: "30px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                border: (isActive || moreOpen) ? "2px solid #25AFF4" : "2px solid transparent",
                                                backgroundColor: (isActive || moreOpen) ? "rgba(37,175,244,0.1)" : "transparent",
                                                "&:hover": {
                                                    backgroundColor: (isActive || moreOpen)
                                                        ? "rgba(37,175,244,0.15)"
                                                        : "rgba(0,0,0,0.04)",
                                                },
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={item.iconSrc}
                                                alt="MORE"
                                                sx={{ width: { xs: 24, sm: 26, md: 26 }, height: { xs: 24, sm: 26, md: 26 }, objectFit: "contain", flexShrink: 0 }}
                                            />
                                            <Typography
                                                sx={{
                                                    display: { xs: "none", md: "block" },
                                                    fontFamily: "'Poppins', sans-serif",
                                                    fontWeight: 700,
                                                    fontSize: "0.95rem",
                                                    color: (isActive || moreOpen) ? "#25AFF4" : "#1A202C",
                                                    letterSpacing: 0.5,
                                                }}
                                            >
                                                MORE
                                            </Typography>
                                            <KeyboardArrowDownRoundedIcon
                                                sx={{
                                                    display: { xs: "none", md: "block" },
                                                    ml: "auto",
                                                    color: (isActive || moreOpen) ? "#25AFF4" : "#94A3B8",
                                                    fontSize: 20,
                                                    transition: "transform 0.25s ease",
                                                    transform: moreOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                }}
                                            />
                                        </Box>
                                    </Tooltip>

                                    {/* Desktop submenu only */}
                                    {moreOpen && isDesktop && (
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                ml: 1,
                                                borderRadius: "16px",
                                                backgroundColor: "#fff",
                                                border: "2px solid #E8ECF1",
                                                overflow: "hidden",
                                                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                            }}
                                        >
                                            <Box
                                                onClick={() => { setMoreOpen(false); navigate("/child/games"); }}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                    py: 1.2,
                                                    px: 2,
                                                    cursor: "pointer",
                                                    transition: "all 0.15s",
                                                    backgroundColor: isMoreActive ? "rgba(37,175,244,0.08)" : "transparent",
                                                    "&:hover": { backgroundColor: "rgba(37,175,244,0.1)" },
                                                }}
                                            >
                                                <SportsEsportsIcon sx={{ fontSize: 22, color: "#25AFF4", flexShrink: 0 }} />
                                                <Typography
                                                    sx={{
                                                        fontFamily: "'Poppins', sans-serif",
                                                        fontWeight: 700,
                                                        fontSize: "0.9rem",
                                                        color: isMoreActive ? "#25AFF4" : "#1A202C",
                                                        letterSpacing: 0.4,
                                                    }}
                                                >
                                                    Games
                                                </Typography>
                                                <Box sx={{ ml: "auto", backgroundColor: "#25AFF4", borderRadius: "8px", px: 0.8, py: 0.2 }}>
                                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "0.6rem", color: "#fff" }}>
                                                        💎
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </ClickAwayListener>
                        );
                    }

                    return (
                        <Tooltip key={item.label} title={isDesktop ? "" : item.tooltip} placement="right" arrow>
                            <Box
                                onClick={() => navigate(item.route)}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: { xs: "center", md: "flex-start" },
                                    gap: 2,
                                    py: { xs: 1, md: 1.2 },
                                    px: { xs: 0.5, sm: 1, md: 2 },
                                    borderRadius: "30px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    border: isActive ? "2px solid #25AFF4" : "2px solid transparent",
                                    backgroundColor: isActive ? "rgba(37,175,244,0.1)" : "transparent",
                                    "&:hover": {
                                        backgroundColor: isActive ? "rgba(37,175,244,0.15)" : "rgba(0,0,0,0.04)",
                                    },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={item.iconSrc}
                                    alt={item.label}
                                    sx={{ width: { xs: 24, sm: 26, md: 26 }, height: { xs: 24, sm: 26, md: 26 }, objectFit: "contain", flexShrink: 0 }}
                                />
                                <Typography
                                    sx={{
                                        display: { xs: "none", md: "block" },
                                        fontFamily: "'Poppins', sans-serif",
                                        fontWeight: 700,
                                        fontSize: "0.95rem",
                                        color: isActive ? "#25AFF4" : "#1A202C",
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Stack>

            {/* ── Logout ── */}
            <Box sx={{ mt: 2, display: "flex", justifyContent: { xs: "center", md: "stretch" } }}>
                {/* Mobile: compact round icon button */}
                <Tooltip title="Log out" placement="right" arrow>
                    <Box
                        onClick={handleLogout}
                        sx={{
                            display: { xs: "flex", md: "none" },
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,81,68,0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": { backgroundColor: "rgba(255,81,68,0.2)" },
                        }}
                    >
                        <LogoutIcon sx={{ color: "#FF5144", fontSize: 20 }} />
                    </Box>
                </Tooltip>

                {/* Desktop: full outlined button */}
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                        display: { xs: "none", md: "flex" },
                        py: 1.2,
                        borderRadius: "30px",
                        borderColor: "#FF5144",
                        color: "#FF5144",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        textTransform: "none",
                        letterSpacing: 0.5,
                        transition: "all 0.2s",
                        "&:hover": { backgroundColor: "rgba(255,81,68,0.1)", borderColor: "#FF5144" },
                    }}
                >
                    Log out
                </Button>
            </Box>
        </Box>
        <Box sx={{ width: { xs: 64, sm: 72, md: 250 }, minWidth: { xs: 64, sm: 72, md: 250 }, flexShrink: 0 }} />
        </>
    );
}
