import React, { useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider, CssBaseline, useTheme } from "@mui/material";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { QRCodeCanvas } from "qrcode.react";
import Home from "./Home";
import JoinTasting from "./JoinTasting";
import Results from "./Results";
import FinalResults from "./FinalResults";
import MyTastings from "./MyTastings";
import { lightTheme, darkTheme } from "./themes"; // <-- import your themes

function ResponsiveHeader({ darkMode, setDarkMode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [qrOpen, setQROpen] = useState(false);

  // Set your public home URL here for QR code (can be window.location.origin if you always deploy at root)
  const homeUrl = "https://tasting.hallofmirth.us/";

  const handleOpenQR = () => setQROpen(true);
  const handleCloseQR = () => setQROpen(false);

  return (
    <>
      <Box
        sx={{
          py: isMobile ? 2 : 3,
          mb: isMobile ? 2 : 4,
          background: theme.palette.background.paper,
          boxShadow: "0 2px 8px 0 rgba(40,53,147,0.03)",
          borderBottom: `1px solid ${theme.palette.divider}`
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
                  color: theme.palette.primary.main,
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
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  fontSize: "1.07rem"
                }}
              >
                My Tastings
              </Link>
              {/* Share Home QR Icon */}
              <Tooltip title="Share Home Page">
                <IconButton
                  onClick={handleOpenQR}
                  size="large"
                  sx={{ ml: isMobile ? 0 : 2, color: theme.palette.primary.main }}
                  color="primary"
                  aria-label="Share home page QR"
                >
                  <QrCode2Icon />
                </IconButton>
              </Tooltip>
              {/* Toggle theme button */}
              <button
                style={{
                  marginLeft: isMobile ? 0 : 18,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: theme.palette.primary.main,
                  fontSize: 22
                }}
                onClick={() => setDarkMode((d) => !d)}
                aria-label="Toggle dark mode"
                title="Toggle dark/light mode"
              >
                {darkMode ? "🌙" : "☀️"}
              </button>
            </Box>
          </Stack>
        </Container>
      </Box>
      {/* Home Page QR Dialog */}
      <Dialog open={qrOpen} onClose={handleCloseQR}>
        <DialogTitle>Share Home Page</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <QRCodeCanvas value={homeUrl} size={170} />
          <Typography
            variant="body2"
            sx={{ mt: 2, mb: 1, wordBreak: "break-all", color: "primary.main" }}
          >
            {homeUrl}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
            onClick={() => {
              navigator.clipboard.writeText(homeUrl);
            }}
          >
            Copy Link
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function App() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = useState(prefersDark);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ResponsiveHeader darkMode={darkMode} setDarkMode={setDarkMode} />
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
