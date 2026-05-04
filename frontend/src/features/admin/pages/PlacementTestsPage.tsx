import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Pagination,
    CircularProgress,
    Tooltip,
    TextField,
    InputAdornment,
    Fab,
    Stack,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Zoom,
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Search as SearchIcon,
    QuizOutlined as QuizIcon,
    Bolt as BoltIcon,
    SignalCellularAlt as EasyIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuestions, getStats, createQuestion, updateQuestion, deleteQuestion } from "../api/placementApi";
import type { PlacementQuestion } from "../api/placementApi";
import QuestionModal from "../components/QuestionModal";
import { AGE_GROUPS } from "../constants";
import { getCategories } from "../api/categoryApi";
import { Badge } from "../../../components/ui/Badge";

// Custom style objects will be embedded inside Chips.
// ─────────────────── Stat Card ────────────────────────────────────

const StatCard = ({
    label,
    value,
    icon,
    accent,
    isActive = false,
    onClick,
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    accent: string;
    isActive?: boolean;
    onClick?: () => void;
}) => (
    <Box
        onClick={onClick}
        sx={{
            flex: "1 1 0",
            minWidth: { xs: "calc(50% - 6px)", sm: 140 },
            background: isActive ? "rgba(37,175,244,0.1)" : "var(--card-bg)",
            border: isActive ? "1px solid #4da3ff" : "1px solid var(--border-color)",
            borderRadius: "16px",
            px: { xs: 2, md: 2.5 },
            py: { xs: 1.75, md: 2 },
            display: "flex",
            alignItems: "center",
            gap: 1.75,
            boxShadow: isActive ? "0 4px 14px rgba(77, 163, 255, 0.15)" : "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
            cursor: onClick ? "pointer" : "default",
            transition: "all 0.2s ease",
            "&:hover": onClick ? {
                boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                transform: "translateY(-2px)"
            } : {},
        }}
    >
        <Box
            sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `${accent}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accent,
                flexShrink: 0,
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontSize: { xs: "1.35rem", md: "1.6rem" }, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                {value}
            </Typography>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 500, mt: 0.3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {label}
            </Typography>
        </Box>
    </Box>
);

// ─────────────────── Shared select sx ────────────────────────────

const pillSelectSx = {
    borderRadius: "999px",
    bgcolor: "var(--bg-subtle)",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)", transition: "all 0.2s ease" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#25AFF4", borderWidth: 1, boxShadow: "0 0 0 3px rgba(37,175,244,0.1)" },
    "& .MuiSelect-select": { py: "8px", px: "16px", fontSize: "0.875rem" },
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE DIALOG COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface DeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

function DeleteDialog({ open, onClose, onConfirm, loading }: DeleteDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Zoom as any}
            PaperProps={{ sx: { borderRadius: "16px" } }}
        >
            <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: "var(--text-primary)", pb: 1 }}>
                Delete Question?
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontSize: 14 }}>
                    Are you sure you want to delete this question? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} sx={{ fontFamily: "'Poppins', sans-serif", textTransform: "none", borderRadius: "10px", color: "var(--text-secondary)" }}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    disabled={loading}
                    sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, textTransform: "none", borderRadius: "999px", px: 3.5, background: "#FF5144", "&:hover": { background: "#e84a3e" } }}
                >
                    {loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─────────────────── Page ─────────────────────────────────────────

export default function PlacementTestsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [ageGroupFilter, setAgeGroupFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<PlacementQuestion | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const { data: dbCategories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    });
    
    const activeDbCategories = dbCategories.filter((c) => c.status === "active");

    const availableCategories =
        ageGroupFilter === "All" 
            ? activeDbCategories.map((c) => c.name) 
            : activeDbCategories.filter((c) => c.ageGroups.includes(ageGroupFilter)).map((c) => c.name);

    const handleAgeFilterChange = (newAge: string) => {
        setAgeGroupFilter(newAge);
        setPage(1);
        if (newAge !== "All" && categoryFilter !== "All") {
            const valid = activeDbCategories.filter((c) => c.ageGroups.includes(newAge)).map((c) => c.name);
            if (!valid.includes(categoryFilter)) setCategoryFilter("All");
        }
    };

    // Paginated questions
    const { data, isLoading, error } = useQuery({
        queryKey: ["placementQuestions", page, ageGroupFilter, categoryFilter, difficultyFilter, searchTerm],
        queryFn: () =>
            getQuestions({
                page,
                limit: 8,
                ageGroup: ageGroupFilter !== "All" ? ageGroupFilter : undefined,
                category: categoryFilter !== "All" ? categoryFilter : undefined,
                difficulty: difficultyFilter ? difficultyFilter : undefined,
                search: searchTerm || undefined,
            }),
    });

    // Global stats (real totals across all pages)
    const { data: stats } = useQuery({
        queryKey: ["placementStats"],
        queryFn: getStats,
        staleTime: 30_000,
    });

    const createMutation = useMutation({
        mutationFn: createQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["placementQuestions"] });
            queryClient.invalidateQueries({ queryKey: ["placementStats"] });
            setIsModalOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<PlacementQuestion> }) =>
            updateQuestion(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["placementQuestions"] });
            queryClient.invalidateQueries({ queryKey: ["placementStats"] });
            setIsModalOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["placementQuestions"] });
            queryClient.invalidateQueries({ queryKey: ["placementStats"] });
            setDeleteTargetId(null);
        },
    });

    const handleOpenAdd = () => { setIsViewMode(false); setEditingQuestion(null); setIsModalOpen(true); };
    const handleOpenEdit = (q: PlacementQuestion) => { setIsViewMode(false); setEditingQuestion(q); setIsModalOpen(true); };
    const handleOpenView = (q: PlacementQuestion) => { setIsViewMode(true); setEditingQuestion(q); setIsModalOpen(true); };
    const handleDelete = (id: string) => { setDeleteTargetId(id); };
    const handleSave = (formData: Partial<PlacementQuestion>) => {
        if (editingQuestion) updateMutation.mutate({ id: editingQuestion._id, payload: formData });
        else createMutation.mutate(formData);
    };

    const toggleRow = (id: string) => setExpandedRow((prev) => (prev === id ? null : id));

    return (
        <Box sx={{ width: "100%", fontFamily: "'Poppins', sans-serif" }}>
            {/* Header Area */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: { xs: 2.5, md: 3 }, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: "'Baloo 2', cursive",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.02em",
                            fontSize: { xs: "1.5rem", md: "1.85rem" },
                            mb: 0.5,
                        }}
                    >
                        Placement Tests
                    </Typography>
                    <Typography sx={{ color: "var(--text-secondary)", fontSize: { xs: "0.875rem", md: "0.95rem" }, fontFamily: "'Poppins', sans-serif" }}>
                        Manage the adaptive question pool perfectly.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        borderRadius: "999px",
                        textTransform: "none",
                        fontWeight: 600,
                        background: "#25AFF4",
                        px: 3,
                        py: 1,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: "#1EA0E6",
                            transform: "translateY(-1px)",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                        },
                    }}
                >
                    Add New Question
                </Button>
            </Box>

            {/* ── Stat Cards ── */}
            <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, flexWrap: "wrap", mb: 3 }}>
                <StatCard
                    label="TOTAL"
                    value={stats?.total || 0}
                    icon={<QuizIcon />}
                    accent="#25AFF4"
                    isActive={false} // Total represents no specific filter, never active
                    onClick={() => { setDifficultyFilter(""); setPage(1); }}
                />
                <StatCard
                    label="EASY"
                    value={stats?.easy || 0}
                    icon={<EasyIcon />}
                    accent="#8EE870"
                    isActive={difficultyFilter === "easy"}
                    onClick={() => { setDifficultyFilter(difficultyFilter === "easy" ? "" : "easy"); setPage(1); }}
                />
                <StatCard
                    label="MEDIUM"
                    value={stats?.medium || 0}
                    icon={<BoltIcon />}
                    accent="#FFCC35"
                    isActive={difficultyFilter === "medium"}
                    onClick={() => { setDifficultyFilter(difficultyFilter === "medium" ? "" : "medium"); setPage(1); }}
                />
                <StatCard
                    label="HARD"
                    value={stats?.hard || 0}
                    icon={<BoltIcon sx={{ color: "#FF5144" }} />}
                    accent="#FF5144"
                    isActive={difficultyFilter === "hard"}
                    onClick={() => { setDifficultyFilter(difficultyFilter === "hard" ? "" : "hard"); setPage(1); }}
                />
            </Box>

            {/* ── Filters + Search — right-aligned row ── */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 1.25,
                    mb: 2.5,
                    alignItems: { sm: "center" },
                    justifyContent: { sm: "flex-end" },
                    flexWrap: "wrap",
                }}
            >
                {/* Search pill */}
                <TextField
                    id="placement-search"
                    size="small"
                    placeholder="Search questions…"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    inputProps={{ name: "placement-search", "aria-label": "Search placement questions" }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "var(--text-tertiary)", fontSize: 17 }} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: "999px",
                            bgcolor: "var(--card-bg)",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c6d0dc" },
                            "& input": { py: "8px", px: "4px", fontSize: "0.875rem" },
                        },
                    }}
                    sx={{ width: { xs: "100%", sm: "220px" } }}
                />

                {/* Age Group */}
                <FormControl size="small" sx={{ width: { xs: "100%", sm: "140px" } }}>
                    <Select
                        id="placement-age-group"
                        value={ageGroupFilter}
                        displayEmpty
                        onChange={(e) => handleAgeFilterChange(e.target.value)}
                        inputProps={{ id: "placement-age-group", name: "placement-age-group" }}
                        sx={pillSelectSx}
                        renderValue={(v) => v === "All" ? "All Ages" : `Age ${v}`}
                    >
                        <MenuItem value="All">All Ages</MenuItem>
                        {AGE_GROUPS.map((a) => <MenuItem key={a} value={a}>Age {a}</MenuItem>)}
                    </Select>
                </FormControl>

                {/* Category */}
                <FormControl size="small" sx={{ width: { xs: "100%", sm: "160px" } }}>
                    <Select
                        id="placement-category"
                        value={categoryFilter}
                        displayEmpty
                        onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                        inputProps={{ id: "placement-category", name: "placement-category" }}
                        sx={pillSelectSx}
                        renderValue={(v) => v === "All" ? "All Categories" : v as string}
                    >
                        <MenuItem value="All">All Categories</MenuItem>
                        {availableCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            {/* ── Questions Table ── */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    background: "var(--card-bg)",
                }}
            >
                {isLoading ? (
                    <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 6, textAlign: "center", color: "#ef4444", fontSize: 14 }}>
                        Failed to load questions. Please verify backend is running.
                    </Box>
                ) : (
                    <>
                        <TableContainer sx={{ overflowX: { xs: "auto", md: "hidden" } }}>
                            <Table sx={{ minWidth: { xs: 320, md: "100%" }, tableLayout: "fixed" }}>
                                <TableHead>
                                    <TableRow sx={{ background: "var(--bg-subtle)", height: 60 }}>
                                        <TableCell
                                            sx={{
                                                fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px",
                                                borderBottom: "1px solid var(--border-light)", padding: "12px 16px",
                                                verticalAlign: "middle", maxWidth: 220, width: "100%"
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", height: "100%" }}>
                                                QUESTION
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px",
                                                borderBottom: "1px solid var(--border-light)", padding: "12px 16px",
                                                verticalAlign: "middle", width: 100, textAlign: "center",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                AGE
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                display: { xs: "none", md: "table-cell" },
                                                fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px",
                                                borderBottom: "1px solid var(--border-light)", padding: "12px 16px",
                                                verticalAlign: "middle", width: 140, textAlign: "center",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                CATEGORY
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px",
                                                borderBottom: "1px solid var(--border-light)", padding: "12px 16px",
                                                verticalAlign: "middle", width: 120, textAlign: "center",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                DIFFICULTY
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px",
                                                borderBottom: "1px solid var(--border-light)", padding: "12px 16px",
                                                verticalAlign: "middle", width: 120, textAlign: "center",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                ACTIONS
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {data?.questions.map((q) => {
                                        const isExpanded = expandedRow === q._id;
                                        return (
                                            <TableRow
                                                hover
                                                key={q._id}
                                                sx={{
                                                    cursor: "pointer",
                                                    height: 60,
                                                    "&:last-child td": { border: 0 },
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                        backgroundColor: "var(--bg-subtle)",
                                                        transform: "scale(1.005)",
                                                    },
                                                }}
                                                onClick={() => toggleRow(q._id)}
                                            >
                                                {/* Question cell — truncate with ellipsis + tooltip */}
                                                <TableCell
                                                    sx={{
                                                        padding: "12px 16px",
                                                        borderBottom: "1px solid var(--border-light)",
                                                        maxWidth: 200,
                                                        verticalAlign: "middle",
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", height: "100%" }}>
                                                        <Tooltip
                                                            title={q.questionText}
                                                            placement="top-start"
                                                            disableHoverListener={isExpanded}
                                                            arrow
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontFamily: "'Poppins', sans-serif",
                                                                    fontSize: { xs: 13, md: 14 },
                                                                    color: "var(--text-primary)",
                                                                    fontWeight: 500,
                                                                    lineHeight: 1.45,
                                                                    width: "100%",
                                                                    // Single-line truncation
                                                                    ...(isExpanded
                                                                        ? {}
                                                                        : {
                                                                            whiteSpace: "nowrap",
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis",
                                                                        }),
                                                                }}
                                                            >
                                                                {q.questionText}
                                                            </Typography>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>

                                                {/* Age — centered, minimal pill */}
                                                <TableCell
                                                    sx={{
                                                        padding: "12px 16px",
                                                        borderBottom: "1px solid var(--border-light)",
                                                        verticalAlign: "middle",
                                                        width: 100,
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                        <Chip label={`${q.ageGroup} yrs`} variant="outlined" size="small" sx={{ fontFamily: "'Poppins', sans-serif", minWidth: 80 }} />
                                                    </Box>
                                                </TableCell>

                                                {/* Category */}
                                                <TableCell
                                                    sx={{
                                                        display: { xs: "none", md: "table-cell" },
                                                        padding: "12px 16px",
                                                        borderBottom: "1px solid var(--border-light)",
                                                        verticalAlign: "middle",
                                                        width: 140,
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                        <Chip label={q.category} size="small" sx={{ fontFamily: "'Poppins', sans-serif", background: "var(--bg-hover)", minWidth: 80, fontWeight: 500 }} />
                                                    </Box>
                                                </TableCell>

                                                {/* Difficulty — color-coded badge */}
                                                <TableCell
                                                    sx={{
                                                        padding: "12px 16px",
                                                        borderBottom: "1px solid var(--border-light)",
                                                        verticalAlign: "middle",
                                                        width: 120,
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                        <Badge type="difficulty" label={q.difficulty} />
                                                    </Box>
                                                </TableCell>

                                                {/* Actions — visible on hover */}
                                                <TableCell
                                                    sx={{
                                                        padding: "12px 16px",
                                                        borderBottom: "1px solid var(--border-light)",
                                                        verticalAlign: "middle",
                                                        width: 120,
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="center"
                                                            spacing={1}
                                                            sx={{
                                                                transition: "0.2s ease",
                                                            }}
                                                        >
                                                            <Tooltip title="View" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenView(q)}
                                                                    sx={{
                                                                        color: "var(--text-tertiary)",
                                                                        transition: "all 0.2s ease",
                                                                        "&:hover": { color: "#25AFF4", background: "rgba(37,175,244,0.1)", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(37,175,244,0.15)" },
                                                                        p: 0.75,
                                                                    }}
                                                                >
                                                                    <VisibilityIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Edit" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenEdit(q)}
                                                                    sx={{
                                                                        color: "var(--text-tertiary)",
                                                                        transition: "all 0.2s ease",
                                                                        "&:hover": { color: "#8EE870", background: "rgba(142,232,112,0.1)", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(142,232,112,0.15)" },
                                                                        p: 0.75,
                                                                    }}
                                                                >
                                                                    <EditIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDelete(q._id)}
                                                                    sx={{
                                                                        color: "var(--text-tertiary)",
                                                                        transition: "all 0.2s ease",
                                                                        "&:hover": { color: "#FF5144", background: "rgba(255,81,68,0.1)", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(255,81,68,0.15)" },
                                                                        p: 0.75,
                                                                    }}
                                                                >
                                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {(!data?.questions || data.questions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 10, border: 0 }}>
                                                <QuizIcon sx={{ fontSize: 38, color: "var(--border-color)", mb: 1, display: "block", mx: "auto" }} />
                                                <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 0.5, fontSize: "0.95rem" }}>
                                                    No questions yet
                                                </Typography>
                                                <Typography sx={{ color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                                                    Click "Add New Question" to get started.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination Footer */}
                        {data && data.total > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    px: 3,
                                    py: 1.75,
                                    borderTop: "1px solid var(--border-light)",
                                    flexWrap: "wrap",
                                    gap: 1,
                                }}
                            >
                                <Typography sx={{ color: "var(--text-tertiary)", fontSize: 13 }}>
                                    Showing{" "}
                                    <Box component="span" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                        {data.questions.length}
                                    </Box>{" "}
                                    of{" "}
                                    <Box component="span" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                        {data.total}
                                    </Box>{" "}
                                    questions
                                </Typography>
                                <Pagination
                                    count={data.pages}
                                    page={page}
                                    onChange={(_, p) => setPage(p)}
                                    shape="circular"
                                    size="small"
                                    sx={{
                                        "& .MuiPaginationItem-root": {
                                            fontSize: 13,
                                            transition: "all 0.2s ease",
                                            "&:hover": { background: "#f3f4f6" },
                                        },
                                        "& .MuiPaginationItem-root.Mui-selected": {
                                            background: "#3b82f6",
                                            color: "white",
                                            borderRadius: "50%",
                                            "&:hover": { background: "#2563eb" },
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Paper>

            {/* ── Modal ── */}
            <QuestionModal
                open={isModalOpen}
                initialData={editingQuestion}
                onClose={() => setIsModalOpen(false)}
                onSave={isViewMode ? undefined : handleSave}
                readOnly={isViewMode}
            />

        {/* ── Mobile FAB ── */}
        <Fab
            color="primary"
            aria-label="add question"
            onClick={handleOpenAdd}
            sx={{
                display: { xs: "flex", md: "none" },
                position: "fixed",
                bottom: 24,
                right: 24,
                background: "#25AFF4",
                boxShadow: "0 6px 20px rgba(37,175,244,0.45)",
                "&:hover": { background: "#0fa8ef" },
            }}
        >
            <AddIcon />
        </Fab>

        <DeleteDialog
            open={deleteTargetId !== null}
            onClose={() => setDeleteTargetId(null)}
            onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
            loading={deleteMutation.isPending}
        />
    </Box>
);
}
