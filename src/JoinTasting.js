import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

function JoinTasting() {
  const { tastingId } = useParams();
  const [tasting, setTasting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSignInAttempted, setAutoSignInAttempted] = useState(false);

  // Get signed-in user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Try to auto-sign-in if not already signed in, but only once
  useEffect(() => {
    if (!user && !autoSignInAttempted) {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider).catch(() => {});
      setAutoSignInAttempted(true);
    }
  }, [user, autoSignInAttempted]);

  // Fetch tasting info
  useEffect(() => {
    async function fetchTasting() {
      try {
        const docRef = doc(db, "tastings", tastingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTasting(docSnap.data());
        } else {
          setTasting(null);
        }
      } catch (error) {
        setTasting(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTasting();
  }, [tastingId]);

  // Fetch user's existing responses if any
  useEffect(() => {
    async function fetchResponse() {
      if (!user || !tasting) return;
      const responseRef = doc(db, "tastings", tastingId, "responses", user.uid);
      const responseSnap = await getDoc(responseRef);
      if (responseSnap.exists()) {
        const data = responseSnap.data();
        setRatings(data.ratings || Array(tasting.numItems).fill(5));
        setNotes(data.notes || Array(tasting.numItems).fill(""));
      } else {
        setRatings(Array(tasting.numItems).fill(5));
        setNotes(Array(tasting.numItems).fill(""));
      }
    }
    fetchResponse();
    // eslint-disable-next-line
  }, [user, tasting]);

  if (loading) return <Container><CircularProgress /></Container>;
  if (!tasting) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Tasting not found!
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Alert severity="info" sx={{ my: 4 }}>
          Please sign in with Google to join this tasting.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider).catch(() => {});
          }}
        >
          Sign in with Google
        </Button>
      </Container>
    );
  }
  

  const handleSliderChange = (idx, value) => {
    const newRatings = [...ratings];
    newRatings[idx] = value;
    setRatings(newRatings);
    setSaved(false);
  };

  const handleNotesChange = (idx, value) => {
    const newNotes = [...notes];
    newNotes[idx] = value;
    setNotes(newNotes);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const responseRef = doc(db, "tastings", tastingId, "responses", user.uid);
      await setDoc(responseRef, {
        ratings,
        notes,
        displayName: user.displayName,
        submittedAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (error) {
      alert("Failed to save ratings: " + error.message);
    }
    setSaving(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Blind Tasting: Rate Each Item
      </Typography>
      <Typography>
        Hello <b>{user.displayName}</b>! There are <b>{tasting.numItems}</b> items to taste.
      </Typography>
      <Box mt={3}>
        {Array.from({ length: tasting.numItems }).map((_, idx) => (
          <Box key={idx} my={4} p={2} border={1} borderRadius={2} borderColor="grey.300">
            <Typography variant="h6">Item {idx + 1}</Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography sx={{ minWidth: 100 }}>Rating:</Typography>
              <Slider
                value={ratings[idx] || 5}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                onChange={(_, value) => handleSliderChange(idx, value)}
                sx={{ width: 180, mx: 2 }}
              />
              <Typography>{ratings[idx] || 5}</Typography>
            </Box>
            <TextField
              label="Your notes (private)"
              multiline
              fullWidth
              minRows={2}
              value={notes[idx] || ""}
              onChange={(e) => handleNotesChange(idx, e.target.value)}
              sx={{ mt: 1 }}
            />
          </Box>
        ))}
      </Box>
      <Box mt={3} display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save My Ratings"}
        </Button>
      </Box>
      {saved && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Your ratings and notes have been saved!
        </Alert>
      )}
    </Container>
  );
}

export default JoinTasting;
