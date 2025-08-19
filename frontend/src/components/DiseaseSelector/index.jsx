import { useState } from "react";
import { Box, Typography, Button, ButtonGroup } from "@mui/material";
import "./DiseaseSelector.css";
import PropTypes from "prop-types";

const DiseaseSelector = ({ homeData,selectedDisease, onDiseaseChange }) => {

  const diseaseTypes = {
    // "Healthy": "Healthy",
    "PD": "Parkinson's Disease",
    "AD": "Alzheimer's Disease",
      "Control": "Control",
  };

  return (
    <Box className="disease-selector">
      <Typography variant="subtitle1" align="center" className="selector-title">
        Select a disease type below to see the available data.
      </Typography>
      <ButtonGroup variant="outlined" className="disease-buttons">
        {Object.keys(homeData).map((disease) => (
          <Button
            key={disease}
            onClick={() => onDiseaseChange(disease)}
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
DiseaseSelector.propTypes = {
    homeData: PropTypes.object.isRequired,
    selectedDisease: PropTypes.string.isRequired,
    onDiseaseChange: PropTypes.func.isRequired,
};
