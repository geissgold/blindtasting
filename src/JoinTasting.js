// src/JoinTasting.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import debounce from "lodash.debounce";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Rating from "@mui/material/Rating";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Fade } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTheme } from "@mui/material/styles";
import { QRCodeCanvas } from "qrcode.react";

function JoinTasting() {
  const { tastingId } = useParams();
  const theme = useTheme();

  const [user, setUser]           = useState(null);
  const [tasting, setTasting]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [ratings, setRatings]     = useState([]);
  const [notes, setNotes]         = useState([]);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Build share link
  const shareLink = `${window.location.origin}/join/${tastingId}`;

  // 1) Listen auth state
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

    async function load() {
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
            setRatings(
              Array(data.numItems).fill(null).map((_, i) => resp.ratings?.[i] ?? null)
            );
            setNotes(
              Array(data.numItems).fill("").map((_, i) =>
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
    load();
  }, [user, tastingId]);

  // 3) Debounced auto-save
  const debouncedSave = useMemo(
    () =>
      debounce(async (r, n) => {
        if (!user || !tasting) return;
        try {
          const rRef = doc(db, "tastings", tastingId, "responses", user.uid);
          await setDoc(
            rRef,
            { ratings: r, notes: n, displayName: user.displayName, submittedAt: serverTimestamp() },
            { merge: true }
          );
        } catch (err) {
          console.warn("Auto-save failed", err);
        }
      }, 500),
    [tastingId, user, tasting]
  );

  useEffect(() => {
    debouncedSave(ratings, notes);
  }, [ratings, notes, debouncedSave]);

  useEffect(() => () => debouncedSave.cancel(), [debouncedSave]);

  // 4) Manual save feedback
  useEffect(() => {
    if (saved) {
      setShowSaved(true);
      const id = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(id);
    }
  }, [saved]);

  // Early returns
  if (needsSignIn) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Please sign in with Google to join this tasting.
        </Alert>
        <Button
          variant="contained"
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider()).catch(() => {})}
        >
          Sign in with Google
        </Button>
      </Container>
    );
  }
  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }
  if (!tasting) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Tasting not found!
        </Typography>
      </Container>
    );
  }

  // 5) Handlers
  const handleRatingChange = (idx, v) => {
    const copy = [...ratings];
    copy[idx] = copy[idx] === v ? null : v;
    setRatings(copy);
    setSaved(false);
  };
  const handleNotesChange = (idx, txt) => {
    const copy = [...notes];
    copy[idx] = txt;
    setNotes(copy);
    setSaved(false);
  };
  const handleSaveClick = async () => {
    setSaving(true);
    try {
      const rRef = doc(db, "tastings", tastingId, "responses", user.uid);
      await setDoc(
        rRef,
        { ratings, notes, displayName: user.displayName, submittedAt: serverTimestamp() },
        { merge: true }
      );
      setSaved(true);
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  };

  // Render UI
  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 3, sm: 6 }, mb: 4 }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}
      >
        {tasting.name || "Blind Tasting"}
      </Typography>

      {/* Share Tasting Button & Dialog */}
      <Box sx={{ textAlign: "right", mb: 2 }}>
        <Button variant="outlined" size="small" onClick={() => setShareOpen(true)}>
          Share Tasting
        </Button>
      </Box>
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
        <DialogTitle>Share This Tasting</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <QRCodeCanvas value={shareLink} size={160} />
          <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="body2" sx={{ mr: 1, wordBreak: "break-all" }}>
              {shareLink}
            </Typography>
            <IconButton size="small" onClick={() => navigator.clipboard.writeText(shareLink)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Typography sx={{ mb: 2, color: theme.palette.text.secondary }}>
        Hi <b>{user.displayName}</b> — please rate {tasting.numItems} items:
      </Typography>

      {showSaved && (
        <Fade in timeout={{ enter: 300, exit: 500 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Ratings & notes saved!
          </Alert>
        </Fade>
      )}

      {Array.from({ length: tasting.numItems }).map((_, idx) => (
        <Paper
          key={idx}
          elevation={2}
          sx={{ mb: 3, p: 2, borderRadius: 2, background: theme.palette.background.paper }}
        >
          <Typography
            variant="subtitle1"
            sx={{ mb: 1, fontWeight: 600, color: theme.palette.text.primary }}
          >
            Item {idx + 1}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography sx={{ mr: 2, color: theme.palette.text.primary }}>
              Rating:
            </Typography>
            <Rating
              name={`rate-${idx}`}
              value={ratings[idx]}
              precision={1}
              max={5}
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
              size="large"
              onChange={(_, v) => handleRatingChange(idx, v)}
            />
          </Box>

          <TextField
            label="Your notes (private)"
            multiline
            minRows={2}
            fullWidth
            value={notes[idx]}
            onChange={e => handleNotesChange(idx, e.target.value)}
            size="small"
            sx={{
              "& .MuiInputBase-input": { color: theme.palette.text.primary },
              "& .MuiInputLabel-root": { color: theme.palette.text.secondary }
            }}
          />
        </Paper>
      ))}

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveClick}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save My Ratings"}
        </Button>
      </Box>
    </Container>
  );
}

export default JoinTasting;
