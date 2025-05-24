import React from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

function App() {
  return (
    <Container maxWidth="sm" style={{ marginTop: 40 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Blind Tasting App
      </Typography>
      <Button variant="contained" color="primary">
        Hello Material UI
      </Button>
    </Container>
  );
}

export default App;
