import {useEffect} from "react";
import {Box, Typography, Divider} from "@mui/material";

import FilterPanel from "./FilterPanel";
import SamplesDisplay from "./SamplesDisplay.jsx";
import "./SamplesPage.css";
import useDataStore from "../../store/DatatableStore.js";
import {useParams} from "react-router-dom";

const SamplesPage = () => {
    // get dataset_id from url
    // const dataset_id = window.location.pathname.split("/")[2];
    const { dataset_id } = useParams(); // Extracts dataset_id from the URL

    const {sampleRecords,fetchSampleData} = useDataStore();
    useEffect(() => {
        fetchSampleData({dataset_id})
    }, [fetchSampleData]);

    return (
        <div className="data-page-container" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h4">Explore data resources
                </Typography>
            </Box>
            <Divider />

            {/* Main Content */}
            <Box className="main-content" style={{ flex: 2, display: 'flex', flexDirection: 'row' }}>
                {/* Left Filter Panel */}
                {/*<FilterPanel />*/}
                {/* Right Sample Display Area */}
                <SamplesDisplay dataRecords={sampleRecords} />
            </Box>
        </div>
    );
};

export default SamplesPage;
