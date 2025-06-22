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
  getDoc,
  deleteDoc,
  doc,
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

  // --- show/hide QR dialog
  const handleShowQR = (t) => {
    setQRTasting(t);
    setQROpen(true);
  };
  const handleCloseQR = () => {
    setQROpen(false);
    setQRTasting(null);
  };

  // --- track auth state ---
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((fbUser) => {
      setUser(fbUser);
    });
    return () => unsub();
  }, []);

  // --- fetch created + joined tastings ---
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
        created = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.error(e);
        setError("Failed to fetch your tastings.");
        setLoading(false);
        return;
      }

      let joined = [];
      try {
        // Get all responses for all tastings, filter for this user
        const allResponsesSnap = await getDocs(collectionGroup(db, "responses"));
        // DEBUG: Print all found responses for inspection
        allResponsesSnap.docs.forEach((docSnap) => {
          if (docSnap.id === user.uid) {
            console.log(
              "[MyTastings] Found participant response:",
              docSnap.ref.path,
              docSnap.data()
            );
          }
        });
        // Find all tasting IDs where a response exists with the current user's UID
        const joinedTastingIds = Array.from(
          new Set(
            allResponsesSnap.docs
              .filter((docSnap) => docSnap.id === user.uid)
              .map((docSnap) => {
                // responses collection: /tastings/{tastingId}/responses/{userId}
                return docSnap.ref.parent.parent?.id;
              })
              .filter(
                (tid) => tid && !created.find((t) => t.id === tid)
              )
          )
        );
        // DEBUG: Print joinedTastingIds
        console.log("[MyTastings] joinedTastingIds:", joinedTastingIds);
        console.log("Current Firebase UID:", user.uid);
        console.log("Current Email:", user.email);

        for (let tid of joinedTastingIds) {
          const tDoc = await getDoc(doc(db, "tastings", tid));
          if (tDoc.exists()) joined.push({ id: tDoc.id, ...tDoc.data() });
        }
      } catch (e) {
        console.warn("Unable to load joined tastings:", e);
      }

      // combine & sort newest first
      const all = [...created, ...joined].sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setTastings(all);
      setLoading(false);
    }

    fetchAll();
  }, [user, deleting]);

  // --- delete (host only) ---
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

  // --- if not signed in ---
  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Please sign in with Google to view your tastings.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Tastings
      </Typography>

      <Box mb={2}>
        <Button variant="contained" onClick={() => navigate("/")}>
          New Tasting
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : tastings.length === 0 ? (
        <Alert severity="info">You haven't created or joined any tastings yet.</Alert>
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
                      // — Host actions —
                      <>
                        {row.status !== "closed" && (
                          <Button size="small" onClick={() => handleShowQR(row)} sx={{ mr: 1 }}>
                            Share
                          </Button>
                        )}
                        <Button
                          size="small"
                          onClick={() => navigate(`/results/${row.id}`)}
                          sx={{ mr: 1 }}
                        >
                          Manage
                        </Button>
                        {row.status === "closed" && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() => navigate(`/final/${row.id}`)}
                            sx={{ mr: 1 }}
                          >
                            Final
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(row.id)}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      // — Participant actions —
                      <>
                        <Button size="small" onClick={() => handleShowQR(row)} sx={{ mr: 1 }}>
                          Share
                        </Button>
                        {row.status !== "closed" ? (
                          <Button size="small" onClick={() => navigate(`/join/${row.id}`)}>
                            Join
                          </Button>
                        ) : (
                          <Button size="small" onClick={() => navigate(`/final/${row.id}`)}>
                            Results
                          </Button>
                        )}
                          <Button size="small" onClick={() => navigate(`/myratings/${row.id}`)} sx={{ mr: 1 }}>
                            My Ratings
                          </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Tasting?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this tasting? This cannot be undone.
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

      {/* QR code modal */}
      <Dialog open={qrOpen} onClose={handleCloseQR}>
        <DialogTitle>Share This Tasting</DialogTitle>
        <DialogContent sx={{ textAlign: "center", py: 2 }}>
          {qrTasting && (
            <>
              <Typography variant="body2" gutterBottom>
                Code: <b>{qrTasting.id}</b>
              </Typography>
              <Typography
                variant="body2"
                sx={{ wordBreak: "break-all", mb: 2 }}
              >
                <a
                  href={`${window.location.origin}/join/${qrTasting.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`${window.location.origin}/join/${qrTasting.id}`}
                </a>
              </Typography>
              <Box sx={{ my: 2 }}>
                <QRCodeCanvas
                  value={`${window.location.origin}/join/${qrTasting.id}`}
                  size={170}
                />
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
