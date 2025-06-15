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

  // show QR modal
  const handleShowQR = (tasting) => {
    setQRTasting(tasting);
    setQROpen(true);
  };
  const handleCloseQR = () => {
    setQROpen(false);
    setQRTasting(null);
  };

  // listen auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((fbUser) => {
      setUser(fbUser);
    });
    return () => unsub();
  }, []);

  // fetch both created and joined tastings
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");

    async function fetchTastings() {
      try {
        // 1) created by this user
        const createdQ = query(
          collection(db, "tastings"),
          where("createdBy", "==", user.uid)
        );
        const createdSnap = await getDocs(createdQ);
        const created = createdSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2) joined: find all responses docs where documentId == user.uid
        const respQ = query(
          collectionGroup(db, "responses"),
          where(documentId(), "==", user.uid)
        );
        const respSnap = await getDocs(respQ);
        const joinedIds = Array.from(
          new Set(
            respSnap.docs.map(d => d.ref.parent.parent.id)
          )
        );

        // fetch those tastings
        const joined = [];
        for (let id of joinedIds) {
          // skip if already created
          if (created.find(t => t.id === id)) continue;
          const tDoc = await getDoc(doc(db, "tastings", id));
          if (tDoc.exists()) joined.push({ id: tDoc.id, ...tDoc.data() });
        }

        // combine & sort
        const all = [...created, ...joined];
        all.sort((a, b) => {
          const aT = a.createdAt?.seconds || 0;
          const bT = b.createdAt?.seconds || 0;
          return bT - aT;
        });

        setTastings(all);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch tastings.");
      }
      setLoading(false);
    }
    fetchTastings();
  }, [user, deleting]);

  // delete tasting (only host can)
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "tastings", id));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete tasting.");
    }
    setDeleting(false);
  };

  // show login prompt
  if (!user) return (
    <Container>
      <Alert severity="info" sx={{ my: 4 }}>
        Please sign in with Google to view your tastings.
      </Alert>
    </Container>
  );

  return (
    <Container maxWidth="md" sx={{ mt:4, mb:4 }}>
      <Typography variant="h4" gutterBottom>My Tastings</Typography>
      <Box mb={2}>
        <Button variant="contained" onClick={()=>navigate("/")}>New Tasting</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress/></Box>
      ) : tastings.length===0 ? (
        <Alert severity="info" sx={{ my:4 }}>
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
              {tastings.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.name || "Untitled"}</TableCell>
                  <TableCell>
                    {row.createdAt?.toDate
                      ? row.createdAt.toDate().toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell>
                    {row.status==="closed"
                      ? <span style={{color:'#388e3c'}}>Closed</span>
                      : <span style={{color:'#d32f2f'}}>Open</span>}
                  </TableCell>
                  <TableCell>{row.numItems}</TableCell>
                  <TableCell>
                    {row.createdBy===user.uid ? (
                      // host actions
                      <>
                        {row.status!=='closed' && (
                          <Button size="small" onClick={()=>handleShowQR(row)} sx={{mr:1}}>Show QR</Button>
                        )}
                        <Button size="small" onClick={()=>navigate(`/results/${row.id}`)} sx={{mr:1}}>Manage</Button>
                        {row.status==='closed' && (
                          <Button size="small" onClick={()=>navigate(`/final/${row.id}`)} color="success" sx={{mr:1}}>Final</Button>
                        )}
                        <Button size="small" color="error" onClick={()=>setDeleteId(row.id)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      // participant actions
                      <>
                        {row.status!=='closed' ? (
                          <Button size="small" onClick={()=>navigate(`/join/${row.id}`)}>Join</Button>
                        ) : (
                          <Button size="small" onClick={()=>navigate(`/final/${row.id}`)}>Results</Button>
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

      {/* delete confirm */}
      <Dialog open={!!deleteId} onClose={()=>setDeleteId(null)}>
        <DialogTitle>Delete Tasting?</DialogTitle>
        <DialogContent>
          Are you sure? This cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDeleteId(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={()=>handleDelete(deleteId)} color="error" disabled={deleting}>
            {deleting? 'Deleting...':'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR dialog */}
      <Dialog open={qrOpen} onClose={handleCloseQR}>
        <DialogTitle>Share This Tasting</DialogTitle>
        <DialogContent sx={{textAlign:'center',py:2}}>
          {qrTasting && (
            <>  
              <Typography variant="body2" sx={{mb:1}}>
                Code: <b>{qrTasting.id}</b>
              </Typography>
              <Typography variant="body2" sx={{mb:2,wordBreak:'break-all'}}>
                <a href={`${window.location.origin}/join/${qrTasting.id}`} target="_blank" rel="noopener noreferrer">
                  {`${window.location.origin}/join/${qrTasting.id}`}
                </a>
              </Typography>
              <QRCodeCanvas value={`${window.location.origin}/join/${qrTasting.id}`} size={170}/>
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
