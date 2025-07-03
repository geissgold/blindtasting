import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut, sendSignInLinkToEmail } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [tastingName, setTastingName] = useState("");
  const [user, setUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [numItems, setNumItems] = useState("");
  const [createdTasting, setCreatedTasting] = useState(null);

  // Email link state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // --- Magic Link Auth handlers ---
  const handleSendMagicLink = async () => {
    setEmailStatus("");
    setEmailError("");
    try {
      if (!email || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
        setEmailError("Please enter a valid email.");
        return;
      }
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: true
      });
      window.localStorage.setItem("emailForSignIn", email);
      setEmailStatus("Magic link sent! Check your email.");
      setEmail("");
    } catch (error) {
      setEmailError(error.message);
    }
  };

  const handleCreateTasting = async (e) => {
    e.preventDefault();
    if (!numItems || isNaN(numItems) || parseInt(numItems) < 1) {
      alert("Enter a valid number of items.");
      return;
    }
    if (!tastingName.trim()) {
      alert("Please enter a name for the tasting.");
      return;
    }
    setCreating(true);
    try {
      const num = parseInt(numItems);
      const docRef = await addDoc(collection(db, "tastings"), {
        name: tastingName,
        createdBy: user.uid,
        createdByName: user.displayName,
        numItems: num,
        itemNames: Array(num).fill(""),
        createdAt: serverTimestamp(),
        status: "open"
      });
      setCreatedTasting(docRef.id);
      setNumItems("");
      setTastingName("");
    } catch (error) {
      alert("Error creating tasting: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const tastingLink = createdTasting ? `https://tasting.hallofmirth.us/join/${createdTasting}` : "";

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 3, sm: 8 }, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Box>
          {!user ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                Blind Tasting
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleLogin}
                sx={{ borderRadius: 2, fontWeight: 600, px: 4, py: 1.2 }}
              >
                Sign in with Google
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => setEmailDialogOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 600, px: 4, py: 1.2, ml: 2, mt: { xs: 2, sm: 0 } }}
              >
                Sign in with Email
              </Button>
              <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
                <DialogTitle>
                  Sign in with Email
                  <IconButton
                    aria-label="close"
                    onClick={() => setEmailDialogOpen(false)}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      color: (theme) => theme.palette.grey[500]
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pb: 1 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
                    After clicking the button below, check your inbox for a "magic link." To complete sign-in, open that link in the <strong>same browser you used to request it</strong>. In-app email viewers or a different browser might not work properly.
                  </Typography>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ my: 2 }}
                    error={!!emailError}
                    helperText={emailError}
                    autoFocus
                  />
                  {emailStatus && (
                    <Typography variant="body2" color="success.main">
                      {emailStatus}
                    </Typography>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleSendMagicLink} variant="contained">
                    Send Magic Link
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          ) : (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                mb={3}
                flexWrap="wrap"
              >
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Welcome, {user.displayName}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleLogout}
                    sx={{ borderRadius: 2 }}
                  >
                    Sign Out
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => navigate("/my-tastings")}
                    sx={{ fontWeight: 500 }}
                  >
                    My Tastings
                  </Button>
                </Stack>
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Create a New Tasting
              </Typography>
              <Box
                component="form"
                autoComplete="off"
                onSubmit={handleCreateTasting}
                sx={{ mb: 3 }}
              >
                <TextField
                  label="Tasting Name"
                  value={tastingName}
                  onChange={(e) => setTastingName(e.target.value)}
                  fullWidth
                  margin="normal"
                  size="medium"
                  inputProps={{ maxLength: 50 }}
                />
                <TextField
                  label="Number of Items"
                  type="number"
                  value={numItems}
                  onChange={(e) => setNumItems(e.target.value)}
                  fullWidth
                  margin="normal"
                  size="medium"
                  inputProps={{ min: 1, max: 30 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{ mt: 3, borderRadius: 2, fontWeight: 600, py: 1.2 }}
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </Box>
              {createdTasting && (
                <Box mt={4} textAlign="center">
                  <Typography variant="subtitle1" gutterBottom>
                    Share this code with tasters:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {createdTasting}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Or share this link:
                  </Typography>
                  <Typography variant="body2" gutterBottom sx={{ wordBreak: "break-all" }}>
                    <a
                      href={tastingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1976d2",
                        textDecoration: "underline",
                        wordBreak: "break-all",
                        fontWeight: 500,
                      }}
                    >
                      {tastingLink}
                    </a>
                  </Typography>
                  <Box mt={2} display="flex" justifyContent="center">
                    <QRCodeCanvas value={tastingLink} size={128} />
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
          mb: 1,
          opacity: 0.7,
          position: { xs: 'static', sm: 'static' },
          width: '100%',
        }}
      >
        <a
          href="https://ko-fi.com/X8X3DMF7V"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block' }}
        >
          <img
            height="36"
            style={{ border: 0, height: 36, boxShadow: "none" }}
            src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
            alt="Buy Me a Coffee at ko-fi.com"
          />
        </a>
      </Box>
    </Container>
  );
}

export default Home;
