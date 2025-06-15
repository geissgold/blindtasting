// src/MyTastings.js
import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  documentId,
  getDoc
} from "firebase/firestore";
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

  // Show QR modal
  const handleShowQR = (tasting) => {
    setQRTasting(tasting);
    setQROpen(true);
  };
  const handleCloseQR = () => {
    setQROpen(false);
    setQRTasting(null);
  };

  // Listen for auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((fbUser) => {
      setUser(fbUser);
    });
    return () => unsub();
  }, []);

  // Fetch both created & joined tastings
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");

    async function fetchAll() {
      let created = [];
      try {
        const cQ = query(
          collection(db, "tastings"),
          where("createdBy", "==", user.uid)
        );
        const cSnap = await getDocs(cQ);
        created = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.error(e);
        setError("Failed to fetch your tastings.");
        setLoading(false);
        return;
      }

      let joined = [];
      try {
        const rQ = query(
          collectionGroup(db, "responses"),
          where(documentId(), "==", user.uid)
        );
        const rSnap = await getDocs(rQ);
        const joinedIds = Array.from(
          new Set(
            rSnap.docs
              .map(d => d.ref.parent.parent?.id)
              .filter(id => id && !created.find(t => t.id === id))
          )
        );
        for (let id of joinedIds) {
          const tDoc = await getDoc(doc(db, "tastings", id));
          if (tDoc.exists()) joined.push({ id: tDoc.id, ...tDoc.data() });
        }
      } catch (e) {
        console.warn("Unable to load joined tastings:", e);
      }

      const all = [...created, ...joined];
      all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setTastings(all);
      setLoading(false);
    }
    fetchAll();
  }, [user, deleting]);

  // Delete a tasting (host)
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "tastings", id));
      setDeleteId(null);
    } catch (e) {
      console.error(e);
      setError("Failed to delete tasting.");
    }
    setDeleting(false);
  };

  // If not signed in
  if (!user) {
    return (
      <Container>
        <Alert severity="info" sx={{ my: 4 }}>
          Please sign in with Google to view your tastings.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Tastings
      </Typography>

      <Box mb={2}>
        <Button variant="contained" onClick={() => navigate("/")}>New Tasting</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : tastings.length === 0 ? (
        <Alert severity="info" sx={{ my: 4 }}>
          You haven't created or joined any tastings yet.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
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
                    {row.createdBy === user.uid ? (
                      <>
                        {row.status !== "closed" && (
                          <Button size="small" onClick={() => handleShowQR(row)} sx={{ mr: 1 }}>
                            Show QR
                          </Button>
                        )}
                        <Button size="small" onClick={() => navigate(`/results/${row.id}`)} sx={{ mr: 1 }}>
                          Manage
                        </Button>
                        {row.status === "closed" && (
                          <Button size="small" onClick={() => navigate(`/final/${row.id}`)} color="success" sx={{ mr: 1 }}>
                            Final
                          </Button>
                        )}
                        <Button size="small" color="error" onClick={() => setDeleteId(row.id)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        {row.status !== "closed" ? (
                          <Button size="small" onClick={() => navigate(`/join/${row.id}`)}>
                            Join
                          </Button>
                        ) : (
                          <Button size="small" onClick={() => navigate(`/final/${row.id}`)}>
                            Results
                          </Button>
                        )}
                      </>
                    )}
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
          Are you sure you want to delete this tasting? This cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteId)} color="error" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR modal */}
      <Dialog open={qrOpen} onClose={handleCloseQR}>
        <DialogTitle>Share This Tasting</DialogTitle>
        <DialogContent sx={{ textAlign: "center", py: 2 }}>
          {qrTasting && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Code: <b>{qrTasting.id}</b>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, wordBreak: "break-all" }}>
                <a href={`${window.location.origin}/join/${qrTasting.id}`} target="_blank" rel="noopener noreferrer">
                  {`${window.location.origin}/join/${qrTasting.id}`}
                </a>
              </Typography>
              <Box sx={{ my: 2 }}>
                <QRCodeCanvas value={`${window.location.origin}/join/${qrTasting.id}`} size={170} />
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
