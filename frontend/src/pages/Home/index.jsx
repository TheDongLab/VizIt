import {useEffect, useState} from "react";
import {Typography, Paper, Box, Link} from "@mui/material";
import Grid2 from "@mui/material/Grid2"; // Correct Grid2 import
import "./Home.css"; // Import the CSS file

import DiseaseSelector from "../../components/DiseaseSelector";
import BrainsideSelector from "../../components/BrainsideSelector";
import BrainRegions from "../../components/BrainRegions";
import StatBar from "../../components/StatBar";

import useHomeStore from "../../store/HomeStore.js";

const Home = () => {
    const {homeData, fetchHomeData} = useHomeStore();

    useEffect(() => {
        const res = fetchHomeData();
        console.log(res);
    }, []);

    const [selectedDisease, setSelectedDisease] = useState("PD");

    const handleDiseaseChange = (disease) => {
        setSelectedDisease(disease);
    };

    return (
        <div className="landing-page">
            <Typography variant="h3" align="center" className="title">
                {import.meta.env.VITE_APP_TITLE}
            </Typography>
            <Typography variant="h5" align="center" className="subtitle">
                Explore and analyze brain-related omics data with ease.
            </Typography>

            <Grid2 container spacing={2} className="content-grid">
                {/* Left Section */}
                <Grid2 xs={12} md={2} id="left-section">
                    <Typography variant="h6" className="section-title">
                        Brain regions
                    </Typography>
                    <Paper elevation={3} className="paper">
                        {/*<Typography variant="subtitle1" className="subsection-title">*/}
                        {/*    <strong><Link href={`datasets?brainRegion=Temporal Lobe`} underline="hover" color="inherit">Temporal Lobe(1)</Link></strong>*/}
                        {/*</Typography>*/}
                        {/*<ul>*/}
                        {/*    <li><Link href={`datasets?brainSubregion=Middle temporal gyrus`} underline="hover">Middle temporal gyrus(1)</Link></li>*/}
                        {/*</ul>*/}
                        {homeData && homeData[selectedDisease] && homeData[selectedDisease].brain_super_region ? (
                            Object.entries(homeData[selectedDisease]["brain_super_region"]).map(([key, value]) => {
                                const total_num = Object.values(value).reduce((acc, n) => acc + n, 0);
                                return (
                                    <Box key={key}>
                                        <Typography variant="subtitle1" className="subsection-title">
                                            <strong><Link href={`datasets?disease=${selectedDisease}&brainRegion=${key}`} underline="hover" color="inherit">{key + " (" + total_num + ")"}</Link></strong>
                                        </Typography>
                                        <ul>
                                            {Object.entries(value).map(([subregion, n]) => (
                                                <li key={subregion}>
                                                    <Link href={`datasets?disease=${selectedDisease}&brainSubregion=${subregion}`} underline="hover">{subregion + " (" + n + ")"}</Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </Box>
                                );
                            })
                        ) : (
                            <Typography variant="subtitle1">Loading brain regions data...</Typography>
                        )}

                    </Paper>
                </Grid2>

                {/* Middle Section (Brain Image) */}
                <Grid2 xs={12} md={5} id="middle-section">
                    <BrainsideSelector/>
                    <BrainRegions disease={selectedDisease}/>
                </Grid2>

                {/* Right Section */}
                <Grid2 xs={12} md={2} id="right-section">
                    <Typography variant="h6" className="section-title">
                        Available assays
                    </Typography>
                    <Paper elevation={3} className="paper">
                        <Typography variant="subtitle1" className="subsection-title">
                            <strong>Omics assays</strong>
                        </Typography>
                        <ul>
                            {/*<li><Link href={`datasets?assayType=snRNAseq`} underline="hover">scRNASeq(1)</Link></li>*/}
                            {/*<li><Link href={`datasets?assayType=VisiumST`} underline="hover">10X Visium ST(1)</Link></li>*/}
                            {homeData && homeData[selectedDisease] && homeData[selectedDisease].assay ? (
                                Object.entries(homeData[selectedDisease]["assay"]).map(([key, value]) => (
                                    <li key={key}><Link href={`datasets?disease=${selectedDisease}&assayType=${key}`} underline="hover">{key + " (" + value + ")"}</Link></li>
                                ))
                            ) : (
                                <Typography variant="subtitle1">Loading assay data...</Typography>
                            )}
                        </ul>
                    </Paper>
                </Grid2>
            </Grid2>
            <DiseaseSelector homeData={homeData} selectedDisease={selectedDisease} onDiseaseChange={handleDiseaseChange}/>
            {homeData && homeData[selectedDisease] ? <StatBar disease={selectedDisease} homeData={homeData} />: <Typography variant="subtitle1">Loading assay data...</Typography>}
        </div>
    );
};

export default Home;
