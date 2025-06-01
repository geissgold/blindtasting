import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Fade from "@mui/material/Fade";
import { useTheme } from "@mui/material/styles"; // <-- add this

function JoinTasting() {
  const { tastingId } = useParams();
  const [user, setUser] = useState(null);
  const [tasting, setTasting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const theme = useTheme(); // <-- theme for colors

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setNeedsSignIn(true);
      setLoading(false);
      return;
    }
    setNeedsSignIn(false);
    setLoading(true);

    async function fetchTasting() {
      try {
        const docRef = doc(db, "tastings", tastingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTasting(data);
          // Optionally fetch user's existing ratings
          const responseRef = doc(db, "tastings", tastingId, "responses", user.uid);
          const responseSnap = await getDoc(responseRef);
          if (responseSnap.exists()) {
            setRatings(responseSnap.data().ratings || Array(data.numItems).fill(5));
            setNotes(responseSnap.data().notes || Array(data.numItems).fill(""));
          } else {
            setRatings(Array(data.numItems).fill(5));
            setNotes(Array(data.numItems).fill(""));
          }
        } else {
          setTasting(null);
        }
      } catch (error) {
        setTasting(null);
      }
      setLoading(false);
    }
    fetchTasting();
    // eslint-disable-next-line
  }, [user, tastingId]);

  useEffect(() => {
    let timer;
    if (saved) {
      setShowSaved(true);
      timer = setTimeout(() => setShowSaved(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [saved]);

  if (needsSignIn) {
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

  if (loading)
    return (
      <Container>
        <CircularProgress sx={{ my: 4 }} />
      </Container>
    );

  if (!tasting) {
    return (
      <Container>
        <Typography variant="h5" color="error" sx={{ my: 4 }}>
          Tasting not found!
        </Typography>
      </Container>
    );
  }

  // ------- Rating UI below -------
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
    <Container maxWidth="sm" sx={{ mt: { xs: 3, sm: 6 }, mb: 4 }}>
      {/* Tasting Name at top, then subtitle */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}>
        {tasting.name ? tasting.name : "Blind Tasting"}
      </Typography>
      <Typography sx={{ mb: 2, color: theme.palette.text.secondary }}>
        Hi <b>{user.displayName}</b>! Please rate the {tasting.numItems} items.
      </Typography>

      <Fade in={showSaved} timeout={{ enter: 300, exit: 500 }}>
        <Box>
          {showSaved && (
            <Alert severity="success" sx={{ my: 2 }}>
              Your ratings and notes have been saved!
            </Alert>
          )}
        </Box>
      </Fade>

      <Box sx={{ mt: 2 }}>
        {Array.from({ length: tasting.numItems }).map((_, idx) => (
          <Paper
            key={idx}
            elevation={2}
            sx={{
              my: 2,
              p: 2,
              borderRadius: 4,
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              transition: "background 0.3s, color 0.3s"
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
              Item {idx + 1}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 1 }}>
              <Typography sx={{ minWidth: 70, color: theme.palette.text.primary }}>Rating:</Typography>
              <Slider
                value={ratings[idx] || 5}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                onChange={(_, value) => handleSliderChange(idx, value)}
                sx={{ width: 150, mx: 1 }}
              />
              <Typography sx={{ color: theme.palette.text.primary }}>{ratings[idx] || 5}</Typography>
            </Box>
            <TextField
              label="Your notes (private)"
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              value={notes[idx] || ""}
              onChange={(e) => handleNotesChange(idx, e.target.value)}
              size="small"
              sx={{
                mt: 0.5,
                background: theme.palette.background.default,
                borderRadius: 2,
                "& .MuiInputBase-input": { color: theme.palette.text.primary }
              }}
              InputLabelProps={{
                style: { color: theme.palette.text.secondary },
              }}
              InputProps={{
                style: { color: theme.palette.text.primary },
              }}
            />
          </Paper>
        ))}
      </Box>
      <Box mt={2} display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 2, fontWeight: 600, minWidth: 160 }}
        >
          {saving ? "Saving..." : "Save My Ratings"}
        </Button>
      </Box>
    </Container>
  );
}

export default JoinTasting;
