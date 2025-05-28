import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
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

  const tastingLink = createdTasting ? `${window.location.origin}/join/${createdTasting}` : "";

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 3, sm: 8 }, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4 }}>
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

              {/* Create New Tasting Section */}
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

              {/* Share Tasting QR */}
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
                    {tastingLink}
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
    </Container>
  );
}

export default Home;
