import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Home from "./Home";
import JoinTasting from "./JoinTasting";
import Results from "./Results";
import FinalResults from "./FinalResults";
import MyTastings from "./MyTastings";

// ---- Custom Minimalist Theme ----
const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f8f9fa",
      paper: "#fff"
    },
    primary: {
      main: "#283593",
    },
    secondary: {
      main: "#ff7043",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#555",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: `"Inter", "Helvetica Neue", Arial, sans-serif`,
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    button: { textTransform: "none" }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 14, boxShadow: "none", fontWeight: 500 }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 18 }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: { marginBottom: 20 }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* Minimal header, always visible */}
        <Box
          sx={{
            py: 3,
            mb: 4,
            background: "#fff",
            boxShadow: "0 2px 8px 0 rgba(40,53,147,0.03)",
            borderBottom: "1px solid #e0e3e7"
          }}
        >
          <Container maxWidth="md">
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  letterSpacing: "-1px"
                }}
              >
                Blind Tasting <span role="img" aria-label="cheers">🍷</span>
              </Typography>
              <Box>
                {/* Minimal navigation, add more as needed */}
                <Link to="/" style={{ textDecoration: "none", color: "#283593", marginRight: 18, fontWeight: 500 }}>
                  Home
                </Link>
                <Link to="/my-tastings" style={{ textDecoration: "none", color: "#283593", fontWeight: 500 }}>
                  My Tastings
                </Link>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Main page content */}
        <Container maxWidth="md">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join/:tastingId" element={<JoinTasting />} />
            <Route path="/results/:tastingId" element={<Results />} />
            <Route path="/final/:tastingId" element={<FinalResults />} />
            <Route path="/my-tastings" element={<MyTastings />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
