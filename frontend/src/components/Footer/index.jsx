import { Box, Typography } from "@mui/material";
import "./Footer.css";

const Footer = () => {
  return (
    <Box component="footer" className="footer">
      <Typography variant="body2">© 2025 {import.meta.env.VITE_APP_TITLE}. All rights reserved.</Typography>
    </Box>
  );
};

export default Footer;
