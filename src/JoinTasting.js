// src/JoinTasting.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
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

  // Build a reference to this user's response doc
  const responseRef = useMemo(() => {
    if (!user) return null;
    return doc(db, "tastings", tastingId, "responses", user.uid);
  }, [user, tastingId]);

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

          const rSnap = await getDoc(responseRef);
          if (rSnap.exists()) {
            const resp = rSnap.data();
            // merge into a fixed-length array of length numItems
            setRatings(
              Array(data.numItems)
                .fill(null)
                .map((_, i) =>
                  resp.ratings?.[i] != null ? resp.ratings[i] : null
                )
            );
            setNotes(
              Array(data.numItems)
                .fill("")
                .map((_, i) =>
                  typeof resp.notes?.[i] === "string" ? resp.notes[i] : ""
                )
            );
          } else {
            setRatings(Array(data.numItems).fill(null));
            setNotes(Array(data.numItems).fill(""));
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
  }, [user, tastingId, responseRef]);

  // 3) Fade saved message
  useEffect(() => {
    if (saved) {
      setShowSaved(true);
      const id = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(id);
    }
  }, [saved]);

  // 4) Early returns
  if (needsSignIn) {
    return (
      <Container sx={{ mt:4, textAlign:"center" }}>
        <Alert severity="info" sx={{ mb:2 }}>
          Please sign in with Google to join this tasting.
        </Alert>
        <Button
          variant="contained"
          onClick={() => {
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
    // schedule a debounced auto-save
    debouncedSave?.(copy, notes);
  };

  const handleNotesChange = (idx, txt) => {
    const copy = [...notes];
    copy[idx] = txt;
    setNotes(copy);
    setSaved(false);
    debouncedSave?.(ratings, copy);
  };

  // 6) Debounced auto-save (fires 500ms after last change)
  const debouncedSave = useMemo(() => {
    if (!responseRef || !user) return null;
    return debounce(async (newRatings, newNotes) => {
      try {
        // sanitize: undefined → null, notes to string
        const safeRatings = newRatings.map(r => r == null ? null : r);
        const safeNotes   = newNotes.map(n => n || "");
        await setDoc(
          responseRef,
          {
            ratings: safeRatings,
            notes:   safeNotes,
            displayName: user.displayName,
            submittedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    }, 500);
  }, [responseRef, user]);

  // clean up on unmount
  useEffect(() => () => debouncedSave?.cancel(), [debouncedSave]);

  // 7) Manual “Save My Ratings” button
  const handleManualSave = async () => {
    setSaving(true);
    try {
      const safeRatings = ratings.map(r => r == null ? null : r);
      const safeNotes   = notes.map(n => n || "");
      await setDoc(
        responseRef,
        {
          ratings: safeRatings,
          notes:   safeNotes,
          displayName: user.displayName,
          submittedAt: serverTimestamp(),
        },
        { merge: true }
      );
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
          onClick={handleManualSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save My Ratings"}
        </Button>
      </Box>
    </Container>
  );
}

export default JoinTasting;
