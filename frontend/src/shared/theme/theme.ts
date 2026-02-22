import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    typography: {
        fontFamily: ["Poppins", "Roboto", "sans-serif"].join(","),
    },
    shape: {
        borderRadius: 16,
    },
});