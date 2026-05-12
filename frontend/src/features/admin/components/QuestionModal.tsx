import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  IconButton,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  Zoom,
  Radio,
  RadioGroup,
  Alert,
} from "@mui/material";
import { Close as CloseIcon, DeleteOutline as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import type { PlacementQuestion, QuestionType } from "../api/placementApi";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../api/categoryApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: (data: Partial<PlacementQuestion>) => void;
  initialData?: PlacementQuestion | null;
  readOnly?: boolean;
}

import { AGE_GROUPS, QUESTION_TYPES } from "../constants";

const DIFFICULTIES: { value: PlacementQuestion["difficulty"]; label: string; color: string; bg: string; border: string }[] = [
  { value: "easy", label: "Easy", color: "#8EE870", bg: "#f0fdf4", border: "#eee" },
  { value: "medium", label: "Medium", color: "#FFCC35", bg: "#fffbeb", border: "#eee" },
  { value: "hard", label: "Hard", color: "#FF5144", bg: "#fff1f2", border: "#eee" },
];

const TYPE_HELPER: Record<QuestionType, string> = {
  mcq: "Add multiple answer options — one must be correct",
  fill: 'Use ____ (underscores) in the question text to mark the blank',
  input: "The child will type the answer — no options needed",
  boolean: "Select whether the correct answer is True or False",
};

// ─── Helper: get clean initial form data ────────────────────────────
function getInitialFormData(data?: PlacementQuestion | null): Partial<PlacementQuestion> {
  if (data) return { ...data };
  return {
    questionText: "",
    ageGroup: "",
    category: "",
    type: "" as QuestionType,
    difficulty: "" as any,
    options: ["", "", "", ""],
    correctAnswer: "",
  };
}

import { useAdminTheme } from "../context/AdminThemeContext";

