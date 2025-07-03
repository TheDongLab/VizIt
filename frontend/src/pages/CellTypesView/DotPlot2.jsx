"use client"

import {useEffect, useRef} from "react"
import PropTypes from "prop-types"
import Plotly from "plotly.js-dist-min"

const DotPlot2 = ({markerGenes, selectedCellTypes, isAllCellTypesSelected, mainCluster}) => {
    // console.log("DotPlot2", markerGenes, selectedCellTypes, isAllCellTypesSelected, mainCluster)

    const plotRef = useRef(null)

    useEffect(() => {
        if (!markerGenes || !plotRef.current || selectedCellTypes.length === 0) return

        // Get all unique cell types from the data
        const allCellTypes = Array.from(new Set(markerGenes.map((gene) => gene[mainCluster]))).filter(Boolean)

        // Filter genes for selected cell types (limit to 10 per cell type)
        let pooledGenes = []

        selectedCellTypes.forEach((cellType) => {
            // Filter genes that are markers for this cell type
            const cellTypeMarkers = markerGenes.filter((gene) => gene[mainCluster] === cellType && gene.is_marker)

            // Sort by score or another metric if available, then take top 10
            const topMarkers = cellTypeMarkers.sort((a, b) => (a.score || a.avg_expr) - (b.score || b.avg_expr)).slice(0, 10)

            // Add to pooled genes with source cell type
            pooledGenes = [
                ...pooledGenes,
                ...topMarkers.map((gene) => ({
                    ...gene,
                    sourceCellType: cellType, // Track which cell type this gene came from
                })),
            ]
        })

        // Get unique gene names from pooled marker genes
        const uniqueGeneNames = Array.from(new Set(pooledGenes.map((gene) => gene.gene)))

        // Prepare data for the dot plot
        const xValues = [] // Cell types
        const yValues = [] // Gene names
        const sizeValues = [] // Percentage of cells expressing the gene
        const colorValues = [] // Average expression
        const textValues = [] // Hover text

        // For each gene and cell type combination, find the expression data
        uniqueGeneNames.forEach((geneName) => {
            // Find the source cell type for this gene (which cell type it's a marker for)
            const sourceGene = pooledGenes.find((gene) => gene.gene === geneName)
            const sourceType = sourceGene ? sourceGene.sourceCellType : "Unknown"

            allCellTypes.forEach((cellType) => {
                // Find the gene data for this cell type
                const geneData = markerGenes.find((gene) => gene.gene === geneName && gene[mainCluster] === cellType)

                if (geneData) {
                    xValues.push(cellType)
                    yValues.push(geneName)

                    // Calculate percentage of cells expressing the gene
                    const percentage = geneData.n_expr_cells / geneData.cluster_n_cells
                    sizeValues.push(percentage * 100) // Scale to percentage

                    // Cap avg_expr at 6
                    const avgExpr = Math.min(geneData.avg_expr, 6)
                    colorValues.push(avgExpr)

                    textValues.push(
                        `Gene: ${geneName}<br>` +
                        `Cell Type: ${cellType}<br>` +
                        `Avg Expression: ${geneData.avg_expr.toFixed(2)}<br>` +
                        `% Cells: ${(percentage * 100).toFixed(1)}%<br>` +
                        `Marker for: ${sourceType}`,
                    )
                } else {
                    // If no data for this gene in this cell type, add placeholder with zero values
                    xValues.push(cellType)
                    yValues.push(geneName)
                    sizeValues.push(0)
                    colorValues.push(0)
                    textValues.push(
                        `Gene: ${geneName}<br>` +
                        `Cell Type: ${cellType}<br>` +
                        `Avg Expression: 0<br>` +
                        `% Cells: 0%<br>` +
                        `Marker for: ${sourceType}`,
                    )
                }
            })
        })

        const maxPercentage = Math.max(...sizeValues)
        // Make dots smaller by increasing the sizeref value
        // Higher sizeref = smaller dots
        const sizeref = maxPercentage / 100 * 0.6

        // Create the main dot plot trace
        const mainTrace = {
            x: xValues,
            y: yValues,
            mode: "markers",
            marker: {
                size: sizeValues,
                sizemode: "area",
                sizeref: sizeref, // Use adjusted sizeref for smaller dots
                sizemin: 1, // Minimum dot size
                color: colorValues,
                colorscale: "Viridis", // Use a color scale that works well for expression data
                colorbar: {
                    title: {text: "AvgExpr", side: "top", font: {size: 12}},
                    thickness: 15,
                    tickvals: [0, 2, 4, 6],
                    ticktext: ["0", "2", "4", "6+"],
                    // Position the colorbar below the vertical center line
                    y: 0.85,
                    len: 1 / (selectedCellTypes.length + 1),
                    yanchor: "top",
                },
                opacity: 0.8,
            },
            text: textValues,
            hoverinfo: "text",
            type: "scatter",
            showlegend: false,
        }

        // Create legend traces with actual circles
        const sizeLegendSizes = [20]
        const legendTraces = []

        const bubbleSpacing = 0.12 / selectedCellTypes.length;
        const firstDotY = 0.7;
        const titleOffset = 0.12 / selectedCellTypes.length; // fixed distance above first dot


        // Create a separate trace for each legend dot
        sizeLegendSizes.forEach((size, i) => {
            legendTraces.push({
                x: [1.1], // Position in the legend area
                y: [firstDotY - i * bubbleSpacing], // Vertical position
                mode: "markers+text",
                type: "scatter",
                marker: {
                    size: [size], // Use the actual size value
                    sizemode: "area",
                    sizeref: sizeref, // Use the same sizeref as the main plot
                    color: "rgba(0,0,0,0.7)",
                },
                text: [`${size}%`],
                textposition: 'right center',
                showlegend: false,
                hoverinfo: "none",
                xaxis: "x2", // Use a secondary x-axis for the legend
                yaxis: "y2", // Use a secondary y-axis for the legend
            })
        })

        legendTraces.push({
            x: [1.1],
            y: [firstDotY + titleOffset], // Adjust this based on your legend layout
            mode: "text",
            type: "scatter",
            text: ["PctExpr"],
            textposition: "bottom right",
            showlegend: false,
            hoverinfo: "none",
            xaxis: "x2",
            yaxis: "y2",
            textfont: {
                size: 12,
                color: "black",
                family: "Arial",
            },
        })

        const layout = {
            title: {text: `Dot Plot (${uniqueGeneNames.length} genes across ${allCellTypes.length} clusters)`},
            grid: {
                rows: 1,
                columns: 2,
                pattern: "independent",
            },
            xaxis: {
                title: "Cell Types",
                tickangle: 90,
                // Reduce space between axis and plot
                automargin: true,
                tickfont: {size: 8},
                zeroline: true,
                showgrid: true,
                showline: true,
                domain: [0, 0.94], // Make more room for the legend on the right
            },
            yaxis: {
                title: "Genes",
                automargin: true,
            },
            // Secondary axes for the legend
            xaxis2: {
                domain: [0.9, 1], // Legend area
                showgrid: false,
                showticklabels: false,
                range: [1, 1.2], // Fixed range for legend
            },
            yaxis2: {
                domain: [0, 1],
                showgrid: false,
                zeroline: false,
                showticklabels: false,
                range: [0, 1], // Fixed range for legend
                anchor: "x2",
            },
            margin: {
                l: 100,
                r: 50, // Increase right margin to accommodate the size legend
                b: 100,
                t: 30,
                pad: 4,
            },
            height: Math.max(400, uniqueGeneNames.length * 30 + 120), // Dynamic height based on number of genes
            autosize: true,
            hovermode: "closest",
            // Adjust the plot padding
            // plot_bgcolor: "rgba(255,0,0,0)",
            // paper_bgcolor: "rgba(0,255,0,0)",
            bargap: 0,
            bargroupgap: 0,
        }

        // Combine main trace with legend traces
        const allTraces = [mainTrace, ...legendTraces]

        Plotly.newPlot(plotRef.current, allTraces, layout, {
            responsive: true,
            displaylogo: false,
        })

        // Cleanup
        return () => {
            if (plotRef.current) {
                Plotly.purge(plotRef.current)
            }
        }
    }, [markerGenes, selectedCellTypes, isAllCellTypesSelected])

    return <div ref={plotRef} style={{width: "100%", height: "100%", minHeight: "400px"}}/>
}

DotPlot2.propTypes = {
    markerGenes: PropTypes.array.isRequired,
    selectedCellTypes: PropTypes.array.isRequired,
    isAllCellTypesSelected: PropTypes.bool.isRequired,
    mainCluster: PropTypes.string.isRequired
}

export default DotPlot2

