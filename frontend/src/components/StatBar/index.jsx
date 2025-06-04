import { Box, Typography } from "@mui/material";
import { People, LocationOn, Description, InsertDriveFile, HourglassEmpty, Science } from "@mui/icons-material";
import "./StatBar.css";

const StatBar = () => {

    const stats = [
      { icon: <People />, value: "3", label: "Datasets" },
      { icon: <LocationOn />, value: "3", label: "Primary Sites" },
      { icon: <Description />, value: "94", label: "Cases" },
      { icon: <InsertDriveFile />, value: "525", label: "Files" },
      { icon: <HourglassEmpty />, value: "22,534", label: "Genes" },
      { icon: <Science />, value: "2,940,240", label: "Mutations" },
    ];

  return (
    <Box className="stat-bar-container">
      {stats.map((stat, index) => (
        <Box key={index} className="stat-item">
          <Box className="stat-icon">{stat.icon}</Box>
          <Typography variant="h5" className="stat-number">
            {stat.value}
          </Typography>
          <Typography variant="body1" className="stat-label">
            {stat.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default StatBar;
