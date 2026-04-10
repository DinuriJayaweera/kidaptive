import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Zoom,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Layers as LayersIcon,
  BarChart as DifficultyIcon,
  Category as CategoryIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../api/categoryApi";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "../../../components/ui/Badge";

// ── Static config ─────────────────────────────────────────
const LEVELS = [
  { num: "01", label: "Starter" },
  { num: "02", label: "Explorer" },
  { num: "03", label: "Champion" },
];

const DIFFICULTIES = [
  { label: "Easy", color: "#8EE870", bg: "#f0fdf4" },
  { label: "Medium", color: "#FFCC35", bg: "#fffbeb" },
  { label: "Hard", color: "#FF5144", bg: "#fef2f2" },
];

// ── Linked Items cell with tooltip ────────────────────────
function LinkedItemsCell({ cat }: { cat: Category }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <Typography
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: "#1a1a2e",
          cursor: "default",
          borderBottom: "1px dashed #cbd5e1",
          pb: "1px",
          userSelect: "none",
        }}
      >
        {cat.totalCount}
      </Typography>
      {hovered && (
        <Paper
          elevation={3}
          sx={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: 200,
            px: 2,
            py: 1.5,
            borderRadius: "12px",
            zIndex: 100,
            background: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            pointerEvents: "none",
          }}
        >
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#64748b", mb: 0.5 }}>
            Breakdown
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#25AFF4", flexShrink: 0 }} />
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#1a1a2e", fontWeight: 500 }}>
              {cat.placementCount} Placement Questions
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", flexShrink: 0 }} />
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#1a1a2e", fontWeight: 500 }}>
              {cat.quizCount} Quizzes
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}



const AGE_GROUPS = ["5-6", "7-8", "9-10"];

// ── Add / Edit Modal ──────────────────────────────────────
interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: Category | null;
  readOnly?: boolean;
}

