import React from "react";
import Plot from "react-plotly.js";
import {groupBy} from "lodash";
import PropTypes from "prop-types";

const PlotlyViolinPlot = ({gene, geneData, sampleData, metaData, group}) => {
    if (sampleData.length >= 1 && !sampleData.includes("all")) {
        metaData = metaData.filter((meta) => sampleData.includes(meta.sample_id));
    }
    if(metaData.length === 0) return "Sample not found in the MetaData";

    if (gene === "all") return null;

    const groupedData = groupBy(metaData, group);
    const xCategories = Object.keys(groupedData);

    const traces = xCategories.map((cellType) => ({
        type: "violin",
        name: cellType,
        y: groupedData[cellType].map((d) => {
            return geneData[d.cs_id] ?? 0
        }),
        box: {visible: false}, // Show box plot inside violin
        meanline: {visible: true}, // Show mean line
        points: false, // Show all data points
        jitter: 0.3, // Spread out points for visibility
        scalemode: "width",
        line: {width: 1},
        fillcolor: "rgba(50, 100, 250, 0.5)",
    }));

    const layout = {
        title: {},
        yaxis: {
            title: {text: gene, font: {size: 12}},
            automargin: true, // Prevent axis labels from being cut off
        },
        xaxis: {
            automargin: true,
            type: "category",
        },
        margin: {t: 5, b: 50, l: 50, r: 10}, // Reduce white space
        showlegend: false,
    };

    return <Plot data={traces} layout={layout} style={{width: "100%", height: "200px"}}/>;
};

PlotlyViolinPlot.propTypes = {
    gene: PropTypes.string.isRequired,
    geneData: PropTypes.object.isRequired,
    sampleData: PropTypes.array.isRequired,
    metaData: PropTypes.array.isRequired,
    group: PropTypes.string.isRequired,
};

export default PlotlyViolinPlot;
