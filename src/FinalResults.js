import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import { QRCodeCanvas } from "qrcode.react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, LabelList, ResponsiveContainer } from "recharts";

function FinalResults() {
  const { tastingId } = useParams();
  const [tasting, setTasting] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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

        // Fetch responses
        const responsesCol = collection(db, "tastings", tastingId, "responses");
        const responsesSnap = await getDocs(responsesCol);
        setResponses(
          responsesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch {
        setTasting(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [tastingId]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Tabulate results for chart and CSV
  function computeResults() {
    if (!responses.length || !tasting) return [];
    const items = Array.from({ length: tasting.numItems }, (_, idx) => ({
      number: idx + 1,
      name: (tasting.itemNames && tasting.itemNames[idx]) || `Item ${idx + 1}`,
      avg:
        responses
          .map((r) => r.ratings?.[idx] ?? null)
          .filter((v) => v !== null && v !== undefined).reduce((a, b) => a + b, 0) /
        responses.filter((r) => r.ratings?.[idx] !== null && r.ratings?.[idx] !== undefined).length || 0,
      votes: responses.filter((r) => r.ratings?.[idx] !== null && r.ratings?.[idx] !== undefined).length,
    }));
    return items.sort((a, b) => b.avg - a.avg);
  }

  const chartData = computeResults().map(item => ({
    name: item.name || `Item ${item.number}`,
    Average: Number(item.avg.toFixed(2)),
    Votes: item.votes,
    number: item.number,
  }));

  // --- CSV download ---
  const handleDownloadCSV = () => {
    const csvHeader = ["Item Number", "Item Name", "Average Rating", "Votes"];
    const csvRows = computeResults().map(item =>
      [
        item.number,
        `"${item.name.replace(/"/g, '""')}"`,
        item.avg.toFixed(2),
        item.votes
      ].join(",")
    );
    const csv = [csvHeader.join(","), ...csvRows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tasting-results-${tasting.name || tasting.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container>
        <CircularProgress sx={{ my: 4 }} />
      </Container>
    );
  }
  if (!tasting) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          Tasting not found!
        </Alert>
      </Container>
    );
  }

  // --- FinalResults UI ---
  const shareLink = `${window.location.origin}/final/${tasting.id}`;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* SHARE FINAL RESULTS */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Button variant="outlined" color="primary" onClick={() => setShareOpen(true)}>
          Share Final Results
        </Button>
        <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
          <DialogTitle>Share Final Results</DialogTitle>
          <DialogContent sx={{ textAlign: "center" }}>
            <QRCodeCanvas value={shareLink} size={160} />
            <Box sx={{ mt: 2, mb: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography
                variant="body2"
                sx={{ wordBreak: "break-all", mr: 1, color: "primary.main" }}
              >
                {shareLink}
              </Typography>
              <Tooltip title="Copy link">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setCopySuccess(true);
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {copySuccess && (
              <Alert severity="success" sx={{ my: 2, px: 3, py: 1 }}>
                Link copied to clipboard!
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Anyone with this code or link can view the final results.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareOpen(false)} autoFocus>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Typography variant="h4" sx={{ mb: 3, textAlign: "center" }}>
        Final Results: {tasting.name || "Untitled Tasting"}
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 1, textAlign: "center" }}>
        {tasting.numItems} items &middot; Created on {tasting.createdAt?.toDate?.().toLocaleDateString() || ""}
      </Typography>

      <Box mt={2} mb={4} sx={{ textAlign: "center" }}>
        <Button variant="outlined" onClick={handleDownloadCSV}>
          Download CSV
        </Button>
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
              <ReTooltip />
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

export default FinalResults;
