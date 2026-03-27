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
    InputLabel,
    Pagination,
    Chip,
    CircularProgress,
    Tooltip,
    TextField,
    InputAdornment,
    Fab,
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from "../api/placementApi";
import type { PlacementQuestion } from "../api/placementApi";
import QuestionModal, { AGE_GROUPS, AGE_GROUP_CATEGORIES, ALL_CATEGORIES } from "../components/QuestionModal";

const AgeGroupBadge = ({ ageGroup }: { ageGroup: string }) => {
    let bgColor = "#eff6ff";
    let textColor = "#2563eb";

    switch (ageGroup) {
        case "5-6":
            bgColor = "#fee2e2";
            textColor = "#dc2626";
            break;
        case "7-8":
            bgColor = "#fef3c7";
            textColor = "#d97706";
            break;
        case "9-10":
            bgColor = "#dcfce7";
            textColor = "#15803d";
            break;
        default: break;
    }

    return (
        <Chip
            label={ageGroup}
            size="small"
            sx={{
                background: bgColor,
                color: textColor,
                fontWeight: 600,
                borderRadius: "100px",
                minWidth: "64px",
                "& .MuiChip-label": {
                    px: 1.5,
                }
            }}
        />
    );
};

export default function PlacementTestsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [ageGroupFilter, setAgeGroupFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<PlacementQuestion | null>(null);

    // Dynamic categories based on selected age filter
    const availableCategories = ageGroupFilter === "All" ? ALL_CATEGORIES : (AGE_GROUP_CATEGORIES[ageGroupFilter] || []);

    // Filter update handling to prevent invalid category combinations
    const handleAgeFilterChange = (newAge: string) => {
        setAgeGroupFilter(newAge);
        setPage(1);
        if (newAge !== "All" && categoryFilter !== "All") {
            const valid = AGE_GROUP_CATEGORIES[newAge] || [];
            if (!valid.includes(categoryFilter)) {
                setCategoryFilter("All");
            }
        }
    };

    // Fetch questions
    const { data, isLoading, error } = useQuery({
        queryKey: ["placementQuestions", page, ageGroupFilter, categoryFilter, searchTerm],
        queryFn: () => getQuestions({
            page,
            limit: 8,
            ageGroup: ageGroupFilter !== "All" ? ageGroupFilter : undefined,
            category: categoryFilter !== "All" ? categoryFilter : undefined,
            search: searchTerm || undefined
        }),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["placementQuestions"] });
            setIsModalOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<PlacementQuestion> }) => updateQuestion(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["placementQuestions"] });
            setIsModalOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["placementQuestions"] });
        },
    });

    const handleOpenAdd = () => {
        setIsViewMode(false);
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (q: PlacementQuestion) => {
        setIsViewMode(false);
        setEditingQuestion(q);
        setIsModalOpen(true);
    };

    const handleOpenView = (q: PlacementQuestion) => {
        setIsViewMode(true);
        setEditingQuestion(q);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleSave = (formData: Partial<PlacementQuestion>) => {
        if (editingQuestion) {
            updateMutation.mutate({ id: editingQuestion._id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, margin: "0 auto", p: { xs: 1.5, md: 3 } }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, gap: { xs: 2, md: 3 }, mb: { xs: 2.5, md: 4 } }}>
                
                {/* Filters Region */}
                <Box sx={{ display: "flex", flexDirection: "row", gap: 1.5, width: { xs: "100%", md: "auto" }, order: { xs: 2, md: 1 } }}>
                    <FormControl size="small" sx={{ flex: 1, minWidth: { md: 160 }, background: "#fff", borderRadius: 1 }}>
                        <InputLabel>Age Group</InputLabel>
                        <Select
                            value={ageGroupFilter}
                            label="Age Group"
                            onChange={(e) => handleAgeFilterChange(e.target.value)}
                        >
                            <MenuItem value="All">All Ages</MenuItem>
                            {AGE_GROUPS.map((a) => <MenuItem key={a} value={a}>Age {a}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ flex: 1, minWidth: { md: 160 }, background: "#fff", borderRadius: 1 }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={categoryFilter}
                            label="Category"
                            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                        >
                            <MenuItem value="All">All</MenuItem>
                            {availableCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>

                {/* Actions Region */}
                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, gap: { xs: 1.5, md: 2 }, width: { xs: "100%", md: "auto" }, order: { xs: 1, md: 2 } }}>
                    <TextField 
                        size="small" 
                        placeholder="Search questions..." 
                        value={searchTerm} 
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#9ba3af", fontSize: 20 }}/></InputAdornment>,
                            sx: { borderRadius: "100px", bgcolor: "#fff", "& fieldset": { borderColor: "#e2e8f0" } }
                        }}
                        sx={{ width: "100%", minWidth: { md: 280 } }}
                    />

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAdd}
                        sx={{
                            display: { xs: "none", md: "flex" },
                            background: "#3498db",
                            borderRadius: "24px",
                            textTransform: "none",
                            px: 3,
                            py: 1,
                            boxShadow: "0 4px 14px 0 rgba(52,152,219,0.39)",
                            "&:hover": { background: "#2980b9", boxShadow: "0 6px 20px rgba(52,152,219,0.23)" },
                            width: "auto",
                            whiteSpace: "nowrap",
                            flexShrink: 0
                        }}
                    >
                        Add New Question
                    </Button>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}>
                {isLoading ? (
                    <Box sx={{ p: 5, display: "flex", justifyContent: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 5, textAlign: "center", color: "error.main" }}>
                        Failed to load questions. Please verify backend is running.
                    </Box>
                ) : (
                    <>
                        <TableContainer sx={{ overflowX: "auto" }}>
                            <Table sx={{ minWidth: { xs: 300, md: 700 } }}>
                                <TableHead sx={{ background: "#f8fafc" }}>
                                    <TableRow>
                                        <TableCell sx={{ color: "#64748b", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>QUESTION</TableCell>
                                        <TableCell sx={{ color: "#64748b", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #e2e8f0", width: { xs: 80, md: 130 }, whiteSpace: "nowrap" }}>AGE</TableCell>
                                        <TableCell sx={{ display: { xs: "none", md: "table-cell" }, color: "#64748b", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #e2e8f0", width: 140 }}>CATEGORY</TableCell>
                                        <TableCell sx={{ display: { xs: "none", md: "table-cell" }, color: "#64748b", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #e2e8f0", width: 140 }}>TYPE</TableCell>
                                        <TableCell align="right" sx={{ color: "#64748b", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #e2e8f0", width: { xs: 100, md: 140 }, whiteSpace: "nowrap" }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.questions.map((q) => (
                                        <TableRow key={q._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 }, transition: "background 0.2s" }}>
                                            <TableCell sx={{ py: { xs: 1.5, md: 2.5 }, color: "#334155", borderBottom: "1px solid #e2e8f0" }}>
                                                <Typography sx={{ display: "-webkit-box", WebkitLineClamp: { xs: 1, md: 2 }, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: { xs: 13, md: 14 } }}>
                                                    {q.questionText}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <AgeGroupBadge ageGroup={q.ageGroup} />
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: "none", md: "table-cell" }, color: "#475569", borderBottom: "1px solid #e2e8f0", fontSize: 14 }}>
                                                {q.category}
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: "none", md: "table-cell" }, color: "#64748b", borderBottom: "1px solid #e2e8f0", fontSize: 13, textTransform: "capitalize" }}>
                                                {q.questionType === 'tf' ? 'True / False' : q.questionType}
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                                                <Tooltip title="View">
                                                    <IconButton size="small" onClick={() => handleOpenView(q)} sx={{ color: "#94a3b8", "&:hover": { color: "#3498db", background: "#f0f9ff" }, mr: { xs: 1, md: 0.5 }, p: { xs: 1, md: 0.5 } }}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleOpenEdit(q)} sx={{ color: "#94a3b8", "&:hover": { color: "#10b981", background: "#ecfdf5" }, mr: { xs: 1, md: 0.5 }, p: { xs: 1, md: 0.5 } }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => handleDelete(q._id)} sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444", background: "#fef2f2" }, p: { xs: 1, md: 0.5 } }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!data?.questions || data.questions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8, color: "#94a3b8" }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                                    <Typography variant="h6" sx={{ color: "#475569" }}>No questions yet</Typography>
                                                    <Typography variant="body2">Click the "Add New Question" button to get started.</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination Footer */}
                        {data && data.total > 0 && (
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                                <Typography sx={{ color: "#64748b", fontSize: 14 }}>
                                    Showing <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>{data.questions.length}</Box> of <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>{data.total}</Box> questions
                                </Typography>
                                <Pagination
                                    count={data.pages}
                                    page={page}
                                    onChange={(_, newPage) => setPage(newPage)}
                                    color="primary"
                                    shape="rounded"
                                />
                            </Box>
                        )}
                    </>
                )}
            </Paper>

            <QuestionModal
                open={isModalOpen}
                initialData={editingQuestion}
                onClose={() => setIsModalOpen(false)}
                onSave={isViewMode ? undefined : handleSave}
                readOnly={isViewMode}
            />

            <Fab 
                color="primary" 
                aria-label="add" 
                onClick={handleOpenAdd}
                sx={{ 
                    display: { xs: "flex", md: "none" }, 
                    position: "fixed", 
                    bottom: 24, 
                    right: 24, 
                    bgcolor: "#3498db",
                    boxShadow: "0 6px 20px rgba(52,152,219,0.39)",
                    "&:hover": { bgcolor: "#2980b9" }
                }}
            >
                <AddIcon />
            </Fab>
        </Box>
    );
}
