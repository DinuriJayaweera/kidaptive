import React, { useState, useEffect } from "react";
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
  Zoom,
} from "@mui/material";
import { Close as CloseIcon, DeleteOutline as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import type { PlacementQuestion } from "../api/placementApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: (data: Partial<PlacementQuestion>) => void;
  initialData?: PlacementQuestion | null;
  readOnly?: boolean;
}

export const AGE_GROUP_CATEGORIES: Record<string, string[]> = {
  "5-6": ["Nouns", "Verbs", "Pronouns", "Singular/Plural", "Capital Letters"],
  "7-8": ["Nouns", "Verbs", "Pronouns", "Adjectives", "Articles", "Singular/Plural", "Punctuation", "Simple Tenses"],
  "9-10": ["Nouns", "Verbs", "Pronouns", "Adjectives", "Articles", "Tenses", "Prepositions", "Conjunctions", "Punctuation"]
};
export const AGE_GROUPS = Object.keys(AGE_GROUP_CATEGORIES);
export const ALL_CATEGORIES = Array.from(new Set(Object.values(AGE_GROUP_CATEGORIES).flat()));

export const QUESTION_TYPES = [
  { value: "text entering", label: "Text Entering" },
  { value: "multiple choice", label: "Multiple Choice" },
  { value: "tf", label: "True / False" }
];

const DIFFICULTIES: { value: PlacementQuestion["difficulty"]; label: string; color: string; bg: string; border: string; activeBg: string; activeText: string }[] = [
  { value: "easy", label: "Easy", color: "#8EE870", bg: "#f0fdf4", border: "#eee", activeBg: "#16a34a", activeText: "#fff" },
  { value: "medium", label: "Medium", color: "#FFCC35", bg: "#fffbeb", border: "#eee", activeBg: "#d97706", activeText: "#fff" },
  { value: "hard", label: "Hard", color: "#FF5144", bg: "#fff1f2", border: "#eee", activeBg: "#ef4444", activeText: "#fff" },
];

