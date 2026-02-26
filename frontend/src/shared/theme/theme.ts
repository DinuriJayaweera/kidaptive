import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    typography: {
        fontFamily: ["Poppins", "sans-serif"].join(","),
        h1: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 900 },
        h2: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 900 },
        h3: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 },
        h4: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 },
        h5: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 },
        h6: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 },
    },
    shape: {
        borderRadius: 16,
    },
});