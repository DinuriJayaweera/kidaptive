import { Button, Container, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Container sx={{ py: 6 }}>
            <Stack spacing={3} alignItems="flex-start">
                <Typography variant="h3" fontWeight={800}>
                    Kidaptive
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Adaptive English learning for kids (5–10)
                </Typography>
                <Button variant="contained" size="large" onClick={() => navigate("/choose-role")}>
                    Get Started
                </Button>
            </Stack>
        </Container>
    );
}