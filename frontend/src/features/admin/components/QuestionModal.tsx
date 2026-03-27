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
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
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

export default function QuestionModal({ open, onClose, onSave, initialData, readOnly = false }: Props) {
  const [formData, setFormData] = useState<Partial<PlacementQuestion>>({
    questionText: "",
    ageGroup: "5-6",
    category: "Nouns",
    questionType: "multiple choice",
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
        ageGroup: "5-6",
        category: "Nouns",
        questionType: "multiple choice",
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
      
      // If ageGroup changes, ensure category is valid for that ageGroup
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

  const handleSave = () => {
    if (readOnly) return;
    
    const newErrors: Record<string, string> = {};

    if (!formData.questionText?.trim()) {
      newErrors.questionText = "Question text is required.";
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

  const currentCategories = formData.ageGroup ? AGE_GROUP_CATEGORIES[formData.ageGroup] : [];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm" 
      disableRestoreFocus 
      disableEnforceFocus 
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
        {readOnly ? "View Question" : initialData ? "Edit Question" : "Add New Question"}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ borderBottom: "none", borderTop: "1px solid #f0f0f0" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          
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
          />

          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
            <TextField
              select
              label="Age Group"
              name="ageGroup"
              value={formData.ageGroup}
              onChange={handleChange}
              fullWidth
              InputProps={{ readOnly }}
              variant={readOnly ? "filled" : "outlined"}
            >
              {AGE_GROUPS.map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
              InputProps={{ readOnly }}
              variant={readOnly ? "filled" : "outlined"}
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
            value={formData.questionType}
            onChange={handleChange}
            fullWidth
            InputProps={{ readOnly }}
            variant={readOnly ? "filled" : "outlined"}
          >
            {QUESTION_TYPES.map((qt) => (
              <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>
            ))}
          </TextField>

          {formData.questionType === "multiple choice" && (
            <Box sx={{ background: "#f8fafc", p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" sx={{ mb: errors.options ? 0.5 : 2, color: "#475569", fontWeight: 600 }}>
                Multiple Choice Options
              </Typography>
              {errors.options && (
                <FormHelperText error sx={{ ml: 0, mb: 2, fontSize: "0.85rem" }}>
                  {errors.options}
                </FormHelperText>
              )}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {(formData.options || ["", "", "", ""]).map((opt, idx) => (
                  <TextField
                    key={idx}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    fullWidth
                    size="small"
                    placeholder={`Option ${idx + 1}`}
                    InputProps={{ readOnly }}
                    sx={{ 
                      background: readOnly ? "transparent" : "#fff",
                      "& .MuiOutlinedInput-root": { borderRadius: "24px" }
                    }}
                  />
                ))}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "24px" } }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3 }}>
        <Button onClick={onClose} sx={{ color: "#64748b", fontWeight: 600 }}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ px: 4, py: 1, borderRadius: "24px", fontWeight: 600, boxShadow: "none" }}
          >
            Save Question
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
