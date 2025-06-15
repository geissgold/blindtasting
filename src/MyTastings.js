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
  getDoc,
  FieldPath
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

  const handleShowQR = (tasting) => {
    setQRTasting(tasting);
    setQROpen(true);
  };

  const handleCloseQR = () => {
    setQROpen(false);
    setQRTasting(null);
  };

  // Listen for auth changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Fetch tastings created by user AND tastings user participated in
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");

    (async () => {
      try {
        // 1) Tastings user created
        const qc = query(
          collection(db, "tastings"),
          where("createdBy", "==", user.uid)
        );
        const snapC = await getDocs(qc);
        const created = snapC.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 2) Tastings user responded to
        const qr = query(
          collectionGroup(db, "responses"),
          where(FieldPath.documentId(), "==", user.uid)
        );
        const snapR = await getDocs(qr);
        const respondedIds = Array.from(
          new Set(snapR.docs.map((d) => d.ref.parent.parent.id))
        );
        const otherIds = respondedIds.filter(
          (id) => !created.find((t) => t.id === id)
        );

        // Fetch those participations
        const others = await Promise.all(
          otherIds.map(async (id) => {
            const td = await getDoc(doc(db, "tastings", id));
            return td.exists() ? { id: td.id, ...td.data() } : null;
          })
        );
        const participated = others.filter(Boolean);

        // Merge and sort
        const all = [...created, ...participated];
        all.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setTastings(all);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch tastings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, deleting]);

  // Delete tasting
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "tastings", id));
      setDeleteId(null);
    } catch (err) {
      setError("Failed to delete tasting: " + err.message);
    }
    setDeleting(false);
  };

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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Tastings
      </Typography>
      <Box mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/")}
        >
          New Tasting
        </Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}

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

      {/* Share QR dialog */}
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
                <QRCodeCanvas
                  value={`https://tasting.hallofmirth.us/join/${qrTasting.id}`}
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
