import { Container, Typography, Stack, TextField, Button } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const role = params.get("role") ?? "child";

    const go = () => {
        navigate(role === "parent" ? "/parent/dashboard" : "/child/dashboard");
    };

    return (
        <Container sx={{ py: 6, maxWidth: "sm" }}>
            <Stack spacing={2}>
                <Typography variant="h4" fontWeight={700}>Login ({role})</Typography>
                <TextField label="Email" fullWidth />
                <TextField label="Password" type="password" fullWidth />
                <Button variant="contained" size="large" onClick={go}>
                    Login
                </Button>
            </Stack>
        </Container>
    );
}