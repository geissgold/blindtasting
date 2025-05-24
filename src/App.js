import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import JoinTasting from "./JoinTasting";
import Results from "./Results";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:tastingId" element={<JoinTasting />} />
        <Route path="/results/:tastingId" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
