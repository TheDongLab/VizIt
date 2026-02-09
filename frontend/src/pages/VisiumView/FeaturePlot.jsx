import React from "react";
import {Box, Typography} from "@mui/material";
import PropTypes from "prop-types";
import PlotlyFeaturePlotMerfish from "./MerfishPlotlyPlot.jsx";
import PlotlyFeaturePlotVisium from "./VisiumPlotlyPlot.jsx";

const FeaturePlot = React.memo(function FeaturePlot({assayType,visiumData, geneData, metaData, feature, showImage=false}) {
    console.log("showImage", showImage);
    if (assayType.toLowerCase().startsWith("visium")) {
        return <PlotlyFeaturePlotVisium visiumData={visiumData} geneData={geneData} metaData={metaData} feature={feature} showImage={showImage}/>;
    } else if (assayType.toLowerCase().startsWith("merfish")) {
        return <PlotlyFeaturePlotMerfish visiumData={visiumData} geneData={geneData} metaData={metaData} feature={feature} showImage={showImage}/>;
    } else {
        return (
            <Box className="no-feature">
                <Typography sx={{color: "text.secondary"}} variant="h5">
                    Assay type not set correctly!
                </Typography>
            </Box>
        )
    }
});

FeaturePlot.propTypes = {
    assayType: PropTypes.string.isRequired,
    visiumData: PropTypes.shape({
        coordinates: PropTypes.object.isRequired,
        scales: PropTypes.object || null,
        image: PropTypes.object || {},
    }).isRequired,
    geneData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    feature: PropTypes.string.isRequired,
    showImage: PropTypes.bool.isRequired
};

export default FeaturePlot;
