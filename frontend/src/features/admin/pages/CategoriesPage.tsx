import { Typography } from "@mui/material";

export default function CategoriesPage() {
    return (
        <>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
                Categories / Levels
            </Typography>
            <Typography sx={{ color: "#7a8194", fontSize: 14 }}>
                Manage category and level configurations here.
            </Typography>
        </>
    );
}
