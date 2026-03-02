import { Button, styled, CircularProgress } from "@mui/material";
import type { ButtonProps } from "@mui/material";

interface PillButtonProps extends ButtonProps {
    loading?: boolean;
    colorScheme?: "primary" | "accent" | "outline" | "danger" | "google";
}

const colorMap = {
    primary: {
        bg: "#3ab5e6",
        hover: "#1ea0d0",
        shadow: "rgba(58,181,230,0.35)",
        text: "#fff",
    },
    accent: {
        bg: "#f5a623",
        hover: "#e09010",
        shadow: "rgba(245,166,35,0.35)",
        text: "#fff",
    },
    outline: {
        bg: "transparent",
        hover: "#e8f4fd",
        shadow: "rgba(58,181,230,0.1)",
        text: "#3ab5e6",
    },
    danger: {
        bg: "#e74c3c",
        hover: "#c0392b",
        shadow: "rgba(231,76,60,0.35)",
        text: "#fff",
    },
    google: {
        bg: "#fff",
        hover: "#f8f8f8",
        shadow: "rgba(0,0,0,0.08)",
        text: "#555",
    },
};

const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== "colorScheme" && prop !== "loading",
})<PillButtonProps>(({ colorScheme = "primary", disabled }) => {
    const c = colorMap[colorScheme];
    return {
        borderRadius: "9999px",
        textTransform: "none" as const,
        fontWeight: 700,
        fontSize: "0.95rem",
        padding: "12px 28px",
        minHeight: 48,
        fontFamily: "'Poppins', sans-serif",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        position: "relative" as const,
        overflow: "hidden",

        ...(colorScheme === "outline"
            ? {
                border: "1.5px solid #3ab5e6",
                color: c.text,
                backgroundColor: c.bg,
            }
            : colorScheme === "google"
                ? {
                    border: "1.5px solid #ddd",
                    color: c.text,
                    backgroundColor: c.bg,
                    boxShadow: `0 2px 8px ${c.shadow}`,
                }
                : {
                    color: c.text,
                    backgroundColor: c.bg,
                    boxShadow: `0 4px 14px ${c.shadow}`,
                }),

        "&:hover": disabled
            ? {}
            : {
                backgroundColor: c.hover,
                transform: "translateY(-2px) scale(1.02)",
                boxShadow: `0 8px 24px ${c.shadow}`,
                ...(colorScheme === "outline" && { borderColor: c.hover }),
            },

        "&:active": disabled
            ? {}
            : {
                transform: "translateY(0px) scale(0.98)",
                transition: "all 0.1s",
            },

        "&.Mui-disabled": {
            opacity: 0.55,
            backgroundColor: colorScheme === "outline" ? "transparent" : c.bg,
            color: c.text,
            boxShadow: "none",
            transform: "none",
        },
    };
});

export default function PillButton({
    loading,
    children,
    startIcon,
    disabled,
    ...props
}: PillButtonProps) {
    return (
        <StyledButton
            variant="contained"
            disabled={disabled || loading}
            startIcon={loading ? undefined : startIcon}
            {...props}
        >
            {loading ? <CircularProgress size={22} sx={{ color: "inherit" }} /> : children}
        </StyledButton>
    );
}
