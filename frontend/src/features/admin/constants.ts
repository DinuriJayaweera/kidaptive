import type { QuestionType } from "./api/placementApi";

export const AGE_GROUPS = ["5-6", "7-8", "9-10"];

export const QUESTION_TYPES: { value: QuestionType; label: string; icon: string; helper: string }[] = [
  { value: "mcq", label: "Multiple Choice", icon: "🔘", helper: "Add multiple answer options" },
  { value: "fill", label: "Fill in the Blank", icon: "✏️", helper: "Use ____ in your question" },
  { value: "input", label: "Text Input", icon: "⌨️", helper: "Child will type the answer" },
  { value: "boolean", label: "True / False", icon: "✅", helper: "True or False question" },
];
