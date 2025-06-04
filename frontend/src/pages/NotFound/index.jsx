import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/"); // Navigate to the homepage
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "start",
          height: "100vh", // Full viewport height
          textAlign: "center",
            paddingTop: "150px"
        }}
      >
        {/* 404 Title */}
        <Typography variant="h1" sx={{ fontWeight: "bold", color: "text.secondary" }}>
          404
        </Typography>

        {/* Message */}
        <Typography variant="h5" sx={{ mt: 2, mb: 3 }}>
          Oops! Page not found.
        </Typography>

        {/* Description */}
        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          The page you&#39;re looking for doesn&#39;t exist or has been moved.
        </Typography>

        {/* Button to go back to the homepage */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleGoHome}
          sx={{ textTransform: "none", fontSize: "1rem" }}
        >
          Go to Homepage
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;