export default function QuestionModal({ open, onClose, onSave, initialData, readOnly = false }: Props) {
  const [formData, setFormData] = useState<Partial<PlacementQuestion>>({
    questionText: "",
    ageGroup: "",
    category: "",
    questionType: "",
    difficulty: "" as any,
    options: ["", "", "", ""],
    correctAnswer: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        questionText: "",
        ageGroup: "",
        category: "",
        questionType: "",
        difficulty: "" as any,
        options: ["", "", "", ""],
        correctAnswer: "",
      });
    }
    setErrors({});
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "ageGroup") {
        const allowedCategories = AGE_GROUP_CATEGORIES[value] || [];
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
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
    setErrors((prev) => ({ ...prev, options: "" }));
  };

  const handleAddOption = () => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, options: [...(prev.options || []), ""] }));
  };

  const handleRemoveOption = (index: number) => {
    if (readOnly) return;
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const handleDifficultyChange = (value: PlacementQuestion["difficulty"]) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, difficulty: value }));
  };

  const handleSave = () => {
    if (readOnly) return;

    const newErrors: Record<string, string> = {};

    if (!formData.questionText?.trim()) {
      newErrors.questionText = "Question text is required.";
    }
    if (!formData.ageGroup) {
      newErrors.ageGroup = "Age group is required.";
    }
    if (!formData.category) {
      newErrors.category = "Category is required.";
    }
    if (!formData.questionType) {
      newErrors.questionType = "Question type is required.";
    }
    if (!formData.difficulty) {
      newErrors.difficulty = "Difficulty level is required.";
    }
    if (!formData.correctAnswer?.trim()) {
      newErrors.correctAnswer = "Correct answer is required.";
    }

    if (formData.questionType === "multiple choice") {
      const validOptions = (formData.options || []).filter(o => o.trim() !== "");
      if (validOptions.length < 2) {
        newErrors.options = "Multiple choice questions require at least two options.";
      } else if (formData.correctAnswer?.trim()) {
        const correct = formData.correctAnswer.trim();
        if (!validOptions.some(opt => opt.trim() === correct)) {
          newErrors.correctAnswer = "Correct answer must exactly match one of the provided options.";
        }
      }
    }

    if (formData.questionType === "tf" && formData.correctAnswer?.trim()) {
      const correctLower = formData.correctAnswer.trim().toLowerCase();
      if (correctLower !== "true" && correctLower !== "false") {
        newErrors.correctAnswer = "Correct answer must be exactly 'True' or 'False'.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSave) {
      onSave(formData);
    }
  };

  const currentCategories = formData.ageGroup ? AGE_GROUP_CATEGORIES[formData.ageGroup] : ALL_CATEGORIES;
  const activeDifficulty = formData.difficulty || "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Zoom}
      disableRestoreFocus
      disableEnforceFocus
      PaperProps={{
        sx: {
          maxWidth: "700px",
          width: "90%",
          borderRadius: "16px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
          // The Zoom transition natively handles the scale/opacity animation elegantly!
        }
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          fontFamily: "'Poppins', sans-serif",
          borderRadius: "999px !important",
          background: "#fff",
          transition: "all 0.2s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#e5e7eb",
            borderRadius: "999px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#cbd5f5",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#25AFF4",
            borderWidth: "1px",
            boxShadow: "0 0 0 3px rgba(59,130,246,0.1)",
          },
          "&.MuiInputBase-multiline": {
            borderRadius: "20px",
            padding: "8px", // inner input scaling
          }
        },
        "& .MuiInputLabel-root": {
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          color: "#6b7280",
          transform: "translate(16px, 14px) scale(1)",
          "&.MuiInputLabel-shrink": {
            transform: "translate(14px, -9px) scale(0.75)"
          }
        },
        "& .MuiInputBase-input": {
          fontFamily: "'Poppins', sans-serif",
          padding: "12px 16px",
        },
        "& .MuiFormHelperText-root": {
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12px",
          marginTop: "4px",
          "&.Mui-error": {
            color: "#ef4444",
          }
        },
        "& .MuiFilledInput-root": {
          backgroundColor: "#f9fafb",
          border: "1px solid #f1f5f9",
          borderRadius: "999px !important",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
          padding: "4px 0",
          fontFamily: "'Poppins', sans-serif",
          cursor: "default",
          "&:before, &:after": {
            display: "none",
          },
          "&.MuiInputBase-multiline": {
            backgroundColor: "#f3f4f6", // slightly darker for Question box
            borderRadius: "20px",
            padding: "8px",
          },
          "&:hover": {
            backgroundColor: "#f9fafb", // prevent hover effect
          },
          "&.MuiInputBase-multiline:hover": {
            backgroundColor: "#f3f4f6",
          }
        },
        "& .MuiSelect-select.MuiFilledInput-input": {
          cursor: "default",
          "&:focus": { backgroundColor: "transparent" }
        },
        "& .MuiSelect-icon": {
          display: readOnly ? "none" : "block"
        }
      }}
    >
      <DialogTitle sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "'Baloo 2', cursive",
        fontWeight: 600,
        fontSize: "20px",
        color: "#111827",
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 10,
        paddingBottom: "10px",
        marginBottom: "16px",
        borderBottom: "1px solid #f0f0f0"
      }}>
        {readOnly ? "View Question" : initialData ? "Edit Question" : "Add New Question"}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#6b7280",
            opacity: 0.6,
            transition: "all 0.2s",
            "&:hover": { opacity: 1, transform: "rotate(90deg)" }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        pt: "24px !important",
        maxHeight: "70vh",
        overflowY: "auto",
        paddingRight: "4px"
      }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

          <TextField
            label="Question Text"
            name="questionText"
            value={formData.questionText}
            onChange={handleChange}
            fullWidth
            required
            multiline
            rows={3}
            autoFocus
            InputProps={{ readOnly }}
            variant={readOnly ? "filled" : "outlined"}
            error={!!errors.questionText}
            helperText={errors.questionText}
            sx={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}
          />

          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
            <TextField
              select
              label="Age Group"
              name="ageGroup"
              value={formData.ageGroup || ""}
              onChange={handleChange}
              fullWidth
              InputProps={{ readOnly }}
              variant={readOnly ? "filled" : "outlined"}
              error={!!errors.ageGroup}
              helperText={errors.ageGroup}
            >
              {AGE_GROUPS.map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Category"
              name="category"
              value={formData.category || ""}
              onChange={handleChange}
              fullWidth
              InputProps={{ readOnly }}
              variant={readOnly ? "filled" : "outlined"}
              error={!!errors.category}
              helperText={errors.category}
            >
              {(currentCategories || []).map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            select
            label="Question Type"
            name="questionType"
            value={formData.questionType || ""}
            onChange={handleChange}
            fullWidth
            InputProps={{ readOnly }}
            variant={readOnly ? "filled" : "outlined"}
            error={!!errors.questionType}
            helperText={errors.questionType}
            sx={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}
          >
            {QUESTION_TYPES.map((qt) => (
              <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>
            ))}
          </TextField>

          {/* ── Difficulty Selector ── */}
          <Box sx={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: errors.difficulty ? "#FF5144" : "#6b7280",
                fontWeight: 500,
                fontSize: "0.875rem",
                mb: 1,
                display: "block"
              }}
            >
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
                      px: 2.5,
                      py: 0.75,
                      borderRadius: "999px",
                      border: `1px solid ${isActive ? d.color : (readOnly ? "#e2e8f0" : d.border)}`,
                      background: isActive ? "#eef6ff" : "transparent",
                      color: isActive ? d.color : (readOnly ? "#94a3b8" : d.color),
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: readOnly ? "default" : "pointer",
                      userSelect: "none",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      opacity: readOnly && !isActive ? 0.6 : 1, // Keep slightly visible in view mode
                      "&:hover": readOnly ? {} : {
                        transform: "scale(1.05)",
                      }
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: d.color,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {d.label}
                  </Box>
                );
              })}
            </Box>
            {errors.difficulty && (
              <FormHelperText sx={{ color: "#d32f2f", mx: 0, mt: 0.5 }}>
                {errors.difficulty}
              </FormHelperText>
            )}
          </Box>

          {formData.questionType === "multiple choice" && (
            <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid #eee", background: "#fafafa" }}>
              <Typography sx={{ mb: errors.options ? 0.5 : 2, color: "#111827", fontFamily: "'Baloo 2', cursive", fontSize: "1.2rem", fontWeight: 600 }}>
                Multiple Choice Options
              </Typography>
              {errors.options && (
                <FormHelperText error sx={{ ml: 0, mb: 2, fontSize: "0.85rem" }}>
                  {errors.options}
                </FormHelperText>
              )}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {(formData.options || []).map((opt, idx) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9ca3af", minWidth: "24px" }}>
                      {String.fromCharCode(65 + idx)} {/* A, B, C... */}
                    </Typography>
                    <TextField
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      fullWidth
                      size="small"
                      placeholder={`Option content`}
                      InputProps={{ readOnly }}
                      sx={{
                        background: readOnly ? "transparent" : "#fff",
                        "& .MuiOutlinedInput-root": { borderRadius: "999px !important" },
                        "& .MuiInputBase-input": { padding: "10px 16px" }
                      }}
                    />
                    {!readOnly && (
                      <IconButton onClick={() => handleRemoveOption(idx)} sx={{ color: "#FF5144" }}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                {!readOnly && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddOption}
                    sx={{
                      alignSelf: "flex-start",
                      mt: 1,
                      color: "#25AFF4",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 600,
                      textTransform: "none"
                    }}
                  >
                    Add Option
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {formData.questionType === "tf" && !readOnly && (
            <Typography variant="caption" sx={{ color: "#718096" }}>
              Note: For True/False, write "True" or "False" in the Correct Answer box.
            </Typography>
          )}

          <TextField
            label="Correct Answer"
            name="correctAnswer"
            value={formData.correctAnswer}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Type the exact correct answer"
            InputProps={{ readOnly }}
            variant={readOnly ? "filled" : "outlined"}
            error={!!errors.correctAnswer}
            helperText={errors.correctAnswer}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: "999px !important" },
              ...(readOnly && {
                "& .MuiFilledInput-root": {
                  background: "#eef6ff",
                  border: "1px solid #dbeafe",
                  cursor: "default",
                  "&:hover": { background: "#eef6ff" }
                },
                "& .MuiInputBase-input": {
                  fontWeight: 500,
                  color: "#25AFF4",
                  cursor: "default"
                }
              })
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 2,
        px: 3,
        position: "sticky",
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #eee",
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px"
      }}>
        <Button onClick={onClose} sx={{
          color: "#9ca3af", // secondary style, lighter
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          background: "transparent",
          textTransform: "none",
          px: 2,
          "&:hover": { background: "#f3f4f6", color: "#6b7280" }
        }}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              px: 3,
              py: 1,
              borderRadius: "999px",
              fontFamily: "'Baloo 2', cursive",
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "none",
              background: "#25AFF4",
              color: "#fff",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                background: "#1EA0E6",
              },
            }}
          >
            Save Question
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
