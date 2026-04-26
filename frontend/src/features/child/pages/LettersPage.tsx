import { Box, Typography } from "@mui/material";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import { useState } from "react";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";

// ── Import all 26 letter PNGs ──────────────────────────────────────────────
import aImg from "../../../assets/a.png";
import bImg from "../../../assets/b.png";
import cImg from "../../../assets/c.png";
import dImg from "../../../assets/d.png";
import eImg from "../../../assets/e.png";
import fImg from "../../../assets/f.png";
import gImg from "../../../assets/g.png";
import hImg from "../../../assets/h.png";
import iImg from "../../../assets/i.png";
import jImg from "../../../assets/j.png";
import kImg from "../../../assets/k.png";
import lImg from "../../../assets/l.png";
import mImg from "../../../assets/m.png";
import nImg from "../../../assets/n.png";
import oImg from "../../../assets/o.png";
import pImg from "../../../assets/p.png";
import qImg from "../../../assets/q.png";
import rImg from "../../../assets/r.png";
import sImg from "../../../assets/s.png";
import tImg from "../../../assets/t.png";
import uImg from "../../../assets/u.png";
import vImg from "../../../assets/v.png";
import wImg from "../../../assets/w.png";
import xImg from "../../../assets/x.png";
import yImg from "../../../assets/y.png";
import zImg from "../../../assets/z.png";

// ── Letter data ────────────────────────────────────────────────────────────
const LETTERS = [
    { letter: "A", img: aImg },
    { letter: "B", img: bImg },
    { letter: "C", img: cImg },
    { letter: "D", img: dImg },
    { letter: "E", img: eImg },
    { letter: "F", img: fImg },
    { letter: "G", img: gImg },
    { letter: "H", img: hImg },
    { letter: "I", img: iImg },
    { letter: "J", img: jImg },
    { letter: "K", img: kImg },
    { letter: "L", img: lImg },
    { letter: "M", img: mImg },
    { letter: "N", img: nImg },
    { letter: "O", img: oImg },
    { letter: "P", img: pImg },
    { letter: "Q", img: qImg },
    { letter: "R", img: rImg },
    { letter: "S", img: sImg },
    { letter: "T", img: tImg },
    { letter: "U", img: uImg },
    { letter: "V", img: vImg },
    { letter: "W", img: wImg },
    { letter: "X", img: xImg },
    { letter: "Y", img: yImg },
    { letter: "Z", img: zImg },
];

// ── Phonetic map ───────────────────────────────────────────────────────────
// Using clear phonetic spellings so the Web Speech API pronounces each
// letter name the way a child would expect to hear it.
const PHONETICS: Record<string, string> = {
    A: "ay", B: "bee", C: "see", D: "dee",
    E: "ee", F: "eff", G: "jee", H: "aych",
    I: "eye", J: "jay", K: "kay", L: "el",
    M: "em", N: "en", O: "oh", P: "pee",
    Q: "cue", R: "ar", S: "ess", T: "tee",
    U: "you", V: "vee", W: "double you", X: "ex",
    Y: "why", Z: "zee",
};

