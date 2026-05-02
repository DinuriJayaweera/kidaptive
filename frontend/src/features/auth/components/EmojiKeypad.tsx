import { Box, IconButton } from "@mui/material";
import { Backspace as BackspaceIcon, Clear as ClearIcon } from "@mui/icons-material";
import { motion } from "framer-motion";

const EMOJIS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐧"];

interface EmojiKeypadProps {
    value: string[];
    onChange: (val: string[]) => void;
    maxLength?: number;
    error?: boolean;
}

export default function EmojiKeypad({ value, onChange, maxLength = 4, error }: EmojiKeypadProps) {
    const handleTap = (emoji: string) => {
        if (value.length < maxLength) {
            onChange([...value, emoji]);
        }
    };

    const handleBackspace = () => {
        if (value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const handleClear = () => {
        onChange([]);
    };

    return (
        <Box sx={{ width: "100%", maxWidth: 360, mx: "auto" }}>
            {/* Slots */}
            <Box
                component={motion.div}
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                sx={{
                    display: "flex", justifyContent: "center", gap: 2, mb: 4,
                }}
            >
                {Array.from({ length: maxLength }).map((_, i) => (
                    <Box
                        key={i}
                        component={motion.div}
                        animate={value[i] ? { scale: [0.8, 1.2, 1] } : {}}
                        sx={{
                            width: 56, height: 56,
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "2rem",
                            backgroundColor: value[i] ? "#fff" : "rgba(0,0,0,0.04)",
                            border: `2px solid ${error ? "#e74c3c" : value[i] ? "#3ab5e6" : "rgba(0,0,0,0.1)"}`,
                            boxShadow: value[i] ? "0 4px 12px rgba(58,181,230,0.2)" : "none",
                            transition: "all 0.2s",
                        }}
                    >
                        {value[i] || ""}
                    </Box>
                ))}
            </Box>

            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, px: 1 }}>
                <IconButton onClick={handleClear} disabled={value.length === 0} sx={{ color: "#e74c3c", backgroundColor: "rgba(231,76,60,0.1)", "&:hover": { backgroundColor: "rgba(231,76,60,0.2)" } }}>
                    <ClearIcon />
                </IconButton>
                <IconButton onClick={handleBackspace} disabled={value.length === 0} sx={{ color: "#555", backgroundColor: "rgba(0,0,0,0.05)", "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" } }}>
                    <BackspaceIcon />
                </IconButton>
            </Box>

            {/* Grid */}
            <Box sx={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: { xs: 1.5, sm: 2 },
            }}>
                {EMOJIS.map((emoji) => (
                    <Box
                        key={emoji}
                        component={motion.button}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ y: -2, boxShadow: "0 6px 16px rgba(0,0,0,0.1)" }}
                        onClick={() => handleTap(emoji)}
                        sx={{
                            border: "none",
                            outline: "none",
                            cursor: "pointer",
                            aspectRatio: "1",
                            borderRadius: "20px",
                            backgroundColor: "#fff",
                            fontSize: { xs: "2rem", sm: "2.5rem" },
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            transition: "background-color 0.2s",
                            "&:active": { backgroundColor: "#f0f6ff" }
                        }}
                    >
                        {emoji}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
