import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, IconButton, Tooltip, LinearProgress } from "@mui/material";
import {
    ArrowBackIos as PrevIcon,
    ArrowForwardIos as NextIcon,
    Close as CloseIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
} from "@mui/icons-material";
import { pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import React from "react";

import quizBg from "../../../assets/Quiz_bg.png";
import { fetchStory, getStoryFileUrl, type ChildStory } from "../api/storiesApi";

// PDF worker via CDN — avoids Vite bundling complexity
pdfjs.GlobalWorkerOptions.workerSrc =
    `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


// ── ForwardRef book page — required by react-pageflip ─────
const BookPage = React.forwardRef<
    HTMLDivElement,
    { src: string; pageNum: number }
>(({ src, pageNum }, ref) => (
    <div
        ref={ref}
        style={{
            background:    "#fffef7",
            width:         "100%",
            height:        "100%",
            display:       "flex",
            flexDirection: "column",
            overflow:      "hidden",
            boxSizing:     "border-box",
            borderLeft:    "1px solid rgba(0,0,0,0.06)",
            borderRight:   "1px solid rgba(0,0,0,0.06)",
        }}
    >
        <img
            src={src}
            alt={`Page ${pageNum}`}
            style={{ flex: 1, width: "100%", height: "calc(100% - 26px)", objectFit: "contain", display: "block" }}
        />
        <div style={{
            height: 26, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#f5f3ea", borderTop: "1px solid rgba(0,0,0,0.06)",
            fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "#aaa", userSelect: "none",
        }}>
            {pageNum}
        </div>
    </div>
));
BookPage.displayName = "BookPage";

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StoryReaderPage() {
    const { storyId } = useParams<{ storyId: string }>();
    const navigate    = useNavigate();

    const [story,    setStory]    = useState<ChildStory | null>(null);
    const [pages,    setPages]    = useState<string[]>([]);
    const [progress, setProgress] = useState(0);   // render progress 0-100
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");
    const [curPage,  setCurPage]  = useState(0);
    const [isFS,     setIsFS]     = useState(false);

    // Responsive page dimensions
    const [pageW, setPageW] = useState(380);
    const [pageH, setPageH] = useState(537);


    const bookRef = useRef<any>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    // Capture initial page width so we don't re-render on resize
    const renderWRef = useRef<number>(0);

    const measure = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mob = vw < 680;
        const fs  = !!document.fullscreenElement;
        const maxW   = fs ? Math.floor((vw - 80) / 2) : 460;
        const topBar = fs ? 70 : 200;
        const w = mob
            ? Math.min(vw - 48, fs ? vw - 48 : 380)
            : Math.min((vw - (fs ? 80 : 160)) / 2, maxW);
        const h = Math.min(vh - topBar, Math.floor(w * 1.41));
        setPageW(Math.floor(w));
        setPageH(Math.floor(h));
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    // Load story + render PDF to images
    useEffect(() => {
        if (!storyId) return;
        setLoading(true);
        setPages([]);
        setProgress(0);

        fetchStory(storyId)
            .then(async (s) => {
                setStory(s);
                if (!s.pdfPath) throw new Error("no pdf");

                const url = getStoryFileUrl(s.pdfPath);
                // Render at 2× current width for crisp display
                if (renderWRef.current === 0) renderWRef.current = Math.min(pageW * 2, 900);
                const renderW = renderWRef.current;

                const pdf = await pdfjs.getDocument(url).promise;
                const total = pdf.numPages;
                const imgs: string[] = [];

                for (let i = 1; i <= total; i++) {
                    const page = await pdf.getPage(i);
                    const vp0  = page.getViewport({ scale: 1 });
                    const vp   = page.getViewport({ scale: renderW / vp0.width });
                    const c    = document.createElement("canvas");
                    c.width    = Math.floor(vp.width);
                    c.height   = Math.floor(vp.height);
                    await page.render({ canvas: c, canvasContext: c.getContext("2d")!, viewport: vp }).promise;
                    imgs.push(c.toDataURL("image/jpeg", 0.88));
                    setProgress(Math.round((i / total) * 100));
                }
                setPages(imgs);
            })
            .catch(() => setError("Oops! Couldn't open this story. Please try again! 😔"))
            .finally(() => setLoading(false));
    }, [storyId]); // intentionally omit pageW — render once at initial size

    // Navigation
    const isFirst = curPage === 0;
    const isLast  = curPage >= pages.length - 1;

    function flipNext() { bookRef.current?.pageFlip()?.flipNext("bottom"); }
    function flipPrev() { bookRef.current?.pageFlip()?.flipPrev("bottom"); }
    function onFlip(e: any) { setCurPage(e.data); }

    // Fullscreen
    function toggleFS() {
        if (!document.fullscreenElement) {
            wrapRef.current?.requestFullscreen().catch(() => {});
            setIsFS(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFS(false);
        }
    }
    useEffect(() => {
        const h = () => { setIsFS(!!document.fullscreenElement); measure(); };
        document.addEventListener("fullscreenchange", h);
        return () => document.removeEventListener("fullscreenchange", h);
    }, [measure]);

    // Keyboard
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") flipNext();
            if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   flipPrev();
            if (e.key === "Escape") navigate("/child/stories");
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [navigate]);

    const total   = pages.length;
    const pageNum = curPage + 1; // 1-indexed

    // ── Loading screen ─────────────────────────────────────
    if (loading) return (
        <Box sx={{ minHeight: "100vh", backgroundImage: `url(${quizBg})`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
            <Box sx={{ background: "rgba(255,255,255,0.92)", borderRadius: "24px", p: 4, textAlign: "center", minWidth: 260, boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}>
                <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>📖</Typography>
                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: "1.1rem", color: "#1A202C", mb: 0.5 }}>
                    Opening your book…
                </Typography>
                {progress > 0 && (
                    <>
                        <LinearProgress variant="determinate" value={progress}
                            sx={{ mt: 2, mb: 1, borderRadius: 4, height: 8, bgcolor: "#E8ECF1", "& .MuiLinearProgress-bar": { bgcolor: "#25AFF4", borderRadius: 4 } }} />
                        <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#64748B" }}>
                            Loading pages… {progress}%
                        </Typography>
                    </>
                )}
                {progress === 0 && <CircularProgress size={28} sx={{ color: "#25AFF4", mt: 1.5 }} />}
            </Box>
        </Box>
    );

    // ── Error screen ───────────────────────────────────────
    if (error || !story) return (
        <Box sx={{ minHeight: "100vh", backgroundImage: `url(${quizBg})`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{ background: "rgba(255,255,255,0.95)", borderRadius: "24px", p: 4, textAlign: "center", maxWidth: 320 }}>
                <Typography sx={{ fontSize: "3rem", mb: 1 }}>😔</Typography>
                <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "1.1rem", color: "#1A202C", mb: 2 }}>
                    {error || "Story not found!"}
                </Typography>
                <Box component="button" onClick={() => navigate("/child/stories")}
                    sx={{ px: 3, py: 1.2, borderRadius: "999px", background: "#25AFF4", border: "none", color: "#fff", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                    ← Back to Stories
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box ref={wrapRef}
            sx={{ minHeight: "100vh", backgroundImage: `url(${quizBg})`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden", userSelect: "none" }}>

            {/* ── Top bar ─────────────────────────────── */}
            <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 3 }, py: 1.2, flexShrink: 0, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Tooltip title="Back to stories">
                        <IconButton onClick={() => navigate("/child/stories")} size="small"
                            sx={{ color: "#1A202C", "&:hover": { background: "rgba(0,0,0,0.08)" } }}>
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Tooltip>
                    <Box>
                        <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: { xs: "0.9rem", md: "1.05rem" }, color: "#1A202C", lineHeight: 1.1 }}>
                            {story.title}
                        </Typography>
                        {total > 0 && (
                            <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: "0.7rem", color: "#64748B" }}>
                                {total} pages
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Tooltip title={isFS ? "Exit fullscreen" : "Fullscreen"}>
                    <IconButton onClick={toggleFS} size="small"
                        sx={{ color: "#1A202C", "&:hover": { background: "rgba(0,0,0,0.08)" } }}>
                        {isFS ? <FullscreenExitIcon sx={{ fontSize: 20 }} /> : <FullscreenIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* ── Book area ───────────────────────────── */}
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", position: "relative", py: 2 }}>

                {/* Prev */}
                <IconButton onClick={flipPrev} disabled={isFirst}
                    sx={{ position: { xs: "fixed", md: "absolute" }, left: { xs: 4, md: 12 }, zIndex: 20, width: 44, height: 44, background: isFirst ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", boxShadow: isFirst ? "none" : "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s", color: "#1A202C", "&:hover": !isFirst ? { background: "#fff", transform: "scale(1.08)" } : {}, "&.Mui-disabled": { color: "rgba(0,0,0,0.2)" } }}>
                    <PrevIcon sx={{ fontSize: 18 }} />
                </IconButton>

                {/* Book */}
                {pages.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        {/* Drop shadow */}
                        <Box sx={{ position: "relative" }}>
                            <Box sx={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", width: "80%", height: 20, background: "rgba(0,0,0,0.25)", filter: "blur(10px)", borderRadius: "50%", zIndex: 0 }} />
                            <Box sx={{ position: "relative", zIndex: 1, borderRadius: "4px 12px 12px 4px", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
                                {/* @ts-ignore */}
                                <HTMLFlipBook
                                    key={`${pageW}-${pageH}`}
                                    ref={bookRef}
                                    width={pageW}
                                    height={pageH}
                                    size="fixed"
                                    startPage={curPage}
                                    flippingTime={650}
                                    drawShadow={true}
                                    maxShadowOpacity={0.4}
                                    showCover={false}
                                    mobileScrollSupport={false}
                                    onFlip={onFlip}
                                    useMouseEvents={true}
                                    clickEventForward={false}
                                    showPageCorners={true}
                                    style={{ borderRadius: "4px 12px 12px 4px" }}
                                >
                                    {pages.map((src, i) => (
                                        <BookPage key={i} src={src} pageNum={i + 1} />
                                    ))}
                                </HTMLFlipBook>
                            </Box>
                        </Box>

                        {/* Page counter */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", borderRadius: "999px", px: 2.5, py: 0.8, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                            <Box sx={{ width: 60, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                                <Box sx={{ height: "100%", borderRadius: 2, background: "#25AFF4", width: `${(pageNum / total) * 100}%`, transition: "width 0.4s ease" }} />
                            </Box>
                            <Typography sx={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: "0.85rem", color: "#1A202C" }}>
                                {pageNum} / {total}
                            </Typography>
                            <Box sx={{ width: 60, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                                <Box sx={{ height: "100%", borderRadius: 2, background: "#25AFF4", width: `${(pageNum / total) * 100}%`, transition: "width 0.4s ease" }} />
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ background: "rgba(255,255,255,0.9)", borderRadius: "16px", p: 4, textAlign: "center" }}>
                        <Typography sx={{ fontSize: "2rem", mb: 1 }}>📄</Typography>
                        <Typography sx={{ fontFamily: "'Poppins',sans-serif", color: "#64748B", fontSize: 13 }}>Couldn't render this PDF</Typography>
                    </Box>
                )}

                {/* Next */}
                <IconButton onClick={flipNext} disabled={isLast}
                    sx={{ position: { xs: "fixed", md: "absolute" }, right: { xs: 4, md: 12 }, zIndex: 20, width: 44, height: 44, background: isLast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", boxShadow: isLast ? "none" : "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s", color: "#1A202C", "&:hover": !isLast ? { background: "#fff", transform: "scale(1.08)" } : {}, "&.Mui-disabled": { color: "rgba(0,0,0,0.2)" } }}>
                    <NextIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Keyboard hint */}
            <Typography sx={{ fontFamily: "'Poppins',sans-serif", fontSize: "0.68rem", color: "rgba(0,0,0,0.35)", pb: 1.5, flexShrink: 0 }}>
                Use ← → arrow keys or click page corners to flip
            </Typography>
        </Box>
    );
}
