// src/MyTastings.js
import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

function MyTastings() {
  const [user, setUser] = useState(null);
  const [tastings, setTastings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [qrOpen, setQROpen] = useState(false);
  const [qrTasting, setQRTasting] = useState(null);

  const navigate = useNavigate();

  const handleShowQR = (tasting) => {
    setQRTasting(tasting);
    setQROpen(true);
  };
  
  const handleCloseQR = () => {
    setQROpen(false);
    setQRTasting(null);
  };  

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    async function fetchTastings() {
      try {
        const q = query(
          collection(db, "tastings"),
          where("createdBy", "==", user.uid)
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort by createdAt desc
        rows.sort((a, b) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setTastings(rows);
      } catch (err) {
        setError("Failed to fetch tastings.");
      }
      setLoading(false);
    }
    fetchTastings();
  }, [user, deleting]);

  // Delete tasting and all responses subcollection
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      // Optionally: delete all responses in subcollection
      // For simplicity, just delete the parent doc (Firestore auto-deletes subcollections if set up with recursive delete in console/CLI)
      await deleteDoc(doc(db, "tastings", id));
      setDeleteId(null);
    } catch (err) {
      setError("Failed to delete tasting: " + err.message);
    }
    setDeleting(false);
  };

  if (!user)
    return (
      <Container>
        <Alert severity="info" sx={{ my: 4 }}>
          Please sign in with Google to view your tastings.
        </Alert>
      </Container>
    );

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Tastings
      </Typography>
      <Box mb={2}>
        <Button variant="contained" color="primary" onClick={() => navigate("/")}>
          New Tasting
        </Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : tastings.length === 0 ? (
        <Alert severity="info" sx={{ my: 4 }}>
          You haven't created any tastings yet.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tasting Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell># Items</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tastings.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name || "Untitled"}</TableCell>
                  <TableCell>
                    {row.createdAt?.toDate
                      ? row.createdAt.toDate().toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell>
                    {row.status === "closed" ? (
                      <span style={{ color: "#388e3c" }}>Closed</span>
                    ) : (
                      <span style={{ color: "#d32f2f" }}>Open</span>
                    )}
                  </TableCell>
                  <TableCell>{row.numItems}</TableCell>
                  <TableCell>
                    {row.status !== "closed" && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleShowQR(row)}
                      sx={{ mr: 1 }}
                    >
                    Show QR
                    </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => navigate(`/results/${row.id}`)}
                      variant="outlined"
                      sx={{ mr: 1 }}
                    >
                      Manage
                    </Button>
                    {row.status === "closed" && (
                      <Button
                        size="small"
                        onClick={() => navigate(`/final/${row.id}`)}
                        variant="contained"
                        color="success"
                        sx={{ mr: 1 }}
                      >
                        Final Results
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => setDeleteId(row.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Tasting?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this tasting? This cannot be undone. <br />
          <b>All responses will be lost!</b>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteId)}
            color="error"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={qrOpen} onClose={handleCloseQR}>
        <DialogTitle>Share This Tasting</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
            {qrTasting && (
            <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                Event Code:<br />
                <b>{qrTasting.id}</b>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                Or join link:<br />
                <a
                  href={`https://tasting.hallofmirth.us/join/${qrTasting.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ wordBreak: "break-all" }}
                >
                {`https://tasting.hallofmirth.us/join/${qrTasting.id}`}
                </a>

                </Typography>
                <Box sx={{ my: 2 }}>
                <QRCodeCanvas value={`https://tasting.hallofmirth.us/join/${qrTasting.id}`} size={170} />
                </Box>
            </>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseQR}>Close</Button>
        </DialogActions>
     </Dialog>

    </Container>
  );
}

export default MyTastings;
