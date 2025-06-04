import Plot from "react-plotly.js";
import {isCategorical} from "../../utils/funcs.js";
import PropTypes from "prop-types";
import {groupBy} from "lodash";


const PlotlyScatterPlot = ({gene, sampleList, umapData, exprData, metaData, group}) => {
    // console.log("PlotlyScatterPlot: ", gene, metaData, group);
    if (umapData.length === 0) return "UMAP data is loading...";

    if (sampleList.length >= 1 && !sampleList.includes("all")) {
        umapData = umapData.filter((point) => sampleList.includes(point[0].split("_")[0]));
    }

    const createCategoryTraces = (plotData, colorGroup) => {
        // Generate distinct colors for each group and create a series for each group
        const colorPalette = [
            "#A7D16B", "#ADD9E9", "#A84D9D","#F68D40","#0A71B1","#016B62","#BFAFD4","#6BAED6","#7BCCC4",
            "#ff7f0e", "#1f77b4", "#2ca02c", "#da6f70", "#9467bd", "#8c564b", "#e377c2",
            "#0d1dd1", "#bcbd22", "#17becf", "#ff0000", "#00ff00", "#0000ff", "#ff00ff",
            "#00ffff", "#ffff00", "#9bed56", "#8000ff", "#0080ff", "#80ff00"
        ]; // Up to 20 unique colors

        const groupedData = groupBy(plotData, colorGroup);
        const groupNames = Object.keys(groupedData);
        const traces = groupNames.map((group_i, index) => ({
            x: groupedData[group_i].map((p) => p["x"]),
            y: groupedData[group_i].map((p) => p["y"]),
            name: group_i,
            mode: 'markers',
            type: 'scattergl',  // WebGL version,for large datasets (>10k points):
            marker: {
                color: colorPalette[index % colorPalette.length],
                size: 3,
                symbol: 'circle',
                opacity: 0.8,
            },
            hoverinfo: 'text',
            hovertext: plotData?.map((item, index) =>
                `Sample: ${item.sample_id}<br>
                ${group ? `${group}: ${item[group]}` : ''}`
            )
        }));
        return traces;
    }
    const createContinuousTraces = (plotData, colorGroup) => {
        const colorValues = plotData.map((p) => p[colorGroup]);
        const traces = [{
            x: plotData.map((p) => p["x"]),
            y: plotData.map((p) => p["y"]),
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: colorValues,
                colorscale: ["#CCCCCCFF", "#FF0000FF"], //'Reds',
                colorbar: {
                    // title: gene ? `${gene} Expression` : group,
                    titleside: 'right',
                    len: 0.3
                },
                size: 3,
                opacity: 0.8
            },
            hoverinfo: 'text',
            hovertext: plotData?.map((item, index) =>
                `Sample: ${item.sample_id}<br>
                ${gene!=="all" ? `${gene} Expr: ${colorValues[index].toFixed(2)}` : ''}
                ${group ? `${group}: ${item[group]}` : ''}`
            )
        }];
        return traces
    }

    let traces = [];
    let isCategoricalGroup = false;
    if (gene === "all") {
        //===============================
        // In this case the expression data is not needed, just use the metaData
        //===============================

        metaData = metaData ?? {};
        const plotData = umapData.map(item => ({
            "x": item[1],
            "y": item[2],
            [group]: metaData?.[item[0]]?.[group] ?? "Cell/Spot", // Works for both objects and arrays, returns 0 for undefined/null values
        })) || [];
        // console.log("plotData: ", plotData);
        isCategoricalGroup = isCategorical(Object.values(metaData).map((p) => p[group]));

        if (isCategoricalGroup) {
            traces = createCategoryTraces(plotData, group);
        } else {
            traces = createContinuousTraces(plotData, group);
        }
    } else {
        //===============================
        // In this case the expression data the continuous values
        //===============================
        const plotData = umapData.map(item => ({
            "x": item[1],
            "y": item[2],
            [gene]: exprData?.[item[0]] ?? 0, // Works for both objects and arrays, returns 0 for undefined/null values
            sample_id: item[0].split("_")[0],  // Keep identifier if needed
        })) || [];
        traces = createContinuousTraces(plotData, gene);
    }


    // Layout configuration
    const layout = {
        title: {
            text: gene==="all" ? `UMAP Plot for ${group}` : `${gene}`,
            font: {size: 18, weight: 'bold'},
            pad: { t: 10, b: 10 },
            automargin: true
        },
        showlegend: isCategoricalGroup,
        legend: {
            x: 1, y: 1,
            orientation: 'v',
            itemsizing: 'constant',
        },
        margin: {l: 50, r: 10, b: 50, t: 20, pad: 4},
        plot_bgcolor: '#f0f0f0',
        paper_bgcolor: '#f0f0f0',
        autosize: true
    };

    return (
        <Plot
            data={traces}
            layout={layout}
            style={{width: '100%', height: '100%'}}
        />
    );
};

PlotlyScatterPlot.propTypes = {
    gene: PropTypes.string.isRequired,
    sampleList: PropTypes.array.isRequired,
    umapData: PropTypes.array.isRequired,
    exprData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    group: PropTypes.string.isRequired,
};

export default PlotlyScatterPlot;