export default function QuestionModal({ open, onClose, onSave, initialData, readOnly = false }: Props) {
  const { mode } = useAdminTheme();
  const isDark = mode === "dark";

  const [formData, setFormData] = useState<Partial<PlacementQuestion>>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const activeDB = dbCategories.filter((c) => c.status === "active");

  const currentCategories = formData.ageGroup
    ? activeDB.filter((c) => c.ageGroups.includes(formData.ageGroup!)).map((c) => c.name)
    : activeDB.map((c) => c.name);

  // A ref to track previous props to update state without an effect
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  const [prevOpen, setPrevOpen] = useState(open);

  if (initialData !== prevInitialData || open !== prevOpen) {
    setPrevInitialData(initialData);
    setPrevOpen(open);
    setFormData(getInitialFormData(initialData));
    setErrors({});
  }

  // ── When type changes, reset options/correctAnswer appropriately ──
  const handleTypeChange = (newType: QuestionType) => {
    if (readOnly) return;
    setFormData((prev) => {
      const next = { ...prev, type: newType };
      switch (newType) {
        case "mcq":
          next.options = prev.options?.length ? prev.options : ["", "", "", ""];
          break;
        case "fill":
          next.options = prev.options?.length ? prev.options : ["", "", "", ""];
          break;
        case "input":
          next.options = [];
          break;
        case "boolean":
          next.options = ["True", "False"];
          if (next.correctAnswer !== "True" && next.correctAnswer !== "False") {
            next.correctAnswer = "";
          }
          break;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, type: "" }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const { name, value } = e.target;

    if (name === "type") {
      handleTypeChange(value as QuestionType);
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "ageGroup") {
        const allowedCategories = activeDB.filter((c) => c.ageGroups.includes(value)).map((c) => c.name);
        if (!allowedCategories.includes(updated.category || "")) {
          updated.category = allowedCategories[0] || "";
        }
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleOptionChange = (index: number, value: string) => {
    if (readOnly) return;
    setFormData((prev) => {
      const newOptions = [...(prev.options || [])];
      const oldVal = newOptions[index];
      newOptions[index] = value;

      let updatedCorrectAnswer = prev.correctAnswer;
      // Note: Keep correctAnswer in sync if they rename the active option
      if (oldVal !== undefined && prev.correctAnswer === oldVal) {
        updatedCorrectAnswer = value;
      }
      return { ...prev, options: newOptions, correctAnswer: updatedCorrectAnswer };
    });
    setErrors((prev) => ({ ...prev, options: "", correctAnswer: "" }));
  };

  const handleAddOption = () => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, options: [...(prev.options || []), ""] }));
  };

  const handleRemoveOption = (index: number) => {
    if (readOnly) return;
    const newOptions = [...(formData.options || [])];
    const removed = newOptions.splice(index, 1)[0];
    // If removed option was the correct answer, clear it
    if (formData.correctAnswer === removed) {
      setFormData((prev) => ({ ...prev, options: newOptions, correctAnswer: "" }));
    } else {
      setFormData((prev) => ({ ...prev, options: newOptions }));
    }
  };

  const handleCorrectAnswerSelect = (value: string) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, correctAnswer: value }));
    setErrors((prev) => ({ ...prev, correctAnswer: "" }));
  };

  const handleDifficultyChange = (value: PlacementQuestion["difficulty"]) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, difficulty: value }));
    setErrors((prev) => ({ ...prev, difficulty: "" }));
  };

  // ── Validation ────────────────────────────────────────
  const handleSave = () => {
    if (readOnly) return;
    const newErrors: Record<string, string> = {};
    const qType = formData.type;

    if (!formData.questionText?.trim()) newErrors.questionText = "Question text is required.";
    if (!formData.ageGroup) newErrors.ageGroup = "Age group is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!qType) newErrors.type = "Question type is required.";
    if (!formData.difficulty) newErrors.difficulty = "Difficulty level is required.";
    if (!formData.correctAnswer?.trim()) newErrors.correctAnswer = "Correct answer is required.";

    // Type-specific validation
    if (qType === "mcq" || qType === "fill") {
      const validOptions = (formData.options || []).filter((o) => o.trim() !== "");
      if (validOptions.length < 3) {
        newErrors.options = `${qType === "mcq" ? "MCQ" : "Fill in the blank"} requires at least 3 options.`;
      } else if (formData.correctAnswer?.trim()) {
        const correct = formData.correctAnswer.trim();
        if (!validOptions.some((opt) => opt.trim() === correct)) {
          newErrors.correctAnswer = "Correct answer must match one of the provided options.";
        }
      }
    }

    if (qType === "fill" || qType === "input") {
      if (formData.questionText) {
        const blankCount = (formData.questionText.match(/____/g) || []).length;
        if (blankCount !== 1) {
          newErrors.questionText = 'Question must contain exactly ONE "____" (4 underscores).';
        }
      }
    }

    if (qType === "boolean" && formData.correctAnswer?.trim()) {
      if (formData.correctAnswer.trim() !== "True" && formData.correctAnswer.trim() !== "False") {
        newErrors.correctAnswer = 'Correct answer must be exactly "True" or "False".';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clean up data before saving
    const saveData = { ...formData };
    if (qType === "input") {
      saveData.options = [];
    }
    if (qType === "boolean") {
      saveData.options = ["True", "False"];
    }

    if (onSave) onSave(saveData);
  };

  const activeDifficulty = formData.difficulty || "";
  const activeType = formData.type as QuestionType;
  const typeConfig = QUESTION_TYPES.find((t) => t.value === activeType);
  const showOptions = activeType === "mcq" || activeType === "fill";
  const showBooleanSelector = activeType === "boolean";
  const showInputOnly = activeType === "input";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Zoom}
      disableRestoreFocus
      PaperProps={{
        sx: {
          maxWidth: "700px",
          width: "90%",
          borderRadius: "16px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
        }
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          fontFamily: "'Poppins', sans-serif",
          borderRadius: "999px !important",
          background: "var(--card-bg)",
          transition: "all 0.2s ease",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-light)", borderRadius: "999px" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#25AFF4", borderWidth: "1px", boxShadow: "0 0 0 3px rgba(37,175,244,0.1)" },
          "&.MuiInputBase-multiline": { borderRadius: "20px", padding: "8px" }
        },
        "& .MuiInputLabel-root": {
          fontFamily: "'Poppins', sans-serif", fontWeight: 500, color: "#6b7280",
          transform: "translate(16px, 14px) scale(1)",
          "&.MuiInputLabel-shrink": { transform: "translate(14px, -9px) scale(0.75)" }
        },
        "& .MuiInputBase-input": { fontFamily: "'Poppins', sans-serif", padding: "12px 16px" },
        "& .MuiFormHelperText-root": {
          fontFamily: "'Poppins', sans-serif", fontSize: "12px", marginTop: "4px",
          "&.Mui-error": { color: "#ef4444" }
        },
        "& .MuiFilledInput-root": {
          backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", borderRadius: "999px !important",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)", padding: "4px 0", fontFamily: "'Poppins', sans-serif",
          cursor: "default",
          "&:before, &:after": { display: "none" },
          "&.MuiInputBase-multiline": { backgroundColor: "var(--bg-subtle)", borderRadius: "20px", padding: "8px" },
          "&:hover": { backgroundColor: "var(--bg-hover)" },
          "&.MuiInputBase-multiline:hover": { backgroundColor: "var(--bg-hover)" }
        },
        "& .MuiSelect-select.MuiFilledInput-input": { cursor: "default", "&:focus": { backgroundColor: "transparent" } },
        "& .MuiSelect-icon": { display: readOnly ? "none" : "block" }
      }}
    >
      <DialogTitle sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "'Baloo 2', cursive", fontWeight: 600, fontSize: "20px", color: "var(--text-primary)",
        position: "sticky", top: 0, background: "var(--card-bg)", zIndex: 10,
        paddingBottom: "10px", marginBottom: "16px", borderBottom: "1px solid var(--border-light)"
      }}>
        {readOnly ? "View Question" : initialData ? "Edit Question" : "Add New Question"}
        <IconButton onClick={onClose} size="small" sx={{
          color: "#6b7280", opacity: 0.6, transition: "all 0.2s",
          "&:hover": { opacity: 1, transform: "rotate(90deg)" }
        }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: "24px !important", maxHeight: "70vh", overflowY: "auto", paddingRight: "4px" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* ── Question Text ── */}
          <TextField
            id="qm-question-text"
            label="Question Text"
            name="questionText"
            value={formData.questionText}
            onChange={handleChange}
            fullWidth required multiline rows={3} autoFocus
            InputProps={{ readOnly }}
            variant="outlined"
            error={!!errors.questionText}
            helperText={errors.questionText || (activeType === "fill" && !readOnly ? 'Tip: Use "____" to mark the blank position' : "")}
            sx={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", pointerEvents: readOnly ? "none" : "auto", "& .MuiInputBase-input": { color: "var(--text-primary)" } }}
          />

          {/* ── Age Group + Category row ── */}
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, borderBottom: "1px solid var(--border-light)", paddingBottom: "16px" }}>
            <FormControl fullWidth variant="outlined" error={!!errors.ageGroup} sx={{ pointerEvents: readOnly ? "none" : "auto" }}>
              <InputLabel id="qm-age-group-label">Age Group</InputLabel>
              <Select
                labelId="qm-age-group-label"
                id="qm-age-group"
                name="ageGroup"
                value={formData.ageGroup || ""}
                onChange={handleChange as any}
                label="Age Group"
                inputProps={{ readOnly }}
                sx={{ "& .MuiInputBase-input": { color: "var(--text-primary) !important" } }}
              >
                {AGE_GROUPS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
              {errors.ageGroup && <FormHelperText>{errors.ageGroup}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth variant="outlined" error={!!errors.category} sx={{ pointerEvents: readOnly ? "none" : "auto" }}>
              <InputLabel id="qm-category-label">Category</InputLabel>
              <Select
                labelId="qm-category-label"
                id="qm-category"
                name="category"
                value={formData.category || ""}
                onChange={handleChange as any}
                label="Category"
                inputProps={{ readOnly }}
                sx={{ "& .MuiInputBase-input": { color: "var(--text-primary) !important" } }}
              >
                {(currentCategories || []).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>
          </Box>

          {/* ── Question Type selector ── */}
          <Box sx={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px" }}>
            <FormControl fullWidth variant="outlined" error={!!errors.type} sx={{ pointerEvents: readOnly ? "none" : "auto" }}>
              <InputLabel id="qm-question-type-label">Question Type</InputLabel>
              <Select
                labelId="qm-question-type-label"
                id="qm-question-type"
                name="type"
                value={formData.type || ""}
                onChange={handleChange as any}
                label="Question Type"
                inputProps={{ readOnly }}
                sx={{ "& .MuiInputBase-input": { color: "var(--text-primary) !important" } }}
              >
                {QUESTION_TYPES.map((qt) => (
                  <MenuItem key={qt.value} value={qt.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>{qt.icon}</span>
                      <span>{qt.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            {/* Type helper text */}
            {activeType && !readOnly && (
              <Alert
                severity="info"
                icon={false}
                sx={{
                  mt: 1.5, borderRadius: "12px", py: 0.75, px: 2,
                  background: isDark ? "rgba(37,175,244,0.1)" : "#f0f9ff", border: isDark ? "1px solid rgba(37,175,244,0.2)" : "1px solid #e0f2fe",
                  "& .MuiAlert-message": { fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", color: isDark ? "#4da3ff" : "#0284c7" }
                }}
              >
                {typeConfig?.icon} {TYPE_HELPER[activeType]}
              </Alert>
            )}
          </Box>

          {/* ── Difficulty Selector ── */}
          <Box sx={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px" }}>
            <Typography sx={{
              fontFamily: "'Poppins', sans-serif",
              color: errors.difficulty ? "#FF5144" : "#6b7280",
              fontWeight: 500, fontSize: "0.875rem", mb: 1,
            }}>
              Difficulty Level
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: errors.difficulty ? 0.5 : 0 }}>
              {DIFFICULTIES.map((d) => {
                const isActive = activeDifficulty === d.value;
                return (
                  <Box
                    key={d.value}
                    onClick={() => handleDifficultyChange(d.value)}
                    sx={{
                      px: 2.5, py: 0.75, borderRadius: "999px",
                      border: `1px solid ${isActive ? d.color : (readOnly ? "var(--border-light)" : "var(--border-color)")}`,
                      background: isActive ? (isDark ? "rgba(37,175,244,0.15)" : "#eef6ff") : "transparent",
                      color: isActive ? d.color : (readOnly ? "var(--text-secondary)" : d.color),
                      fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.875rem",
                      cursor: readOnly ? "default" : "pointer", userSelect: "none",
                      transition: "all 0.2s ease",
                      display: "flex", alignItems: "center", gap: 0.75,
                      opacity: readOnly && !isActive ? 0.6 : 1,
                      "&:hover": readOnly ? {} : { transform: "scale(1.05)" }
                    }}
                  >
                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block", flexShrink: 0 }} />
                    {d.label}
                  </Box>
                );
              })}
            </Box>
            {errors.difficulty && (
              <FormHelperText sx={{ color: "#d32f2f", mx: 0, mt: 0.5 }}>{errors.difficulty}</FormHelperText>
            )}
          </Box>

          {/* ═══════════════════════════════════════════════════════════
              DYNAMIC OPTIONS SECTION — changes based on question type
             ══════════════════════════════════════════════════════════ */}

          {/* ── MCQ / Fill options ── */}
          {showOptions && (
            <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid var(--border-light)", background: "var(--bg-subtle)" }}>
              <Typography sx={{ mb: errors.options ? 0.5 : 1.5, color: "var(--text-primary)", fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", fontWeight: 600 }}>
                {activeType === "mcq" ? "🔘 Answer Options" : "✏️ Blank Options"}
              </Typography>
              <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontFamily: "'Poppins', sans-serif", fontSize: "0.78rem" }}>
                {activeType === "mcq"
                  ? "Add the possible answers. Select the correct one below."
                  : "Add options that will appear for the child to choose from."}
              </Typography>
              {errors.options && (
                <FormHelperText error sx={{ ml: 0, mb: 2, fontSize: "0.85rem" }}>{errors.options}</FormHelperText>
              )}

              <RadioGroup
                value={formData.correctAnswer || ""}
                onChange={(e) => handleCorrectAnswerSelect(e.target.value)}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {(formData.options || []).map((opt, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {!readOnly && (
                        <Radio
                          value={opt}
                          disabled={!opt.trim()}
                          size="small"
                          sx={{
                            color: "#d1d5db",
                            "&.Mui-checked": { color: "#8EE870" },
                            p: 0.5
                          }}
                        />
                      )}
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9ca3af", minWidth: "20px", fontSize: "0.85rem" }}>
                        {String.fromCharCode(65 + idx)}
                      </Typography>
                      <TextField
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        fullWidth size="small" placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        InputProps={{ readOnly }}
                        inputProps={{
                          id: `qm-option-${idx}`,
                          name: `option-${idx}`,
                          "aria-label": `Option ${String.fromCharCode(65 + idx)}`,
                        }}
                        sx={{
                          background: readOnly ? "transparent" : "var(--card-bg)",
                          pointerEvents: readOnly ? "none" : "auto",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "999px !important",
                            ...(formData.correctAnswer === opt && opt.trim() ? {
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#8EE870", borderWidth: "2px" }
                            } : {})
                          },
                          "& .MuiInputBase-input": { padding: "10px 16px", color: "var(--text-primary) !important" }
                        }}
                      />
                      {!readOnly && (formData.options || []).length > 3 && (
                        <IconButton onClick={() => handleRemoveOption(idx)} sx={{ color: "#FF5144", p: 0.5 }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              </RadioGroup>

              {!readOnly && (formData.options || []).length < 6 && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddOption}
                  sx={{ alignSelf: "flex-start", mt: 1.5, color: "#25AFF4", fontFamily: "'Poppins', sans-serif", fontWeight: 600, textTransform: "none" }}
                >
                  Add Option
                </Button>
              )}

              {/* Show selected correct answer label */}
              {formData.correctAnswer && (
                <Box sx={{ mt: 2, px: 2, py: 1, borderRadius: "12px", background: isDark ? "rgba(34,197,94,0.15)" : "#ecfdf5", border: isDark ? "1px solid rgba(34,197,94,0.3)" : "1px solid #d1fae5" }}>
                  <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", color: isDark ? "#4ade80" : "#059669", fontWeight: 500 }}>
                    ✓ Correct answer: <strong>{formData.correctAnswer}</strong>
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* ── Boolean selector ── */}
          {showBooleanSelector && (
            <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid var(--border-light)", background: "var(--bg-subtle)" }}>
              <Typography sx={{ mb: 1.5, color: "var(--text-primary)", fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", fontWeight: 600 }}>
                ✅ Select Correct Answer
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                {["True", "False"].map((val) => {
                  const isSelected = formData.correctAnswer === val;
                  return (
                    <Box
                      key={val}
                      onClick={() => handleCorrectAnswerSelect(val)}
                      sx={{
                        flex: 1, py: 2, borderRadius: "16px", textAlign: "center",
                        border: `2px solid ${isSelected ? (val === "True" ? "#8EE870" : "#FF5144") : "var(--border-color)"}`,
                        background: isSelected
                          ? (val === "True" ? (isDark ? "rgba(34,197,94,0.15)" : "#ecfdf5") : (isDark ? "rgba(239,68,68,0.15)" : "#fef2f2"))
                          : "var(--card-bg)",
                        cursor: readOnly ? "default" : "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": readOnly ? {} : {
                          borderColor: val === "True" ? "#8EE870" : "#FF5144",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                        }
                      }}
                    >
                      <Typography sx={{
                        fontFamily: "'Baloo 2', cursive", fontSize: "1.3rem", fontWeight: 700,
                        color: isSelected
                          ? (val === "True" ? (isDark ? "#4ade80" : "#16a34a") : (isDark ? "#f87171" : "#dc2626"))
                          : "var(--text-secondary)"
                      }}>
                        {val === "True" ? "✓" : "✗"} {val}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              {errors.correctAnswer && (
                <FormHelperText error sx={{ mt: 1 }}>{errors.correctAnswer}</FormHelperText>
              )}
            </Box>
          )}

          {/* ── Input type: only correct answer ── */}
          {showInputOnly && (
            <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid var(--border-light)", background: "var(--bg-subtle)" }}>
              <Typography sx={{ mb: 1.5, color: "var(--text-primary)", fontFamily: "'Baloo 2', cursive", fontSize: "1.15rem", fontWeight: 600 }}>
                ⌨️ Expected Answer
              </Typography>
              <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontFamily: "'Poppins', sans-serif", fontSize: "0.78rem" }}>
                The child's input will be compared case-insensitively with this answer.
              </Typography>
              <TextField
                id="qm-correct-answer"
                label="Correct Answer"
                name="correctAnswer"
                value={formData.correctAnswer}
                onChange={handleChange}
                fullWidth required
                placeholder="Type the exact correct answer"
                InputProps={{ readOnly }}
                variant="outlined"
                error={!!errors.correctAnswer}
                helperText={errors.correctAnswer}
                sx={{
                  pointerEvents: readOnly ? "none" : "auto",
                  "& .MuiOutlinedInput-root": { borderRadius: "999px !important" },
                  ...(readOnly && {
                    "& .MuiInputBase-input": { fontWeight: 500, color: "var(--text-primary) !important", cursor: "default" }
                  })
                }}
              />
            </Box>
          )}

          {/* ── Correct Answer field (for MCQ/Fill — shown as readonly confirmation) ── */}
          {!showInputOnly && !showBooleanSelector && activeType && (
            <TextField
              id="qm-correct-answer-display"
              label="Correct Answer"
              name="correctAnswer"
              value={formData.correctAnswer}
              onChange={handleChange}
              fullWidth required
              placeholder={showOptions ? "Select from options above" : "Type the exact correct answer"}
              InputProps={{ readOnly: readOnly || showOptions }}
              variant={readOnly || showOptions ? "filled" : "outlined"}
              error={!!errors.correctAnswer}
              helperText={errors.correctAnswer || (showOptions ? "Auto-filled when you select an option above" : "")}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "999px !important" },
                "& .MuiFilledInput-root": {
                  background: formData.correctAnswer ? (isDark ? "rgba(37,175,244,0.15)" : "#eef6ff") : "var(--bg-subtle)",
                  border: `1px solid ${formData.correctAnswer ? (isDark ? "rgba(37,175,244,0.3)" : "#dbeafe") : "var(--border-light)"}`,
                  cursor: "default",
                  "&:hover": { background: formData.correctAnswer ? (isDark ? "rgba(37,175,244,0.15)" : "#eef6ff") : "var(--bg-subtle)" }
                },
                "& .MuiInputBase-input": {
                  fontWeight: formData.correctAnswer ? 500 : 400,
                  color: formData.correctAnswer ? "#25AFF4" : "var(--text-secondary)",
                  cursor: "default"
                }
              }}
            />
          )}

          {/* ── No type selected yet ── */}
          {!activeType && (
            <Box sx={{ p: 3, borderRadius: "16px", border: "1px dashed var(--border-color)", background: "var(--bg-subtle)", textAlign: "center" }}>
              <Typography sx={{ color: "var(--text-secondary)", fontFamily: "'Poppins', sans-serif", fontSize: "0.85rem" }}>
                Select a question type above to see additional fields
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 2, px: 3, position: "sticky", bottom: 0, background: "var(--card-bg)",
        borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end", gap: "12px"
      }}>
        <Button onClick={onClose} sx={{
          color: "var(--text-secondary)", fontFamily: "'Poppins', sans-serif", fontWeight: 500,
          background: "transparent", textTransform: "none", px: 2,
          "&:hover": { background: "var(--bg-hover)", color: "var(--text-primary)" }
        }}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button
            onClick={handleSave} variant="contained"
            sx={{
              px: 3, py: 1, borderRadius: "999px",
              fontFamily: "'Baloo 2', cursive", fontSize: "1.1rem", fontWeight: 600,
              textTransform: "none", background: "#25AFF4", color: "#fff",
              transition: "all 0.2s ease",
              "&:hover": { transform: "translateY(-1px)", boxShadow: "0 6px 16px rgba(0,0,0,0.1)", background: "#1EA0E6" },
            }}
          >
            Save Question
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
