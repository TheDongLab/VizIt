import {Box, Typography, Link} from "@mui/material";
import {Description} from "@mui/icons-material";
import "./StatBar.css";
import {Dna, DnaOff, Images, Folders,LandPlot} from "lucide-react";
import PropTypes from "prop-types";

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
        <Box className="stat-bar-container">
            {stats.map((stat, index) => (
                <Box key={index} className="stat-item">
                    <Link href={stat.link} underline="hover">
                        <Box className="stat-icon">{stat.icon}</Box>
                        <Typography variant="h5" className="stat-number">{stat.value}</Typography>
                        <Typography variant="body1" className="stat-label">{stat.label}</Typography>
                    </Link>
                </Box>
            ))}
        </Box>
    );
};

export default StatBar;
StatBar.propTypes = {
    disease: PropTypes.string.isRequired,
    homeData: PropTypes.object.isRequired,
};