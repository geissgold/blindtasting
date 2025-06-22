// src/MyRatings.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Rating from "@mui/material/Rating";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";

function MyRatings() {
  const { tastingId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [user, setUser] = useState(null);
  const [tasting, setTasting] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchAll() {
      const tRef = doc(db, "tastings", tastingId);
      const tSnap = await getDoc(tRef);
      if (!tSnap.exists()) {
        setTasting(null);
        setResponse(null);
        setLoading(false);
        return;
      }
      setTasting(tSnap.data());

      const rRef = doc(db, "tastings", tastingId, "responses", user.uid);
      const rSnap = await getDoc(rRef);
      setResponse(rSnap.exists() ? rSnap.data() : null);
      setLoading(false);
    }
    fetchAll();
  }, [user, tastingId]);

  if (!user)
    return (
      <Container>
        <Alert severity="info" sx={{ my: 4 }}>
          Please sign in to view your ratings.
        </Alert>
      </Container>
    );

  if (loading)
    return (
      <Container>
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      </Container>
    );

  if (!tasting)
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          Tasting not found.
        </Alert>
      </Container>
    );

  if (!response)
    return (
      <Container>
        <Alert severity="warning" sx={{ my: 4 }}>
          You have not submitted any ratings for this tasting.
        </Alert>
      </Container>
    );

  return (
    <Container maxWidth="sm" sx={{ mt: 5, mb: 4 }}>
      <Button variant="text" sx={{ mb: 2 }} onClick={() => navigate(-1)}>
        &larr; Back
      </Button>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          {tasting.name || "Blind Tasting"}
        </Typography>
        <Typography sx={{ mb: 2 }}>
          <b>Status:</b> {tasting.status === "closed" ? "Closed" : "Open"}
        </Typography>
        <Typography sx={{ mb: 2, color: theme.palette.text.secondary }}>
          Your ratings and notes:
        </Typography>
        {Array.from({ length: tasting.numItems }).map((_, idx) => (
          <Paper
            key={idx}
            elevation={1}
            sx={{
              my: 2,
              p: 2,
              borderRadius: 2,
              background: theme.palette.background.paper,
              color: theme.palette.text.primary
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Item {idx + 1}
            </Typography>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ mr: 2 }}>Rating:</Typography>
              <Rating
                value={response.ratings?.[idx] ?? null}
                max={5}
                precision={1}
                readOnly
                size="large"
              />
            </Box>
            <Typography sx={{ fontStyle: "italic", color: theme.palette.text.secondary }}>
              {response.notes?.[idx] || <span style={{ opacity: 0.5 }}>No notes</span>}
            </Typography>
          </Paper>
        ))}
      </Paper>
    </Container>
  );
}

export default MyRatings;
