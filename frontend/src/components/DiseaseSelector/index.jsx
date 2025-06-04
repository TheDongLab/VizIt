import { useState } from "react";
import { Box, Typography, Button, ButtonGroup } from "@mui/material";
import "./DiseaseSelector.css";

const DiseaseSelector = () => {
  const [selectedDisease, setSelectedDisease] = useState("Healthy");

  const handleDiseaseChange = (disease) => {
    setSelectedDisease(disease);
  };

  const diseaseTypes = {
    // "Healthy": "Healthy",
    "PD": "Parkinson's Disease",
    // "AD": "Alzheimer's Disease"
  };

  return (
    <Box className="disease-selector">
      <Typography variant="subtitle1" align="center" className="selector-title">
        Select a disease type below to see the available data.
      </Typography>
      <ButtonGroup variant="outlined" className="disease-buttons">
        {Object.keys(diseaseTypes).map((disease) => (
          <Button
            key={disease}
            onClick={() => handleDiseaseChange(disease)}
            className={selectedDisease === disease ? "selected" : ""}
          >
            {diseaseTypes[disease]}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
};

export default DiseaseSelector;

