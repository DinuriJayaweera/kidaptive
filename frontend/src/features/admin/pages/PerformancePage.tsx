import { Typography } from "@mui/material";

export default function PerformancePage() {
    return (
        <>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}>
                Performance
            </Typography>
            <Typography sx={{ color: "#7a8194", fontSize: 14 }}>
                View platform performance analytics here.
            </Typography>
        </>
    );
}
