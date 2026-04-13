import { useState } from "react";
import {
    Box, Typography, TextField, Button, Grid, Avatar,
    MenuItem, Alert, CircularProgress, IconButton, InputAdornment,
} from "@mui/material";
import {
    Refresh as RefreshIcon,
    Person as PersonIcon,
    Cake as CakeIcon,
    AlternateEmail as UsernameIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    ChildCare as ChildCareIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ParentSidebar from "../components/ParentSidebar";
import { createChild } from "../../auth/api/authApi";
import EmojiKeypad from "../../auth/components/EmojiKeypad";

const avatarOptions = [
    { id: "default", emoji: "🦖" }, { id: "dino", emoji: "🦕" },
    { id: "rocket", emoji: "🚀" }, { id: "star", emoji: "⭐" },
    { id: "bear", emoji: "🐻" }, { id: "cat", emoji: "🐱" },
    { id: "dog", emoji: "🐶" }, { id: "unicorn", emoji: "🦄" },
];

function genUsername(name: string) {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    return `${clean}_${Math.floor(Math.random() * 99) + 1}`;
}

export default function CreateChildPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "", age: "", username: "", avatar: "default",
        emojiPassword: [] as string[],
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdChild, setCreatedChild] = useState<any>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setForm({ ...form, name, username: name ? genUsername(name) : "" });
    };

    const handleSubmit = async () => {
        setError("");
        if (!form.name || !form.age || !form.username) { setError("Please fill in all required fields."); return; }
        if (form.emojiPassword.length !== 4) {
            setError("Emoji password must have exactly 4 emojis."); return;
        }

        setLoading(true);
        try {
            const result = await createChild({
                name: form.name, age: Number(form.age), username: form.username, avatar: form.avatar,
                emojiPassword: form.emojiPassword.join(""),
            });
            setCreatedChild({ ...result, emojiPassword: form.emojiPassword });
            setSuccess(true);
        } catch (err: any) {
            const data = err.response?.data;
            setError(data?.errors?.map((e: { message: string }) => e.message).join(". ") ?? data?.message ?? "Failed to create profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh" }}>
            <ParentSidebar />
            <Box sx={{ flex: 1, backgroundColor: "#f0f6ff", p: { xs: 3, md: 5 } }}>
                <Box sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 5 }, maxWidth: 700, mx: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                    {success && createdChild ? (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <ChildCareIcon sx={{ color: "#4caf50", fontSize: 64, mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Child Account Created!</Typography>
                            <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
                                You successfully created an account for {createdChild.name}.
                            </Typography>

                            <Box sx={{ backgroundColor: "#f8fafc", border: "2px dashed #3ab5e6", borderRadius: 4, p: 4, mb: 4, maxWidth: 400, mx: "auto" }}>
                                <Typography variant="subtitle2" sx={{ color: "#888", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>
                                    Child Credential Card
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#e74c3c", display: "block", mb: 3, fontWeight: 600 }}>
                                    Save this! You'll need it for child login. It won't be shown again.
                                </Typography>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 2, borderBottom: "1px solid #eee" }}>
                                    <Typography variant="body2" sx={{ color: "#888", fontWeight: 600 }}>Username</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 800, color: "#1a1a2e" }}>{createdChild.username}</Typography>
                                </Box>

                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ color: "#888", fontWeight: 600, textAlign: "left", mb: 2 }}>Emoji Password</Typography>
                                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
                                        {createdChild.emojiPassword.map((emoji: string, i: number) => (
                                            <Box key={i} sx={{ width: 50, height: 50, borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>
                                                {emoji}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>

                            <Button variant="contained" onClick={() => navigate("/parent/dashboard")} sx={{ backgroundColor: "#3ab5e6", borderRadius: "50px", px: 5, py: 1.5, fontWeight: 700, textTransform: "none", "&:hover": { backgroundColor: "#1ea0d0" } }}>
                                Go to Dashboard
                            </Button>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <ChildCareIcon sx={{ color: "#3ab5e6", fontSize: 28 }} />
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>Create a New Profile</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: "#888", mb: 4 }}>Set up a learning space for your child.</Typography>

                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <TextField label="Child's Name" fullWidth value={form.name} onChange={handleNameChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: "#bbb" }} /></InputAdornment> }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 5 }}>
                                    <TextField label="Age" select fullWidth value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon sx={{ color: "#bbb" }} /></InputAdornment> }}>
                                        {Array.from({ length: 13 }, (_, i) => i + 3).map((a) => <MenuItem key={a} value={a}>{a} years</MenuItem>)}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>Pick an Avatar</Typography>
                            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
                                {avatarOptions.map((o) => (
                                    <Avatar key={o.id} onClick={() => setForm({ ...form, avatar: o.id })} sx={{
                                        width: 56, height: 56, fontSize: "1.6rem", cursor: "pointer",
                                        backgroundColor: form.avatar === o.id ? "#3ab5e6" : "#e8f4fd",
                                        border: form.avatar === o.id ? "3px solid #3ab5e6" : "3px solid transparent",
                                        transition: "all 0.2s", "&:hover": { transform: "scale(1.1)" },
                                    }}>{o.emoji}</Avatar>
                                ))}
                            </Box>

                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Username</Typography>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                                <TextField fullWidth value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><UsernameIcon sx={{ color: "#bbb" }} /></InputAdornment> }} />
                                <IconButton onClick={() => setForm({ ...form, username: form.name ? genUsername(form.name) : "" })} title="Generate new username">
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                            <Typography variant="caption" sx={{ color: "#aaa", mb: 3, display: "block" }}>Auto-suggested. You can edit it.</Typography>

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Emoji Password</Typography>
                            <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 3 }}>
                                Select 4 emojis below to serve as your child's easy, fun password. They will need this to log in.
                            </Typography>

                            <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: "#f8fafc", borderRadius: 4, mb: 3 }}>
                                <EmojiKeypad
                                    value={form.emojiPassword}
                                    onChange={(val) => setForm({ ...form, emojiPassword: val })}
                                />
                            </Box>

                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
                                <Button variant="text" startIcon={<CancelIcon />} onClick={() => navigate("/parent/dashboard")}
                                    sx={{ textTransform: "none", color: "#888" }}>Cancel</Button>
                                <Button variant="contained" startIcon={!loading ? <SaveIcon /> : undefined} onClick={handleSubmit} disabled={loading}
                                    sx={{ backgroundColor: "#3ab5e6", borderRadius: "50px", textTransform: "none", fontWeight: 700, px: 4, "&:hover": { backgroundColor: "#1ea0d0" } }}>
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Save Child Profile"}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