// ── Component ──────────────────────────────────────────────────────────────
export default function LettersPage() {
    // Tracks which letter card is currently playing audio
    const [speaking, setSpeaking] = useState<string | null>(null);

    const handleLetterClick = (letter: string) => {
        if (!window.speechSynthesis) return;

        // Stop anything already playing
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(PHONETICS[letter] ?? letter);
        utterance.lang = "en-US";
        utterance.rate = 0.85;   // slightly slower — easier for kids
        utterance.pitch = 1.1;    // slightly higher — friendlier tone
        utterance.volume = 1;

        // Prefer an English voice; female voices tend to sound more kid-friendly
        const voices = window.speechSynthesis.getVoices();
        const preferred =
            voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ??
            voices.find((v) => v.lang.startsWith("en")) ??
            null;
        if (preferred) utterance.voice = preferred;

        // Animate the card while speaking, clear when done
        setSpeaking(letter);
        utterance.onend = () => setSpeaking(null);
        utterance.onerror = () => setSpeaking(null);

        window.speechSynthesis.speak(utterance);
    };

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", overflow: "hidden" }}>

            {/* ── Left Sidebar ── */}
            <ChildSidebar activePage="LETTERS" />

            {/* ── Main Content ── */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", p: { xs: 2, sm: 3, md: 4 } }}>

                {/* ── Page Header ── */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, md: 4 } }}>
                    <Box>
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem", md: "2.4rem" }, color: "#1A202C", lineHeight: 1.2 }}>
                            The Alphabet 🔤
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: { xs: "0.85rem", sm: "1rem" }, color: "#718096", mt: 0.5 }}>
                            Tap a letter to hear it! 🔊
                        </Typography>
                    </Box>
                    <Box sx={{ display: { xs: "none", md: "flex" } }}>
                        <TopBarStats totalXp={0} streak={0} gems={0} />
                    </Box>
                </Box>

                {/* ── Alphabet Grid ── */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(3, 1fr)",
                            sm: "repeat(4, 1fr)",
                            md: "repeat(5, 1fr)",
                            lg: "repeat(6, 1fr)",
                            xl: "repeat(7, 1fr)",
                        },
                        gap: { xs: 1.5, sm: 2, md: 2.5 },
                    }}
                >
                    {LETTERS.map(({ letter, img }) => {
                        const isPlaying = speaking === letter;

                        return (
                            <Box
                                key={letter}
                                onClick={() => handleLetterClick(letter)}
                                sx={{
                                    position: "relative",
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: "20px",
                                    boxShadow: isPlaying
                                        ? "0 8px 28px rgba(37,175,244,0.35)"
                                        : "0 2px 12px rgba(0,0,0,0.07)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    aspectRatio: "1 / 1",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    overflow: "hidden",
                                    p: { xs: 1, sm: 1.5 },
                                    outline: isPlaying ? "2.5px solid #25AFF4" : "2px solid transparent",
                                    transform: isPlaying ? "scale(1.06)" : "scale(1)",
                                    "&:hover": {
                                        transform: isPlaying ? "scale(1.06)" : "translateY(-4px) scale(1.04)",
                                        boxShadow: "0 8px 24px rgba(37,175,244,0.22)",
                                        outline: "2px solid #25AFF4",
                                    },
                                    "&:active": { transform: "scale(0.97)" },
                                }}
                            >
                                {/* ── Letter character image ── */}
                                <Box
                                    component="img"
                                    src={img}
                                    alt={`Letter ${letter}`}
                                    sx={{
                                        width: "70%",
                                        height: "70%",
                                        objectFit: "contain",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                    }}
                                />

                                {/* ── Sound icon badge — bottom-right corner ── */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: { xs: 5, sm: 7 },
                                        right: { xs: 5, sm: 7 },
                                        width: { xs: 22, sm: 26 },
                                        height: { xs: 22, sm: 26 },
                                        borderRadius: "50%",
                                        backgroundColor: isPlaying ? "#25AFF4" : "rgba(37,175,244,0.12)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "background-color 0.2s ease",
                                        // Pulse animation while the letter is being spoken
                                        animation: isPlaying ? "soundPulse 0.75s ease-in-out infinite" : "none",
                                        "@keyframes soundPulse": {
                                            "0%": { transform: "scale(1)", opacity: 1 },
                                            "50%": { transform: "scale(1.3)", opacity: 0.75 },
                                            "100%": { transform: "scale(1)", opacity: 1 },
                                        },
                                    }}
                                >
                                    <VolumeUpRoundedIcon
                                        sx={{
                                            fontSize: { xs: "0.8rem", sm: "0.95rem" },
                                            color: isPlaying ? "#FFFFFF" : "#25AFF4",
                                            transition: "color 0.2s",
                                        }}
                                    />
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                <Box sx={{ pb: 4 }} />
            </Box>
        </Box>
    );
}