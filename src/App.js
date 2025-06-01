import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
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
      default: "#23272e",  // Or any deep gray you prefer
      paper: "#fff"
    },
    primary: {
      main: "#283593",
    },
    secondary: {
      main: "#ff7043",
    },
    //text: {
    //  primary: "#f8f9fa",  // Optionally lighten the main text on dark bg
    //  secondary: "#bbb",   // Softer secondary text
    //},
  },  
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: `"Inter", "Helvetica Neue", Arial, sans-serif`,
    h4: { fontWeight: 700 },
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

function ResponsiveHeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        py: isMobile ? 2 : 3,
        mb: isMobile ? 2 : 4,
        background: "#fff",
        boxShadow: "0 2px 8px 0 rgba(40,53,147,0.03)",
        borderBottom: "1px solid #e0e3e7"
      }}
    >
      <Container maxWidth="md">
        <Stack
          direction={isMobile ? "column" : "row"}
          alignItems={isMobile ? "flex-start" : "center"}
          justifyContent="space-between"
          spacing={isMobile ? 1 : 0}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              letterSpacing: "-1px",
              display: "flex",
              alignItems: "center",
              fontSize: isMobile ? "2rem" : "2.5rem"
            }}
          >
            <span
              role="img"
              aria-label="wine"
              style={{
                fontSize: isMobile ? "2rem" : "2.2rem",
                marginRight: isMobile ? 8 : 12,
                marginBottom: isMobile ? 0 : 4
              }}
            >
              🍷
            </span>
            Blind Tasting
          </Typography>
          <Box
            sx={{
              mt: isMobile ? 1 : 0,
              ml: isMobile ? 0 : 2,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center"
            }}
          >
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: "#283593",
                marginRight: isMobile ? 0 : 18,
                fontWeight: 500,
                marginBottom: isMobile ? 4 : 0,
                fontSize: "1.07rem"
              }}
            >
              Home
            </Link>
            <Link
              to="/my-tastings"
              style={{
                textDecoration: "none",
                color: "#283593",
                fontWeight: 500,
                fontSize: "1.07rem"
              }}
            >
              My Tastings
            </Link>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ResponsiveHeader />
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
