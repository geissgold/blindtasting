// src/FinalResults.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";

function FinalResults() {
  const { tastingId } = useParams();
  const [tasting, setTasting] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [tastingId]);

  function computeResults() {
    if (!responses.length || !tasting) return [];
    const items = Array.from({ length: tasting.numItems }, (_, idx) => ({
      number: idx + 1,
      name: tasting.itemNames?.[idx] || `Item ${idx + 1}`,
      avg:
        responses
          .map((r) => r.ratings?.[idx] ?? null)
          .filter((v) => v !== null && v !== undefined)
          .reduce((a, b) => a + b, 0) /
        responses.filter(
          (r) => r.ratings?.[idx] !== null && r.ratings?.[idx] !== undefined
        ).length || 0,
      votes: responses.filter(
        (r) => r.ratings?.[idx] !== null && r.ratings?.[idx] !== undefined
      ).length,
    }));
    return items.sort((a, b) => b.avg - a.avg); // Highest avg first
  }

  // CSV Export
  function downloadCSV() {
    if (!tasting || !responses.length) return;
    let csv = `Tasting Name,${tasting.name || ""}\nDate,${tasting.createdAt?.toDate?.().toLocaleDateString() || ""}\n\n`;
    csv += "Item #,Item Name,Average Score,Votes\n";
    const results = computeResults();
    results.forEach((item) => {
      csv += `${item.number},"${item.name}",${item.avg.toFixed(2)},${item.votes}\n`;
    });
    csv += "\n\nParticipant,Item #,Rating,Notes\n";
    responses.forEach((r) => {
      r.ratings?.forEach((score, idx) => {
        csv += `"${r.displayName}",${idx + 1},${score},"${r.notes?.[idx] || ""}"\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TastingResults-${tasting.name || tastingId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading)
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  if (!tasting)
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          Tasting not found!
        </Alert>
      </Container>
    );

  if (tasting.status !== "closed")
    return (
      <Container>
        <Alert severity="info" sx={{ my: 4 }}>
          The host has not yet closed/revealed this tasting. Please check back later!
        </Alert>
      </Container>
    );

  const results = computeResults();
  const topItemName = results.length ? results[0].name : "";
  const chartData = results.map((item) => ({
    name: (item.name === topItemName ? `🏆 ${item.name}` : item.name) || `Item ${item.number}`,
    Average: Number(item.avg.toFixed(2)),
    Votes: item.votes,
    number: item.number,
  }));

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Final Results: {tasting.name || "Untitled Tasting"}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {tasting.numItems} items · Created on{" "}
        {tasting.createdAt?.toDate?.().toLocaleDateString() || ""}
      </Typography>
      <Alert severity="success" sx={{ my: 2 }}>
        This tasting is <b>closed</b>. All results are now visible!
      </Alert>
      <Box mt={3}>
        <Typography variant="h5" gutterBottom>
          Item Names
        </Typography>
        <ul>
          {Array.from({ length: tasting.numItems }).map((_, idx) => (
            <li key={idx}>
              <b>Item {idx + 1}:</b> {tasting.itemNames?.[idx] || "Not revealed"}
            </li>
          ))}
        </ul>
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
      <Box mt={3} display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={downloadCSV}
          disabled={!responses.length}
        >
          Download Full Results (CSV)
        </Button>
      </Box>
    </Container>
  );
}

export default FinalResults;
