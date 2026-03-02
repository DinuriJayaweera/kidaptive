import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";

interface RoundCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string | React.ReactNode;
    id?: string;
}

export default function RoundCheckbox({ checked, onChange, label, id }: RoundCheckboxProps) {
    const [focused, setFocused] = useState(false);

    return (
        <Box
            component="label"
            htmlFor={id}
            sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.2,
                cursor: "pointer",
                py: 0.6,
                px: 0.5,
                borderRadius: 2,
                transition: "background 0.15s",
                "&:hover": { backgroundColor: "rgba(58,181,230,0.04)" },
                "&:hover .checkbox-circle": {
                    borderColor: "#3ab5e6",
                    transform: "scale(1.08)",
                },
            }}
        >
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
                aria-checked={checked}
            />

            {/* Custom circle checkbox */}
            <Box
                className="checkbox-circle"
                sx={{
                    width: 22,
                    height: 22,
                    minWidth: 22,
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: checked ? "#3ab5e6" : "#ccc",
                    backgroundColor: checked ? "#3ab5e6" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    mt: "1px",
                    boxShadow: focused
                        ? "0 0 0 3px rgba(58,181,230,0.25)"
                        : checked
                            ? "0 2px 6px rgba(58,181,230,0.25)"
                            : "none",
                }}
            >
                <CheckIcon
                    sx={{
                        fontSize: 15,
                        color: "#fff",
                        transform: checked ? "scale(1)" : "scale(0)",
                        opacity: checked ? 1 : 0,
                        transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                />
            </Box>

            <Typography
                variant="caption"
                sx={{
                    color: "#555",
                    lineHeight: 1.5,
                    userSelect: "none",
                    pt: "2px",
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}
