import Plot from 'react-plotly.js';
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";


const PlotlyStackedViolin = ({gene, exprData, metaData, group, includeZeros, type = "violin"}) => {
    if (metaData.length === 0) return "Sample not found in the MetaData";
    if (gene !== "stackedviolin") return null;

    //Create expressionData:
    // {
    //      GeneX:{
    //          groupX: [expr1, expr2, expr3,...],
    //          groupY: [expr1, expr2, expr3,...]
    //          },
    //       GeneY: {...}
    // }
    const groupedData = {};
    for (const [id, attrs] of Object.entries(metaData)) {
        const key = attrs[group];  // Grouping key (e.g., celltype, sex, etc.)
        (groupedData[key] ||= []).push(id);
    }
    const expressionData = {};

    for (const gene of Object.keys(exprData)) {
        const geneGroupData = {};

        for (const [groupValue, cellIds] of Object.entries(groupedData)) {
            const expressionValues = [];
            for (const id of cellIds) {
                if (exprData[gene]?.[id] !== undefined) {
                    expressionValues.push(exprData[gene][id]);
                } else{
                    includeZeros && expressionValues.push(0);
                }
            }

            if (expressionValues.length === 0) {
                expressionValues.push(0); // Add a dummy value if there are no relevant IDs
            }

            geneGroupData[groupValue] = expressionValues;
        }

        expressionData[gene] = geneGroupData;
    }

    const genes = Object.keys(exprData);
    const xCategories = Object.keys(groupedData).sort();
    const colorPalette = [
        "#A7D16B", "#ADD9E9", "#A84D9D", "#F68D40", "#0A71B1", "#016B62", "#BFAFD4", "#6BAED6", "#7BCCC4",
        "#ff7f0e", "#1f77b4", "#2ca02c", "#da6f70", "#9467bd", "#8c564b", "#e377c2",
        "#0d1dd1", "#bcbd22", "#17becf", "#ff0000", "#00ff00", "#0000ff", "#ff00ff",
        "#00ffff", "#ffff00", "#9bed56", "#8000ff", "#0080ff", "#80ff00"
    ]; // Up to 20 unique colors
    // Create Plotly traces for each gene
    const createTraces = () => {
        return genes.map((gene, geneIndex) => {
            const traces = xCategories.map((x_i, xIndex) => {
                return {
                    x: Array(expressionData[gene][x_i].length).fill(x_i),
                    y: expressionData[gene][x_i],
                    type: 'violin',
                    name: `${gene} - ${x_i}`,
                    box: {visible: type === "boxplot"},
                    points: type === "boxplot", // Show all data points
                    meanline: {visible: true},
                    showlegend: false,
                    xaxis: `x${geneIndex + 1}`,
                    yaxis: `y${geneIndex + 1}`,
                    scalemode: "count",
                    line: {width: 1, color: "black"},
                    jitter: 0.3,
                    fillcolor: colorPalette[xIndex % colorPalette.length],
                };
            });
            return traces;
        }).flat();
    };
    // Create subplot layout
    const createLayout = () => {
        const rows = genes.length;
        const totalHeight = 150 * rows + 50; // Dynamically adjust height
        const layout = {
            grid: {rows, columns: 1, pattern: 'independent',},
            height: totalHeight, // Adjust height based on number of genes
            title: 'Stacked Plot',
            paper_bgcolor: '#F9F9F9',
            plot_bgcolor: '#F9F9F9',
            margin: {t: 5, b: 50, l: 50, r: 50}, // Reduce white space
            annotations: [],
            yaxis: {
                // type: type === "boxplot" ? "log" : "-",
                // dtick: type === "boxplot" ? Math.log10(2) : "auto",
            }
        };

        genes.forEach((gene, index) => {
            const rowHeightFraction = 1 / rows;
            const yMin = 1 - (index + 1) * rowHeightFraction;
            const yMax = 1 - index * rowHeightFraction;

            layout[`xaxis${index + 1}`] = {
                title: index === genes.length - 1 ? 'Cell Type' : '',
                range: [-0.5, xCategories.length - 0.5],
                showticklabels: index === genes.length - 1,
                automargin: true,
                type: "category",
            };
            // layout[`yaxis${index + 1}`] = {
            //     title: {text: gene, font: {size: 12}},
            //     automargin: true, // Prevent axis labels from being cut off
            //     domain: [yMin, yMax], // Reduce space between rows
            // };
            layout.annotations.push({
                x: -0.01, // Position to the left of y-axis
                y: (yMin + yMax) / 2,
                text: gene,
                showarrow: false,
                xref: "paper",
                yref: "paper",
                font: {size: 12, color: "black"},
                yanchor: "middle",
                xanchor: "right",
                valign: "middle",
                textangle: 270,
            });
        });

        return layout;
    };

    return (
        <Plot
            divId={`geneview-gene-plot`}
            data={createTraces()}
            layout={createLayout()}
            style={{width: '100%', height: '100%'}}
            config={{
                displayModeBar: true,
                displaylogo: false,
                responsive: true,
                doubleClick: false,
                toImageButtonOptions: {
                    name: "Save as SVG",
                    format: 'svg', // one of png, svg, jpeg, webp
                    filename: `stacked_violin`,
                    scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
                },
                modeBarButtonsToAdd: [
                    [
                        {
                            name: "Save as SVG",
                            icon: Plotly.Icons.disk,
                            click: function (gd) {Plotly.downloadImage(gd, {format: "svg", filename: `stacked_violin`});},
                        },
                    ],
                ],
            }}
        />
    );
};
PlotlyStackedViolin.propTypes = {
    gene: PropTypes.string.isRequired,
    exprData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    group: PropTypes.string.isRequired,
    includeZeros: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired
};
export default PlotlyStackedViolin;