import { Container, Typography, Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ChooseRolePage() {
    const navigate = useNavigate();

    return (
        <Container sx={{ py: 6 }}>
            <Stack spacing={3}>
                <Typography variant="h4" fontWeight={700}>Choose your role</Typography>
                <Button variant="outlined" size="large" onClick={() => navigate("/login?role=child")}>
                    I'm a Child
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate("/login?role=parent")}>
                    I'm a Parent
                </Button>
            </Stack>
        </Container>
    );
}