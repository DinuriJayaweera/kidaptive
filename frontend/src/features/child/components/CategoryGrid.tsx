import { Box, Typography } from "@mui/material";
import CategoryCard, { type CategoryData } from "./CategoryCard";

type Props = {
  categories: CategoryData[];
  onCategoryClick: (id: string, level: string) => void;
};

const levelOrder = {
  Starter: 1,
  Explorer: 2,
  Champion: 3,
};

export default function CategoryGrid({ categories, onCategoryClick }: Props) {
  if (!categories || categories.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Baloo 2', sans-serif",
            fontSize: "2rem",
            fontWeight: 800,
            color: "#A0AEC0",
          }}
        >
          Let's start learning!
        </Typography>
      </Box>
    );
  }

  // Sort categories by level
  const sortedCategories = [...categories].sort((a, b) => {
    return (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
  });

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          lg: "1fr 1fr 1fr",
        },
        gap: 4,
      }}
    >
      {sortedCategories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} onClick={onCategoryClick} />
      ))}
    </Box>
  );
}
