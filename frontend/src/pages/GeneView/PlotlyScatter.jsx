import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import {isCategorical} from "../../utils/funcs.js";
import PropTypes from "prop-types";
import {groupBy} from "lodash";
import React from "react";

const PlotlyScatterPlot = React.memo(function PlotlyScatterPlot({
                               gene, sampleList, umapData, exprData,
                               cellMetaData, CellMetaMap, sampleMetaData,
                               group, isMetaDataLoading
                           }){
    // console.log("PlotlyScatterPlot: ", gene, metaData, group);
    if (umapData.length === 0) return "UMAP data is loading...";

    // Add this new check
    // if (gene === "all" && isMetaDataLoading) {
    //     // Show a basic plot without coloring when metadata is still loading
    //     const plotData = umapData.map((item) => ({
    //         x: item[1],
    //         y: item[2],
    //     }));
    //     return (
    //         <Plot data={[
    //             {
    //                 x: plotData.map((p) => p["x"]),
    //                 y: plotData.map((p) => p["y"]),
    //                 mode: 'markers',
    //                 type: 'scattergl',  // WebGL version,for large datasets (>10k points):
    //                 marker: {
    //                     color: "#CCCCCCFF",
    //                     size: 3,
    //                     symbol: 'circle',
    //                     opacity: 0.8,
    //                 },
    //                 hoverinfo: 'text',
    //                 hovertext: plotData?.map((item) =>
    //                     `Sample: ${item.cs_id}`
    //                 )
    //             }
    //         ]}
    //               layout={{
    //                   title: {
    //                       text: "UMAP (Metadata loading...)",
    //                       font: {size: 18, weight: 'regular'},
    //                       pad: {t: 10, b: 10},
    //                       automargin: true
    //                   },
    //                   xaxis: {title: "UMAP_1", zeroline: true, showgrid: false, visible: false},
    //                   yaxis: {title: "UMAP_2", zeroline: true, showgrid: false, visible: false},
    //                   plot_bgcolor: '#f5f5f5',
    //                   paper_bgcolor: '#f5f5f5',
    //               }}
    //               config={{displaylogo: false}}
    //               style={{width: "100%", height: "100%"}}
    //         />
    //     );
    // }

    if (sampleList.length >= 1 && !sampleList.includes("all")) {
        umapData = umapData.filter((point) => sampleList.includes(point[0].split(/_[cs]\d+$/)[0]));
    }

    const createCategoryTraces = (plotData, colorGroup) => {
        // Generate distinct colors for each group and create a series for each group
        const colorPalette = [
            "#CCCCCC","#A7D16B", "#ADD9E9", "#A84D9D", "#F68D40", "#0A71B1", "#016B62", "#BFAFD4", "#6BAED6", "#7BCCC4",
            "#ff7f0e", "#1f77b4", "#2ca02c", "#da6f70", "#9467bd", "#8c564b", "#e377c2",
            "#0d1dd1", "#bcbd22", "#17becf", "#ff0000", "#00ff00", "#0000ff", "#ff00ff",
            "#00ffff", "#ffff00", "#9bed56", "#8000ff", "#0080ff", "#80ff00"
        ]; // Up to 20 unique colors

        const groupedData = groupBy(plotData, colorGroup);
        const groupNames = Object.keys(groupedData).sort();
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
            hovertext: plotData?.map((item) =>
                `Sample: ${item.cs_id}${group_i ? ` - ${group_i}` : ''}`
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
                    len: 0.5,
                    thickness: 10
                },
                size: 3,
                opacity: 0.8
            },
            hoverinfo: 'text',
            hovertext: plotData?.map((p, index) =>
                `Sample: ${p.cs_id}<br>${gene !== "all" ? `${gene} Expr: ${colorValues[index].toFixed(2)}` : ''}<br>${group ? `${group}: ${p[group]}` : ''}`
            )
        }];
        return traces
    }

    let traces = [];
    let isCategoricalGroup = false;
    const cell_level_meta = Object.keys(CellMetaMap ?? {});
    let updatedCellMetaData = {};
    if (cell_level_meta.includes(group)) {
        // Create a **new object** with changes
        updatedCellMetaData = Object.fromEntries(
            Object.entries(cellMetaData).map(([cs_id, csObj]) => {
                const newSubObj = {...csObj};  // shallow copy of inner object
                const targetValue = csObj[group];
                newSubObj[group] = CellMetaMap[group][targetValue][0];
                return [cs_id, newSubObj];
            })
        );
    } else {
        updatedCellMetaData = Object.fromEntries(
            Object.entries(cellMetaData).map(([cs_id, csObj]) => {
                const sample_id = cs_id.split(/_[cs]\d+$/)[0];
                const newSubObj = {...csObj};  // shallow copy of inner object
                newSubObj[group] = sampleMetaData[sample_id][group];
                return [cs_id, newSubObj];
            })
        );
    }
    if (gene === "all") {
        //===============================
        // In this case the expression data is not needed, just use the metaData
        //===============================
        const plotData = umapData.map(item => ({
            "x": item[1],
            "y": item[2],
            [group]: updatedCellMetaData?.[item[0]]?.[group] ?? "Cell/Spot", // Works for both objects and arrays, returns 0 for undefined/null values
            cs_id: item[0],
        })) || [];
        // console.log("plotData: ", plotData);
        if (/(mmse|updrs)/i.test(group)) {
            isCategoricalGroup = false
        }else{
            isCategoricalGroup = isCategorical(Object.values(updatedCellMetaData).map((p) => p[group]))
        }

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
            [group]: updatedCellMetaData?.[item[0]]?.[group] ?? "Cell/Spot", // Works for both objects and arrays, returns 0 for undefined/null values
            cs_id: item[0],
        })) || [];
        traces = createContinuousTraces(plotData, gene);
    }


    // Layout configuration
    const layout = {
        title: {
            text: gene === "all" ? (isMetaDataLoading ? "UMAP (Metadata loading...)" : `UMAP Plot for ${group}`) : `${gene}`,
            font: {size: 18, weight: 'regular'},
            pad: {t: 10, b: 10},
            automargin: true
        },
        xaxis: {title: "UMAP_1", zeroline: true, showgrid: false, visible: false},
        yaxis: {title: "UMAP_2", zeroline: true, showgrid: false, visible: false},
        showlegend: isCategoricalGroup,
        // showlegend: true,
        legend: {
            x: 1, y: 1,
            orientation: 'v',
            itemsizing: 'constant',
        },
        margin: {l: 50, r: 20, b: 50, t: 20, pad: 4},
        plot_bgcolor: '#f5f5f5',
        paper_bgcolor: '#f5f5f5',
        autosize: true,
    };

    return (
        // <div style={{ display: 'flex' }}>
        //   {/* 图表区域 */}
        //   <div style={{ flex: 1, height: '100%' }}>
        //     <Plot data={traces} layout={layout} style={{width: '100%', height: '100%', minWidth: '600px', minHeight: '600px'}} />
        //   </div>
        //
        //   {/* 自定义图例 */}
        //   <div style={{ height: '75%', overflow: 'auto', backgroundColor: '#f5f5f5', fontSize: '10px', marginTop: '100px'}}>
        //     {traces.map((trace, i) => (
        //       <div key={i}>
        //         <span style={{ color: trace.marker.color }}>■</span>{trace.name}
        //       </div>
        //     ))}
        //   </div>
        // </div>
        <Plot
            data={traces}
            layout={layout}
            style={{width: '100%', height: '100%'}}
            config={{
                displaylogo: false,
                responsive: true,
                doubleClick: false,
                toImageButtonOptions: {
                    name: "Save as SVG",
                    format: 'svg', // one of png, svg, jpeg, webp
                    filename: `UMAP.${gene}.${group}.${sampleList.join('_')}`,
                    scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
                },
                modeBarButtonsToAdd: [
                    [
                        {
                            name: "Save as SVG",
                            icon: Plotly.Icons.disk,
                            click: function (gd) {
                                Plotly.downloadImage(gd, {format: "svg", filename: `UMAP.${gene}.${group}.${sampleList.join('_')}`});
                            },
                        },
                    ],
                ],
            }}
        />
    );
});

PlotlyScatterPlot.propTypes = {
    gene: PropTypes.string.isRequired,
    sampleList: PropTypes.array.isRequired,
    umapData: PropTypes.array.isRequired,
    exprData: PropTypes.object.isRequired,
    cellMetaData: PropTypes.object,
    sampleMetaData: PropTypes.object,
    CellMetaMap: PropTypes.object,
    group: PropTypes.string.isRequired,
    isMetaDataLoading: PropTypes.bool,
};

export default PlotlyScatterPlot;
