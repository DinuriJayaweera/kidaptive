import { Box, Typography } from "@mui/material";

export type CategoryData = {
  id: string;
  name: string;
  level: "Starter" | "Explorer" | "Champion";
  icon?: string;
  xp?: number;
  xpToNextLevel?: number;
  quizzesCompleted?: number;
};

type Props = {
  category: CategoryData;
  onClick: (id: string, level: string) => void;
};

export default function CategoryCard({ category, onClick }: Props) {
  const { id, name, level, icon } = category;

  // Determine styling based on level
  let borderColor = "#E2E8F0";
  let bgColor = "rgba(226,232,240,0.1)";
  
  if (level === "Starter") {
    borderColor = "#FFCC35";
    bgColor = "rgba(255,204,53,0.1)";
  } else if (level === "Explorer") {
    borderColor = "#25AFF4";
    bgColor = "rgba(37,175,244,0.1)";
  } else if (level === "Champion") {
    borderColor = "#8EE870";
    bgColor = "rgba(142,232,112,0.1)";
  }

  return (
    <Box
      onClick={() => onClick(id, level)}
      sx={{
        backgroundColor: bgColor,
        border: `3px solid ${borderColor}`,
        borderRadius: "24px",
        p: 4,
        cursor: "pointer",
        position: "relative",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
        "&:hover": {
          transform: "scale(1.03) translateY(-6px)",
          boxShadow: "0 14px 28px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Typography sx={{ fontSize: "3rem", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}>
        {icon || "📚"}
      </Typography>

      <Box>
        <Typography
          sx={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.6rem",
            color: "#1A202C",
            lineHeight: 1.2,
            mb: 0.5,
          }}
        >
          {name}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.9rem",
            color: "#4A5568",
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {level}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.8rem",
            color: borderColor,
            fontWeight: 700,
            mt: 0.5,
          }}
        >
          XP : {category.xp ?? 0}
        </Typography>
      </Box>
    </Box>
  );
}
