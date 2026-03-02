import { TextField, styled } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

const StyledTextField = styled(TextField)(({ error }) => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "9999px",
        backgroundColor: "#f8fafc",
        transition: "all 0.25s ease-in-out",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",

        "& fieldset": {
            borderColor: error ? "#e74c3c" : "rgba(0,0,0,0.08)",
            borderWidth: "1.5px",
            transition: "all 0.25s ease-in-out",
        },

        "&:hover": {
            backgroundColor: "#f0f6ff",
            transform: "translateY(-1px)",
            boxShadow: "0 3px 12px rgba(58,181,230,0.08)",
            "& fieldset": {
                borderColor: error ? "#e74c3c" : "rgba(58,181,230,0.4)",
            },
        },

        "&.Mui-focused": {
            backgroundColor: "#fff",
            transform: "translateY(-1px)",
            boxShadow: error
                ? "0 0 0 3px rgba(231,76,60,0.15), 0 4px 16px rgba(231,76,60,0.08)"
                : "0 0 0 3px rgba(58,181,230,0.18), 0 4px 16px rgba(58,181,230,0.08)",
            "& fieldset": {
                borderColor: error ? "#e74c3c" : "#3ab5e6",
                borderWidth: "1.5px",
            },
        },

        "&.Mui-disabled": {
            backgroundColor: "#f0f0f0",
            opacity: 0.7,
            "& fieldset": { borderColor: "rgba(0,0,0,0.06)" },
        },
    },

    "& .MuiInputLabel-root": {
        fontWeight: 500,
        "&.Mui-focused": {
            color: error ? "#e74c3c" : "#3ab5e6",
        },
    },

    "& .MuiFormHelperText-root": {
        marginLeft: 16,
        fontWeight: 500,
    },
}));

export default function RoundedInput(props: TextFieldProps) {
    return <StyledTextField fullWidth variant="outlined" {...props} />;
}
