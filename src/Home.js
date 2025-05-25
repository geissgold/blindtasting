import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

function Home() {
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

  const handleCreateTasting = async () => {
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
    <Container maxWidth="sm" style={{ marginTop: 40 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Blind Tasting App
      </Typography>
      <Box my={4}>
        {!user ? (
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Sign in with Google
          </Button>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Welcome, {user.displayName}
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
            <Button variant="text" onClick={() => navigate("/my-tastings")}>
              My Tastings
            </Button>
            <Box mt={4}>
              <Typography variant="h5">Create a New Tasting Event</Typography>
              <TextField
                label="Tasting Name"
                value={tastingName}
                onChange={(e) => setTastingName(e.target.value)}
                size="small"
                style={{ marginRight: 8 }}
              />
              <Box display="flex" alignItems="center" mt={2}>
                <TextField
                  label="Number of Items"
                  type="number"
                  value={numItems}
                  onChange={(e) => setNumItems(e.target.value)}
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateTasting}
                  disabled={creating}
                >
                  {creating ? "CREATING..." : "CREATE"}
                </Button>
              </Box>
              {createdTasting && (
                <Box mt={4} textAlign="center">
                  <Typography variant="subtitle1" gutterBottom>
                    Share this code with tasters:
                  </Typography>
                  <Typography variant="h6" color="primary">{createdTasting}</Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Or share this link:
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {tastingLink}
                  </Typography>
                  <Box mt={2} display="flex" justifyContent="center">
                    <QRCodeCanvas value={tastingLink} size={128} />
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

export default Home;
