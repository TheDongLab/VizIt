import {useEffect} from "react";
import {Box, Typography, Divider} from "@mui/material";

import FilterPanel from "./FilterPanel";
import DatasetDisplay from "./DatasetDisplay.jsx";
import "./DatasetPage.css";
import useDataStore from "../../store/DatatableStore.js";

const DatasetsPage = () => {
    const {datasetRecords,fetchDatasetList} = useDataStore();
    useEffect(() => {
        fetchDatasetList()
    }, [fetchDatasetList]);

    return (
        <div className="data-page-container" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h4">All datasets
                </Typography>
            </Box>
            <Divider />

            {/* Main Content */}
            <Box className="main-content" style={{ flex: 2, display: 'flex', flexDirection: 'row' }}>
                {/* Left Filter Panel */}
                <FilterPanel />
                {/* Right Sample Display Area */}
                <DatasetDisplay dataRecords={datasetRecords} />
            </Box>
        </div>
    );
};

export default DatasetsPage;
