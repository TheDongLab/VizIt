import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/"); // Navigate to the homepage
  };

  const handleLogin = () => {
    navigate("/login"); // Navigate to the login page
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
            paddingTop:"150px",
        }}
      >
        {/* Unauthorized Title */}
        <Typography variant="h1" sx={{ fontWeight: "bold", color: "text.secondary" }}>
          401
        </Typography>

        {/* Message */}
        <Typography variant="h5" sx={{ mt: 2, mb: 3 }}>
          Unauthorized Access
        </Typography>

        {/* Description */}
        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          You do not have permission to view this page. Please log in or contact the administrator.
        </Typography>

        {/* Buttons */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {/* Button to go back to the homepage */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoHome}
            sx={{ textTransform: "none", fontSize: "1rem" }}
          >
            Go to Homepage
          </Button>

          {/* Button to navigate to the login page */}
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLogin}
            sx={{ textTransform: "none", fontSize: "1rem" }}
          >
            Log In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;