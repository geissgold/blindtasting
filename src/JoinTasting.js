// src/JoinTasting.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// ➊ lodash.debounce import
import debounce from "lodash.debounce";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Fade from "@mui/material/Fade";
import Rating from "@mui/material/Rating";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { useTheme } from "@mui/material/styles";

function JoinTasting() {
  const { tastingId } = useParams();
  const theme = useTheme();

  const [user, setUser]           = useState(null);
  const [tasting, setTasting]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [ratings, setRatings]     = useState([]);
  const [notes, setNotes]         = useState([]);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  // 1) Auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(fbUser => setUser(fbUser));
    return () => unsub();
  }, []);

  // 2) Fetch tasting & existing response
  useEffect(() => {
    if (!user) {
      setNeedsSignIn(true);
      setLoading(false);
      return;
    }
    setNeedsSignIn(false);
    setLoading(true);

    async function fetchData() {
      try {
        const tRef = doc(db, "tastings", tastingId);
        const tSnap = await getDoc(tRef);

        if (!tSnap.exists()) {
          setTasting(null);
        } else {
          const data = tSnap.data();
          setTasting(data);

          const rRef = doc(db, "tastings", tastingId, "responses", user.uid);
          const rSnap = await getDoc(rRef);

          if (rSnap.exists()) {
            const resp = rSnap.data();
            setRatings(resp.ratings ?? Array(data.numItems).fill(null));
            setNotes(  resp.notes   ?? Array(data.numItems).fill("")  );
          } else {
            setRatings(Array(data.numItems).fill(null));
            setNotes(  Array(data.numItems).fill("")           );
          }
        }
      } catch (e) {
        console.error(e);
        setTasting(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, tastingId]);

  // 3) Fade saved message
  useEffect(() => {
    if (saved) {
      setShowSaved(true);
      const id = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(id);
    }
  }, [saved]);

  // ➋ Debounced auto-save
  const debouncedSave = useMemo(
    () =>
      debounce(async (newRatings, newNotes) => {
        try {
          const rRef = doc(db, "tastings", tastingId, "responses", user.uid);
          await setDoc(rRef, {
            ratings: newRatings,
            notes: newNotes,
            displayName: user.displayName,
            submittedAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Auto-save error:", err);
        }
      }, 500),
    [tastingId, user]
  );

  // ➌ Trigger auto-save when ratings or notes change
  useEffect(() => {
    if (user) {
      debouncedSave(ratings, notes);
      return () => debouncedSave.flush();
    }
  }, [ratings, notes]);

  // 4) Early returns
  if (needsSignIn) {
    return (
      <Container sx={{ mt:4, textAlign:"center" }}>
        <Alert severity="info" sx={{ mb:2 }}>
          Please sign in with Google to join this tasting.
        </Alert>
        <Button
          variant="contained"
          onClick={()=>{
            const p = new GoogleAuthProvider();
            signInWithPopup(auth,p).catch(()=>{});
          }}
        >
          Sign in with Google
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ mt:4, textAlign:"center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!tasting) {
    return (
      <Container sx={{ mt:4, textAlign:"center" }}>
        <Typography variant="h5" color="error">
          Tasting not found!
        </Typography>
      </Container>
    );
  }

  // 5) Handlers
  const handleRatingChange = (idx, newVal) => {
    const copy = [...ratings];
    // click same star → clear
    copy[idx] = newVal === ratings[idx] ? null : newVal;
    setRatings(copy);
    setSaved(false);
  };

  const handleNotesChange = (idx, txt) => {
    const copy = [...notes];
    copy[idx] = txt;
    setNotes(copy);
    setSaved(false);
  };

  // Manual save (optional backup)
  const handleSave = async () => {
    setSaving(true);
    try {
      const rRef = doc(db, "tastings", tastingId, "responses", user.uid);
      await setDoc(rRef, {
        ratings,
        notes,
        displayName: user.displayName,
        submittedAt: serverTimestamp()
      });
      setSaved(true);
    } catch (e) {
      alert("Failed to save ratings: " + e.message);
    }
    setSaving(false);
  };

  // --- Render ---
  return (
    <Container maxWidth="sm" sx={{ mt:{xs:3,sm:6}, mb:4 }}>
      <Typography
        variant="h4"
        sx={{ fontWeight:700, mb:1, color: theme.palette.text.primary }}
      >
        {tasting.name || "Blind Tasting"}
      </Typography>
      <Typography sx={{ mb:2, color: theme.palette.text.secondary }}>
        Hi <b>{user.displayName}</b> — please rate {tasting.numItems} items:
      </Typography>

      {showSaved && (
        <Fade in timeout={{ enter:300, exit:500 }}>
          <Alert severity="success" sx={{ mb:3 }}>
            Your ratings and notes have been saved!
          </Alert>
        </Fade>
      )}

      {Array.from({ length: tasting.numItems }).map((_, idx) => (
        <Paper
          key={idx}
          elevation={2}
          sx={{
            mb:3,
            p:2,
            borderRadius:2,
            background: theme.palette.background.paper
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ mb:1, fontWeight:600, color: theme.palette.text.primary }}
          >
            Item {idx+1}
          </Typography>

          <Box sx={{ display:"flex", alignItems:"center", mb:1 }}>
            <Typography sx={{ mr:2, color: theme.palette.text.primary }}>
              Rating:
            </Typography>
            <Rating
              name={`rating-${idx}`}
              value={ratings[idx]}
              precision={1}
              max={5}
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
              onChange={(_,v) => handleRatingChange(idx,v)}
              size="large"
            />
          </Box>

          <TextField
            label="Your notes (private)"
            multiline
            minRows={2}
            fullWidth
            value={notes[idx]}
            onChange={e => handleNotesChange(idx,e.target.value)}
            size="small"
            sx={{
              "& .MuiInputBase-input": { color: theme.palette.text.primary },
              "& .MuiInputLabel-root": { color: theme.palette.text.secondary }
            }}
          />
        </Paper>
      ))}

      <Box sx={{ textAlign:"center", mt:2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save My Ratings"}
        </Button>
      </Box>
    </Container>
  );
}

export default JoinTasting;
