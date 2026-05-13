import { useState, useEffect, useRef, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, CircularProgress, Alert, Tab, Tabs } from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
    LockReset as LockResetIcon,
    Email as EmailIcon,
    Lock as LockIcon,
} from "@mui/icons-material";
import {
    getPendingRequestByChild,
    changeChildPassword,
    sendOtp,
    resetWithOtp,
    type ResetRequest,
} from "../api/childPasswordResetApi";
import EmojiKeypad from "../../auth/components/EmojiKeypad";
import { useAuth } from "../../auth/context/AuthContext";

type Method = "change" | "forgot";
type ChangeStep = "old" | "new";
type ForgotStep = "send" | "code" | "new";

export default function ChildPasswordResetPage() {
    const { childId } = useParams<{ childId: string }>();
    const navigate    = useNavigate();
    const { user }    = useAuth();

    const [request,  setRequest]  = useState<ResetRequest | null>(null);
    const [pageLoad, setPageLoad] = useState(true);
    const [method,   setMethod]   = useState<Method>("change");

    // Method 1
    const [changeStep, setChangeStep] = useState<ChangeStep>("old");
    const [oldEmojis,  setOldEmojis]  = useState<string[]>([]);
    const [newEmojis1, setNewEmojis1] = useState<string[]>([]);

    // Method 2
    const [forgotStep, setForgotStep] = useState<ForgotStep>("send");
    const [otp,        setOtp]        = useState(["", "", "", "", "", ""]);
    const [newEmojis2, setNewEmojis2] = useState<string[]>([]);
    const [otpMsg,     setOtpMsg]     = useState("");
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [working, setWorking] = useState(false);
    const [error,   setError]   = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!childId) return;
        getPendingRequestByChild(childId)
            .then(({ request: r }) => {
                setRequest(r);
                if (r?.status === "otp_sent") {
                    setMethod("forgot");
                    setForgotStep("code");
                }
            })
            .catch(() => {})
            .finally(() => setPageLoad(false));
    }, [childId]);

    const resetErrors = () => setError("");

    // Method 1 submit
    const handleChangeSubmit = async () => {
        if (!childId || newEmojis1.length !== 4) return;
        setWorking(true); resetErrors();
        try {
            await changeChildPassword(childId, oldEmojis.join(""), newEmojis1.join(""));
            setSuccess(true);
            window.dispatchEvent(new Event("notifications-updated"));
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Something went wrong.";
            setError(msg);
            // Wrong old pattern — kick back to step 1
            if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("current pattern")) {
                setChangeStep("old");
                setOldEmojis([]);
                setNewEmojis1([]);
            }
        } finally { setWorking(false); }
    };

    // Method 2a: send OTP
    const handleSendOtp = async () => {
        if (!request) return;
        setWorking(true); resetErrors();
        try {
            const { message } = await sendOtp(request._id);
            setOtpMsg(message);
            setForgotStep("code");
            setRequest(r => r ? { ...r, status: "otp_sent" } : r);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to send code.");
        } finally { setWorking(false); }
    };

    // Method 2b: verify OTP + new emoji
    const handleForgotSubmit = async () => {
        if (!request || newEmojis2.length !== 4) return;
        setWorking(true); resetErrors();
        try {
            await resetWithOtp(request._id, otp.join(""), newEmojis2.join(""));
            setSuccess(true);
            window.dispatchEvent(new Event("notifications-updated"));
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Something went wrong.";
            setError(msg);
            if (msg.toLowerCase().includes("code") || msg.toLowerCase().includes("attempt")) {
                setOtp(["", "", "", "", "", ""]);
                setForgotStep("code");
            }
        } finally { setWorking(false); }
    };

    // OTP input helpers
    const handleOtpChange = (i: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp]; next[i] = val; setOtp(next); resetErrors();
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
    };
    const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };
    const otpFull     = otp.join("").length === 6;
    const maskedEmail = user?.email?.replace(/(.{2}).+(@.+)/, "$1***$2") ?? "your email";
    const childName   = request?.childName ?? "your child";

    if (pageLoad) return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
            <CircularProgress sx={{ color: "#7C3AED" }} />
        </Box>
    );

    if (success) return (
        <Box sx={{ maxWidth: 480, mx: "auto", pt: 4 }}>
            <Paper elevation={0} sx={{ borderRadius: "24px", p: 5, textAlign: "center", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                <Box sx={{ width: 80, height: 80, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: "#22c55e" }} />
                </Box>
                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)", mb: 1 }}>
                    Pattern Updated! 🎉
                </Typography>
                <Typography sx={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, mb: 3 }}>
                    The new emoji pattern is saved for{" "}
                    <Box component="span" sx={{ fontWeight: 700, color: "#7C3AED" }}>{childName}</Box>.
                    {" "}Share it with them so they can log in!
                </Typography>
                <PillBtn onClick={() => navigate("/parent/notifications")} color="#22c55e" shadow="rgba(34,197,94,0.3)">
                    ← Back to Notifications
                </PillBtn>
            </Paper>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 520, mx: "auto", pt: 2 }}>
            {/* Back */}
            <Box component="button" onClick={() => navigate("/parent/notifications")}
                sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 3, background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600, p: 0, "&:hover": { color: "#7C3AED" } }}>
                <ArrowBackIcon sx={{ fontSize: 18 }} /> Back to Notifications
            </Box>

            <Paper elevation={0} sx={{ borderRadius: "20px", overflow: "hidden", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>

                {/* Header */}
                <Box sx={{ background: "linear-gradient(135deg,#7C3AED 0%,#9F67F5 100%)", px: 3, py: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: "14px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <LockResetIcon sx={{ color: "#fff", fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: "1.15rem", color: "#fff", lineHeight: 1.2 }}>
                            Reset {childName}'s Emoji Pattern
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.75)", mt: 0.2 }}>
                            Choose a method below
                        </Typography>
                    </Box>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={method}
                    onChange={(_, v: Method) => { setMethod(v); resetErrors(); }}
                    sx={{
                        borderBottom: "1px solid var(--border-color)",
                        "& .MuiTab-root": { textTransform: "none", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, minHeight: 48 },
                        "& .Mui-selected": { color: "#7C3AED !important" },
                        "& .MuiTabs-indicator": { backgroundColor: "#7C3AED" },
                    }}>
                    <Tab value="change" icon={<LockIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Change Password" />
                    <Tab value="forgot" icon={<EmailIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Forgot Pattern" />
                </Tabs>

                <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px", fontSize: 13 }}>{error}</Alert>
                    )}

                    {/* ══════════════════════════════════
                        METHOD 1 — Change with old pattern
                        ══════════════════════════════════ */}
                    {method === "change" && (
                        <>
                            <StepBubbles
                                labels={["Current Pattern", "New Pattern"]}
                                activeIdx={changeStep === "old" ? 0 : 1}
                            />

                            {changeStep === "old" ? (
                                <>
                                    <InfoBox icon="🔐" title={`Enter ${childName}'s current pattern`}
                                        body="Tap the 4 emojis in the exact order they were originally set." />
                                    <EmojiKeypad value={oldEmojis} onChange={v => { setOldEmojis(v); resetErrors(); }} error={!!error} />
                                    <Box sx={{ mt: 2 }}>
                                        <PillBtn
                                            onClick={() => {
                                                if (oldEmojis.length !== 4) { setError("Please enter all 4 emojis first."); return; }
                                                resetErrors(); setChangeStep("new");
                                            }}
                                            disabled={oldEmojis.length !== 4} color="#7C3AED" shadow="rgba(124,58,237,0.3)">
                                            Continue →
                                        </PillBtn>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <InfoBox icon="✨" title={`Set a new pattern for ${childName}`}
                                        body="Pick any 4 emojis. Remember to share the new pattern with them!" />
                                    <EmojiKeypad value={newEmojis1} onChange={v => { setNewEmojis1(v); resetErrors(); }} error={!!error} />
                                    <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
                                        <Box component="button"
                                            onClick={() => { setChangeStep("old"); setNewEmojis1([]); resetErrors(); }}
                                            sx={{ px: 3, py: 1.4, background: "none", border: "2px solid var(--border-color)", borderRadius: "14px", cursor: "pointer", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: "var(--text-secondary)", flexShrink: 0, "&:hover": { borderColor: "#7C3AED", color: "#7C3AED" } }}>
                                            ← Back
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <PillBtn onClick={handleChangeSubmit} disabled={working || newEmojis1.length !== 4} color="#7C3AED" shadow="rgba(124,58,237,0.3)">
                                                {working ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Save New Pattern 🔑"}
                                            </PillBtn>
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </>
                    )}

                    {/* ══════════════════════════════════
                        METHOD 2 — Forgot / email OTP
                        ══════════════════════════════════ */}
                    {method === "forgot" && (
                        <>
                            {!request ? (
                                <Box sx={{ textAlign: "center", py: 3 }}>
                                    <Typography sx={{ fontSize: "2.5rem", mb: 1.5 }}>📱</Typography>
                                    <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", mb: 1 }}>
                                        No Reset Request Yet
                                    </Typography>
                                    <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                        Ask <Box component="span" sx={{ fontWeight: 700 }}>{childName}</Box> to tap{" "}
                                        <Box component="span" sx={{ fontWeight: 700, color: "#7C3AED" }}>"Forgot your pattern?"</Box>{" "}
                                        on the login screen first, then come back here.
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <StepBubbles
                                        labels={["Send Code", "Verify", "New Pattern"]}
                                        activeIdx={forgotStep === "send" ? 0 : forgotStep === "code" ? 1 : 2}
                                    />

                                    {/* Step: send OTP */}
                                    {forgotStep === "send" && (
                                        <Box sx={{ textAlign: "center", py: 1 }}>
                                            <Box sx={{ width: 64, height: 64, borderRadius: "50%", background: "#7C3AED15", border: "2px solid #7C3AED30", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                                                <EmailIcon sx={{ fontSize: 30, color: "#7C3AED" }} />
                                            </Box>
                                            <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", mb: 0.8 }}>
                                                Verify with Email
                                            </Typography>
                                            <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, mb: 2 }}>
                                                We'll send a 6-digit code to your email:
                                            </Typography>
                                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, borderRadius: "12px", background: "#7C3AED10", border: "1px solid #7C3AED30", mb: 3 }}>
                                                <EmailIcon sx={{ fontSize: 16, color: "#7C3AED" }} />
                                                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#7C3AED", fontFamily: "'Poppins',sans-serif" }}>
                                                    {user?.email ?? "your email"}
                                                </Typography>
                                            </Box>
                                            <br />
                                            <PillBtn onClick={handleSendOtp} disabled={working} color="#7C3AED" shadow="rgba(124,58,237,0.3)">
                                                {working ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Send Verification Code ✉️"}
                                            </PillBtn>
                                        </Box>
                                    )}

                                    {/* Step: enter OTP */}
                                    {forgotStep === "code" && (
                                        <>
                                            {otpMsg && (
                                                <Alert severity="success" sx={{ mb: 2.5, borderRadius: "12px", fontSize: 13 }}>{otpMsg}</Alert>
                                            )}
                                            <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", mb: 2.5, textAlign: "center" }}>
                                                Enter the 6-digit code sent to{" "}
                                                <Box component="span" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{maskedEmail}</Box>
                                            </Typography>
                                            <Box sx={{ display: "flex", gap: { xs: 1, sm: 1.5 }, justifyContent: "center", mb: 3 }}>
                                                {otp.map((digit, i) => (
                                                    <Box key={i} component="input"
                                                        inputMode="numeric" maxLength={1} value={digit}
                                                        ref={(el: HTMLInputElement | null) => { otpRefs.current[i] = el; }}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOtpChange(i, e.target.value)}
                                                        onKeyDown={(e: React.KeyboardEvent) => handleOtpKey(i, e)}
                                                        sx={{
                                                            width: { xs: 44, sm: 50 }, height: { xs: 52, sm: 58 },
                                                            textAlign: "center", fontSize: "1.4rem", fontWeight: 700,
                                                            border: `2px solid ${digit ? "#7C3AED" : "var(--border-color)"}`,
                                                            borderRadius: "12px", outline: "none",
                                                            background: digit ? "#7C3AED08" : "var(--card-bg)",
                                                            color: "var(--text-primary)",
                                                            fontFamily: "'Poppins',sans-serif",
                                                            transition: "all 0.2s",
                                                            "&:focus": { borderColor: "#7C3AED", boxShadow: "0 0 0 3px rgba(124,58,237,0.15)", background: "#7C3AED08" },
                                                        }} />
                                                ))}
                                            </Box>
                                            <PillBtn
                                                onClick={() => { if (!otpFull) { setError("Please enter the full 6-digit code."); return; } resetErrors(); setForgotStep("new"); }}
                                                disabled={!otpFull} color="#7C3AED" shadow="rgba(124,58,237,0.3)">
                                                Verify Code →
                                            </PillBtn>
                                            <Box sx={{ textAlign: "center", mt: 2 }}>
                                                <Box component="button" onClick={handleSendOtp} disabled={working}
                                                    sx={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#7C3AED", fontWeight: 600, fontFamily: "'Poppins',sans-serif", "&:hover": { textDecoration: "underline" }, "&:disabled": { color: "#94A3B8", cursor: "not-allowed" } }}>
                                                    {working ? "Sending…" : "↺ Resend code"}
                                                </Box>
                                            </Box>
                                        </>
                                    )}

                                    {/* Step: new emoji */}
                                    {forgotStep === "new" && (
                                        <>
                                            <InfoBox icon="✨" title={`Set a new pattern for ${childName}`}
                                                body="Pick 4 emojis. Share the new pattern with them after saving!" />
                                            <EmojiKeypad value={newEmojis2} onChange={v => { setNewEmojis2(v); resetErrors(); }} error={!!error} />
                                            <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
                                                <Box component="button"
                                                    onClick={() => { setForgotStep("code"); setNewEmojis2([]); resetErrors(); }}
                                                    sx={{ px: 3, py: 1.4, background: "none", border: "2px solid var(--border-color)", borderRadius: "14px", cursor: "pointer", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: "var(--text-secondary)", flexShrink: 0, "&:hover": { borderColor: "#7C3AED", color: "#7C3AED" } }}>
                                                    ← Back
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <PillBtn onClick={handleForgotSubmit} disabled={working || newEmojis2.length !== 4} color="#7C3AED" shadow="rgba(124,58,237,0.3)">
                                                        {working ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Save New Pattern 🔑"}
                                                    </PillBtn>
                                                </Box>
                                            </Box>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

// ── Helpers ────────────────────────────────────────────────

function StepBubbles({ labels, activeIdx }: { labels: string[]; activeIdx: number }) {
    return (
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
            {labels.map((label, i) => (
                <Fragment key={i}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: i < activeIdx ? "#22c55e" : i === activeIdx ? "#7C3AED" : "rgba(148,163,184,0.18)",
                            color: i <= activeIdx ? "#fff" : "#94A3B8",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: 14,
                            border: `2px solid ${i < activeIdx ? "#22c55e" : i === activeIdx ? "#7C3AED" : "rgba(148,163,184,0.3)"}`,
                            boxShadow: i === activeIdx ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
                            transition: "all 0.3s",
                        }}>
                            {i < activeIdx ? "✓" : i + 1}
                        </Box>
                        <Typography sx={{
                            mt: 0.7, fontSize: 10, fontWeight: 700, textAlign: "center",
                            color: i === activeIdx ? "#7C3AED" : i < activeIdx ? "#22c55e" : "#94A3B8",
                            textTransform: "uppercase", letterSpacing: 0.4,
                            transition: "color 0.3s",
                        }}>
                            {label}
                        </Typography>
                    </Box>
                    {i < labels.length - 1 && (
                        <Box sx={{ flex: 1, height: 2, mt: "17px", mx: 1, background: i < activeIdx ? "#22c55e" : "rgba(148,163,184,0.2)", borderRadius: 1, transition: "background 0.3s" }} />
                    )}
                </Fragment>
            ))}
        </Box>
    );
}

function InfoBox({ icon, title, body }: { icon: string; title: string; body: string }) {
    return (
        <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, p: 2, borderRadius: "12px", background: "#7C3AED08", border: "1px solid #7C3AED20" }}>
            <Box sx={{ fontSize: "1.3rem", mt: 0.2, flexShrink: 0 }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", mb: 0.3 }}>{title}</Typography>
                <Typography sx={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{body}</Typography>
            </Box>
        </Box>
    );
}

function PillBtn({ onClick, disabled = false, color, shadow, children }: {
    onClick: () => void;
    disabled?: boolean;
    color: string;
    shadow: string;
    children: React.ReactNode;
}) {
    return (
        <Box component="button" onClick={onClick} disabled={disabled}
            sx={{
                width: "100%", py: 1.6,
                background: disabled ? "#CBD5E1" : color,
                color: "#fff", border: "none", borderRadius: "14px",
                fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: "0.95rem",
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                boxShadow: disabled ? "none" : `0 6px 20px ${shadow}`,
                transition: "all 0.2s",
                "&:hover": !disabled ? { transform: "translateY(-2px)", boxShadow: `0 10px 28px ${shadow}` } : {},
            }}>
            {children}
        </Box>
    );
}