function CategoryModal({ open, onClose, onSaved, editing, readOnly = false }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "pending">("pending");
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(editing?.name || "");
      setStatus(editing?.status || "pending");
      setAgeGroups(editing?.ageGroups || []);
      setError("");
    }
  }, [open, editing]);

  const toggleAgeGroup = (ag: string) => {
    setAgeGroups((prev) => 
      prev.includes(ag) ? prev.filter((g) => g !== ag) : [...prev, ag]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await updateCategory(editing._id, { name: name.trim(), status, ageGroups });
      } else {
        await createCategory({ name: name.trim(), status, ageGroups });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Zoom}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
          p: 0,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          fontSize: 17,
          color: "#1a1a2e",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {readOnly ? "Category Details" : (editing ? "Edit Category" : "+ Add Category")}
        <IconButton onClick={onClose} size="small" sx={{ color: "#94a3b8" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: "20px !important" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: 13 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Category Name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          fullWidth
          autoFocus
          autoComplete="off"
          placeholder="e.g. Nouns, Verbs, Pronouns..."
          disabled={readOnly}
          sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "999px" } }}
        />

        {/* Age Group Checkboxes */}
        <Box sx={{ mb: 2.5 }}>
          <FormLabel
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              letterSpacing: "0.3px",
              mb: 1,
              display: "block",
            }}
          >
            Age Group(s)
          </FormLabel>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {AGE_GROUPS.map((ag) => {
              const selected = ageGroups.includes(ag);
              const is5to6 = ag.includes('5-6');
              const is7to8 = ag.includes('7-8');
              const is9to10 = ag.includes('9-10');

              let selectedBg = '#25AFF4';
              let selectedColor = '#fff';
              
              if (selected) {
                 if (is5to6) { selectedBg = '#fee2e2'; selectedColor = '#dc2626'; }
                 else if (is7to8) { selectedBg = '#fef9c3'; selectedColor = '#a16207'; }
                 else if (is9to10) { selectedBg = '#dcfce3'; selectedColor = '#15803d'; }
              }

              if (readOnly && selected) {
                return <Badge key={ag} type="age" label={`${ag} yrs`} />;
              }
              if (readOnly && !selected) {
                return null; // hide unselected in readOnly mode
              }

              return (
                <Box
                  key={ag}
                  onClick={() => !readOnly && toggleAgeGroup(ag)}
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: "999px",
                    px: 2.5,
                    py: 1,
                    cursor: readOnly ? "default" : "pointer",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid",
                    backgroundColor: selected ? selectedBg : "#f8fafc",
                    color: selected ? selectedColor : "#64748b",
                    borderColor: selected ? selectedBg : "#e2e8f0",
                    boxShadow: selected ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                    "&:hover": {
                      backgroundColor: selected ? selectedBg : "#f1f5f9",
                      transform: readOnly ? "none" : "translateY(-1px)",
                    }
                  }}
                >
                  {ag} yrs
                </Box>
              );
            })}
          </Box>
        </Box>

        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "active" | "pending")}
          fullWidth
          disabled={readOnly}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "999px" } }}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="pending">Pending Review</MenuItem>
        </TextField>

        {/* Statistics section in view mode */}
        {readOnly && editing && (
          <Box sx={{
            mt: 3, p: 2, borderRadius: "12px", background: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2
          }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Placement Qs
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#25AFF4" }}>
                {editing.placementCount}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Quizzes
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#8b5cf6" }}>
                {editing.quizCount}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: "#94a3b8",
            textTransform: "none",
            borderRadius: "999px",
          }}
        >
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "999px",
              px: 3.5,
              background: "#25AFF4",
              "&:hover": { background: "#1EA0E6" },
            }}
          >
            {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editing ? "Save Changes" : "Add Category"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ── Delete confirmation dialog ────────────────────────────
interface DeleteDialogProps {
  open: boolean;
  categoryName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteDialog({ open, categoryName, onClose, onConfirm, loading }: DeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Zoom}
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: "#1a1a2e", pb: 1 }}>
        Delete Category?
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#64748b", fontSize: 14 }}>
          Are you sure you want to delete <strong style={{ color: "#1a1a2e" }}>"{categoryName}"</strong>?
          {" "}This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ fontFamily: "'Poppins', sans-serif", textTransform: "none", borderRadius: "10px", color: "#64748b" }}>
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success"
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch {
      showSnackbar("Failed to load categories.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddClick = () => { setEditTarget(null); setIsViewOnly(false); setModalOpen(true); };
  const handleEditClick = (cat: Category) => { setEditTarget(cat); setIsViewOnly(false); setModalOpen(true); };
  const handleViewClick = (cat: Category) => { setEditTarget(cat); setIsViewOnly(true); setModalOpen(true); };
  const handleSaved = () => { fetchCategories(); showSnackbar(editTarget ? "Category updated." : "Category added."); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCategory(deleteTarget._id);
      setDeleteTarget(null);
      await fetchCategories();
      showSnackbar("Category deleted.");
    } catch {
      showSnackbar("Failed to delete category.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* ── Page Header ───────────────────────────────── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: { xs: 2.5, md: 3 }, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Baloo 2', cursive",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.5rem", md: "1.85rem" },
              mb: 0.5,
            }}
          >
            Categories Management
          </Typography>
          <Typography sx={{ color: "#6b7280", fontSize: { xs: "0.875rem", md: "0.95rem" }, fontFamily: "'Poppins', sans-serif" }}>
            Skill Groups and Learning Tracks
          </Typography>
        </Box>
        <Button
          onClick={handleAddClick}
          variant="contained"
          startIcon={<AddIcon />}
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
          Add Category
        </Button>
      </Box>

      {/* ── Categories Table ───────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          background: "#fff",
          mb: 3,
        }}
      >
        {loading ? (
          <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} sx={{ color: "#25AFF4" }} />
          </Box>
        ) : categories.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CategoryIcon sx={{ fontSize: 40, color: "#e2e8f0", mb: 1 }} />
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#94a3b8", fontWeight: 500 }}>
              No categories yet. Add one to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: { xs: "auto", md: "hidden" } }}>
            <Table sx={{ minWidth: { xs: 320, md: "100%" }, tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={{ background: "#f9fafb", height: 60 }}>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", borderBottom: "1px solid #f3f4f6", padding: "12px 16px", verticalAlign: "middle", width: "100%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", height: "100%" }}>CATEGORY NAME</Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", borderBottom: "1px solid #f3f4f6", padding: "12px 16px", verticalAlign: "middle", width: 140, textAlign: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>LINKED ITEMS</Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", borderBottom: "1px solid #f3f4f6", padding: "12px 16px", verticalAlign: "middle", width: 160, textAlign: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>STATUS</Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontWeight: 600, fontSize: 11, letterSpacing: "0.5px", borderBottom: "1px solid #f3f4f6", padding: "12px 16px", verticalAlign: "middle", width: 120, textAlign: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>ACTIONS</Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow
                    key={cat._id}
                    hover
                    sx={{
                      height: 60,
                      "&:last-child td": { border: 0 },
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                        transform: "scale(1.005)",
                      },
                    }}
                  >
                    <TableCell sx={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", height: "100%" }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: { xs: 13, md: 14 }, color: "#374151", fontWeight: 500 }}>
                          {cat.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <LinkedItemsCell cat={cat} />
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <Badge type="status" label={cat.status} />
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, height: "100%" }}>
                        <Tooltip title="View" placement="top" arrow>
                          <IconButton
                            onClick={() => handleViewClick(cat)}
                            size="small"
                            sx={{
                              color: "#d1d5db",
                              transition: "all 0.2s ease",
                              "&:hover": { color: "#25AFF4", background: "#e8f7fe", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(37,175,244,0.15)" },
                              p: 0.75,
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit" placement="top" arrow>
                          <IconButton
                            onClick={() => handleEditClick(cat)}
                            size="small"
                            sx={{
                              color: "#d1d5db",
                              transition: "all 0.2s ease",
                              "&:hover": { color: "#8EE870", background: "#f0fdf4", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(142,232,112,0.15)" },
                              p: 0.75,
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete" placement="top" arrow>
                          <IconButton
                            onClick={() => setDeleteTarget(cat)}
                            size="small"
                            sx={{
                              color: "#d1d5db",
                              transition: "all 0.2s ease",
                              "&:hover": { color: "#FF5144", background: "#fef2f2", transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(255,81,68,0.15)" },
                              p: 0.75,
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Bottom Cards Row ───────────────────────────── */}
      <Grid container spacing={2.5}>
        {/* Levels Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: "1px solid #e8ecf1",
              background: "#fff",
              p: 3,
              height: "100%",
            }}
          >
            {/* Card Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box sx={{ p: 1, borderRadius: "10px", background: "#eff6ff", display: "flex" }}>
                <LayersIcon sx={{ fontSize: 20, color: "#3b82f6" }} />
              </Box>
              <Box>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: "#1a1a2e", lineHeight: 1.2 }}>
                  Levels
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#94a3b8" }}>
                  Main difficulty stages
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {LEVELS.map((level) => (
                <Box
                  key={level.num}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.5,
                    borderBottom: level.num !== "03" ? "1px solid #f8fafc" : "none",
                  }}
                >
                  <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, color: "#cbd5e1", minWidth: 24 }}>
                    {level.num}
                  </Typography>
                  <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>
                    {level.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Difficulty Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: "1px solid #e8ecf1",
              background: "#fff",
              p: 3,
              height: "100%",
            }}
          >
            {/* Card Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box sx={{ p: 1, borderRadius: "10px", background: "#fff7ed", display: "flex" }}>
                <DifficultyIcon sx={{ fontSize: 20, color: "#f97316" }} />
              </Box>
              <Box>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: "#1a1a2e", lineHeight: 1.2 }}>
                  Difficulty
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#94a3b8" }}>
                  Granular complexity levels
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {DIFFICULTIES.map((diff) => (
                <Box
                  key={diff.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.5,
                    borderBottom: diff.label !== "Hard" ? "1px solid #f8fafc" : "none",
                  }}
                >
                  <Badge type="difficulty" label={diff.label} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Modals ────────────────────────────────────── */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editTarget}
        readOnly={isViewOnly}
      />
      <DeleteDialog
        open={!!deleteTarget}
        categoryName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />

      {/* ── Snackbar ──────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: "12px", fontFamily: "'Poppins', sans-serif" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
