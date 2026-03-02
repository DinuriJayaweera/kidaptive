import { Box } from "@mui/material";
import type { BoxProps } from "@mui/material";

// ── Animation definitions via standard CSS ───────────────────────────────────
const animationCSS = `
  @keyframes kidFadeInUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes kidShake {
    0%, 100% { transform: translateX(0); }
    15%      { transform: translateX(-6px); }
    30%      { transform: translateX(5px); }
    45%      { transform: translateX(-4px); }
    60%      { transform: translateX(3px); }
    75%      { transform: translateX(-2px); }
  }
`;

// Inject once into document head
let injected = false;
function injectCSS() {
    if (injected || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.textContent = animationCSS;
    document.head.appendChild(style);
    injected = true;
}

// ── AnimatedPage — wraps a card with fade-in or shake ────────────────────────
interface AnimatedPageProps extends BoxProps {
    shake?: boolean;
    delay?: number;
}

export default function AnimatedPage({
    children,
    shake: doShake,
    delay = 0,
    sx,
    ...props
}: AnimatedPageProps) {
    injectCSS();

    return (
        <Box
            sx={{
                animation: doShake
                    ? "kidShake 0.5s ease-in-out"
                    : `kidFadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
                ...sx,
            }}
            {...props}
        >
            {children}
        </Box>
    );
}

// ── AnimatedItem — stagger children with increasing delay ────────────────────
export function AnimatedItem({
    children,
    index = 0,
    sx,
    ...props
}: BoxProps & { index?: number }) {
    injectCSS();

    return (
        <Box
            sx={{
                animation: `kidFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${80 + index * 60}ms both`,
                ...sx,
            }}
            {...props}
        >
            {children}
        </Box>
    );
}
