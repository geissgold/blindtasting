// src/themes.js
import { createTheme } from "@mui/material/styles";

// Light Theme
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f6f7f9",
      paper: "#fff"
    },
    primary: { main: "#283593" },
    secondary: { main: "#ff7043" },
    text: {
      primary: "#18181a",
      secondary: "#43444c",
    }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: `"Inter", "Helvetica Neue", Arial, sans-serif`,
    h4: { fontWeight: 700 },
    h5: { fontWeight: 500 },
    button: { textTransform: "none" }
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 14, fontWeight: 500 } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 18 } } },
    MuiTextField: { styleOverrides: { root: { marginBottom: 20 } } }
  }
});

// Dark Theme
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#23272e",
      paper: "#282c34"
    },
    primary: { main: "#90caf9" },
    secondary: { main: "#ffb74d" },
    text: {
      primary: "#fff",
      secondary: "#adb5bd",
    }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: `"Inter", "Helvetica Neue", Arial, sans-serif`,
    h4: { fontWeight: 700 },
    h5: { fontWeight: 500 },
    button: { textTransform: "none" }
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 14, fontWeight: 500 } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 18 } } },
    MuiTextField: { styleOverrides: { root: { marginBottom: 20 } } }
  }
});
