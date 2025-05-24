// src/Results.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";

function Results() {
  const { tastingId } = useParams();
  const [tasting, setTasting] = useState(null);
  const [user, setUser] = useState(null);
  const [responses, setResponses] = useState([]);
  const [itemNames, setItemNames] = useState([]);
  const [savingNames, setSavingNames] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notCreator, setNotCreator] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Fetch tasting + responses
  useEffect(() => {
    async function fetchAll() {
      try {
        const docRef = doc(db, "tastings", tastingId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setTasting(null);
          setLoading(false);
          return;
        }
        const data = docSnap.data();
        setTasting({ ...data, id: docSnap.id });

        // Item names
        setItemNames(data.itemNames || Array(data.numItems).fill(""));

        // Responses
        const responsesCol = collection(db, "tastings", tastingId, "responses");
        const responsesSnap = await getDocs(responsesCol);
        setResponses(
          responsesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err) {
        setTasting(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [tastingId, savingNames]);

  // Only allow creator
  useEffect(() => {
    if (user && tasting && user.uid !== tasting.createdBy) setNotCreator(true);
    else setNotCreator(false);
  }, [user, tasting]);

  // Handle naming items
  const handleNameChange = (idx, value) => {
    const newNames = [...itemNames];
    newNames[idx] = value;
    setItemNames(newNames);
  };

  const handleSaveNames = async () => {
    setSavingNames(true);
    try {
      const tastingRef = doc(db, "tastings", tastingId);
      await updateDoc(tastingRef, { itemNames });
    } catch (err) {
      alert("Error saving item names: " + err.message);
    }
    setSavingNames(false);
  };

  // Tabulate results
  function computeResults() {
    if (!responses.length || !tasting) return [];
    const items = Array.from({ length: tasting.numItems }, (_, idx) => ({
      number: idx + 1,
      name: itemNames[idx] || `Item ${idx + 1}`,
      avg:
        responses
          .map((r) => r.ratings?.[idx] ?? null)
          .filter((v) => v !== null && v !== undefined).reduce((a, b) => a + b, 0) /
        responses.filter((r) => r.ratings?.[idx] !== null && r.ratings?.[idx] !== undefined).length || 0,
      votes: responses.filter((r) => r.ratings?.[idx] !== null && r.ratings?.[idx] !== undefined).length,
    }));
    return items.sort((a, b) => b.avg - a.avg); // Highest avg first
  }

  const chartData = computeResults().map(item => ({
    name: item.name || `Item ${item.number}`,
    Average: Number(item.avg.toFixed(2)),
    Votes: item.votes,
    number: item.number,
  }));

  if (loading) return <Container><CircularProgress /></Container>;
  if (!tasting) {
    return (
      <Container>
        <Typography variant="h5" color="error">Tasting not found!</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Alert severity="info" sx={{ my: 4 }}>
          Please sign in with Google to see the results.
        </Alert>
      </Container>
    );
  }

  if (notCreator) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          Only the creator can view results for this tasting.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Results for: {tasting.name || "Untitled Tasting"}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {tasting.numItems} items · Created on {tasting.createdAt?.toDate?.().toLocaleDateString() || ""}
      </Typography>
      <Box mt={3}>
        <Typography variant="h5" gutterBottom>Item Reveal</Typography>
        <Typography variant="body2">
          Enter the real name of each item for the reveal!
        </Typography>
        <Box my={2}>
          {Array.from({ length: tasting.numItems }).map((_, idx) => (
            <Box key={idx} my={1} display="flex" alignItems="center">
              <Typography sx={{ minWidth: 80 }}>{`Item ${idx + 1}:`}</Typography>
              <TextField
                label="Item Name"
                value={itemNames[idx] || ""}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                size="small"
                sx={{ mx: 1 }}
              />
            </Box>
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveNames}
            disabled={savingNames}
            sx={{ mt: 2 }}
          >
            {savingNames ? "Saving..." : "Save Item Names"}
          </Button>
        </Box>
      </Box>
      <Box mt={5}>
        <Typography variant="h5" gutterBottom>
          Results Visualization
        </Typography>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Average" fill="#1976d2">
                <LabelList dataKey="Average" position="top" />
              </Bar>
              <Bar dataKey="Votes" fill="#43a047" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography>No responses yet.</Typography>
        )}
      </Box>
    </Container>
  );
}

export default Results;
