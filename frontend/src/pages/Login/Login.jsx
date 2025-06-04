import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import userStore from "../../store/UserStore.js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const login = userStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = () => {
    // authentication (replace with API call)
    if (email === "user" && password === "password") {
      login({ email });
      navigate("/data"); // Redirect to a protected page
    } else {
      setMessage("Invalid credentials. Please try again.");
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: "auto", textAlign: "center", mt:12,height: "100vh" }}>
      <Typography variant="h4" gutterBottom>Login</Typography>
      <TextField
        label="Username"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {message && <Typography color="error">{message}</Typography>}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleLogin}
      >
        Login
      </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Don&#39;t have an account? <a href="/register">Sign up</a>
        </Typography>
    </Box>
  );
};

export default Login;
