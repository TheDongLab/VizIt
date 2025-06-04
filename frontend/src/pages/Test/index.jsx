import { useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import Grid2 from "@mui/material/Grid2"; // Correct Grid2 import
import "./Test.css"; // Import the CSS file

import DiseaseSelector from "../../components/DiseaseSelector";
import BrainsideSelector from "../../components/BrainsideSelector/index.jsx";
import BrainRegions from "../../components/BrainRegions/index.jsx";
// import BrainRegions from "../../components/BrainRegions";

const Test = () => {
  const [disease, setDisease] = useState("Healthy");

  const handleDiseaseChange = (newDisease) => {
    setDisease(newDisease);
  };

  return (

          <BrainRegions />

  );
};

export default Test;
