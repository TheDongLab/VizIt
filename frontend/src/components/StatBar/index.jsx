import {Box, Typography, Link, Paper, Card, CardContent} from "@mui/material";
import {Description} from "@mui/icons-material";
import "./StatBar.css";
import {Dna, DnaOff, Images, Folders, LandPlot} from "lucide-react";
import PropTypes from "prop-types";
import Grid2 from "@mui/material/Grid2";

const StatBar = ({disease, homeData}) => {

    const stats = [
        {icon: <Folders/>, value: homeData?.[disease]["n_datasets"], label: "Datasets", link: "/datasets"},
        {icon: <LandPlot/>, value: Object.keys(homeData?.[disease]["brain_super_region"]).length, label: "Primary regions", link: "/datasets"},
        // {icon: <LandPlot/>, value: homeData?.[disease]["n_regions"], label: "Primary regions", link: "/datasets"},
        {icon: <Description/>, value: homeData?.[disease]["n_samples"], label: "Samples", link: "/samples/all"},
        {icon: <Images/>, value: homeData?.[disease]["n_visiumst"], label: "Slices", link: "/views/visiumview"},
        {icon: <Dna/>, value: "> 30,000", label: "Genes", link: "/views/geneview"},
        {icon: <DnaOff/>, value: "> 400,000", label: "Mutations", link: "/views/regionsview"},
    ];

    return (
        <Grid2 item xs={12}>
            <Paper elevation={3} sx={{p: 3}} className="stat-bar-container">
                <Grid2 container spacing={3}>
                    {stats.map((stat, index) => (
                        <Grid2 item xs={12} sm={6} md={3} key={index} className="stat-item">
                            <Box elevation={2} sx={{textAlign: "center", px: 2, py: 0}}>
                                <Box className="stat-icon">{stat.icon}</Box>
                                <Typography variant="h5" component="div" gutterBottom color="primary"><Link href={stat.link} underline="none">{stat.value}</Link></Typography>
                                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Grid2>
                    ))}
                </Grid2>
            </Paper>
        </Grid2>
    );
};

export default StatBar;
StatBar.propTypes = {
    disease: PropTypes.string.isRequired,
    homeData: PropTypes.object.isRequired,
};