import { Typography } from "@mui/material";

export default function QuizzesPage() {
    return (
        <>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
                Quizzes
            </Typography>
            <Typography sx={{ color: "#7a8194", fontSize: 14 }}>
                Manage quiz configurations here.
            </Typography>
        </>
    );
}
