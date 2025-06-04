"use client"

import {useEffect, useRef} from "react"
import PropTypes from "prop-types"
import Plotly from "plotly.js-dist-min"

const DotPlot = ({markerGenes, selectedCellTypes, isAllCellTypesSelected}) => {
    const plotRef = useRef(null)

    useEffect(() => {
        if (!markerGenes || !plotRef.current || selectedCellTypes.length === 0) return

        // Get all unique cell types from the data
        const allCellTypes = Array.from(new Set(markerGenes.map((gene) => gene.MajorCellTypes))).filter(Boolean)

        // Filter genes for selected cell types (limit to 10 per cell type)
        let pooledGenes = []

        selectedCellTypes.forEach((cellType) => {
            // Filter genes that are markers for this cell type
            const cellTypeMarkers = markerGenes.filter((gene) => gene.MajorCellTypes === cellType && gene.is_marker)

            // Sort by score or another metric if available, then take top 10
            const topMarkers = cellTypeMarkers.sort((b,a) => (b.score || b.avg_expr) - (a.score || a.avg_expr)).slice(0, 10)

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
                const geneData = markerGenes.find((gene) => gene.gene === geneName && gene.MajorCellTypes === cellType)

                if (geneData) {
                    xValues.push(cellType)
                    yValues.push(geneName)

                    // Calculate percentage of cells expressing the gene
                    const percentage = geneData.n_expr_cells / geneData.celltype_n_cells
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

        // Calculate the plot height
        const plotHeight = Math.max(400, uniqueGeneNames.length * 25 + 120)

        // Make dots smaller by increasing the sizeref value
        // Higher sizeref = smaller dots
        const sizeref = 0.2 // Adjust this value to make dots smaller or larger

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
                    title: "Avg Expression",
                    thickness: 15,
                    tickvals: [0, 2, 4, 6],
                    ticktext: ["0", "2", "4", "6+"],
                    // Position the colorbar below the vertical center line
                    y: 0.5,
                    x: 0.90,
                    len: 1/(selectedCellTypes.length + 1),
                    yanchor: "top",
                },
                opacity: 0.8,
            },
            text: textValues,
            hoverinfo: "text",
            type: "scatter",
            showlegend: false,
        }

        // Create a separate div for the legend
        const legendDiv = document.createElement("div")
        legendDiv.className = "dot-size-legend"
        legendDiv.style.position = "absolute"
        legendDiv.style.top = selectedCellTypes.length * 40 + "px"
        legendDiv.style.right = "60px"
        legendDiv.style.width = "100px"
        legendDiv.style.height = "200px" // Fixed height
        legendDiv.style.pointerEvents = "none"
        legendDiv.style.zIndex = "1000"

        // Create the legend title
        const titleDiv = document.createElement("div")
        titleDiv.textContent = "Percent of Cells:"
        titleDiv.style.fontSize = "12px"
        titleDiv.style.marginBottom = "10px"
        titleDiv.style.textAlign = "center"
        legendDiv.appendChild(titleDiv)

        // Create the legend items
        const sizeLegendSizes = [20, 40, 60, 80, 100]

        // Create SVG for the legend
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttribute("width", "100")
        svg.setAttribute("height", "170")
        svg.style.display = "block"

        // Calculate the fixed spacing between legend items
        const itemSpacing = 25
        const startY = 5

        sizeLegendSizes.forEach((size, i) => {
            // Calculate circle radius based on the same sizeref as the main plot
            const radius = Math.sqrt((size / sizeref) / Math.PI )

            // Create circle
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
            circle.setAttribute("cx", "20")
            circle.setAttribute("cy", startY + i * itemSpacing)
            circle.setAttribute("r", radius)
            circle.setAttribute("fill", "rgba(0,0,0,0.7)")

            // Create text label
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
            text.setAttribute("x", "35")
            text.setAttribute("y", startY + i * itemSpacing + 4) // +4 for vertical alignment
            text.setAttribute("font-size", "10px")
            text.textContent = `${size}%`

            svg.appendChild(circle)
            svg.appendChild(text)
        })

        legendDiv.appendChild(svg)

        const layout = {
            title: `Dot Plot (${uniqueGeneNames.length} genes across ${allCellTypes.length} cell types)`,
            xaxis: {
                title: "Cell Types",
                tickangle: 45,
                domain: [0, 0.9], // Make more room for the legend on the right
            },
            yaxis: {
                title: "Genes",
                automargin: true,
            },
            margin: {
                l: 100,
                r: 50, // Increase right margin to accommodate the size legend
                b: 100,
                t: 50,
                pad: 4,
            },
            height: plotHeight,
            autosize: true,
            hovermode: "closest",
        }

        Plotly.newPlot(plotRef.current, [mainTrace], layout, {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
        })

        // Add the legend div to the plot container after Plotly has rendered
        setTimeout(() => {
            if (plotRef.current) {
                // Remove any existing legend first
                const existingLegend = plotRef.current.querySelector(".dot-size-legend")
                if (existingLegend) {
                    existingLegend.remove()
                }

                // Add the new legend
                plotRef.current.style.position = "relative"
                plotRef.current.appendChild(legendDiv)
            }
        }, 100)

        // Cleanup
        return () => {
            if (plotRef.current) {
                Plotly.purge(plotRef.current)
                const existingLegend = plotRef.current.querySelector(".dot-size-legend")
                if (existingLegend) {
                    existingLegend.remove()
                }
            }
        }
    }, [markerGenes, selectedCellTypes, isAllCellTypesSelected])

    return <div ref={plotRef} style={{width: "100%", height: "100%", minHeight: "400px"}}/>
}

DotPlot.propTypes = {
    markerGenes: PropTypes.array.isRequired,
    selectedCellTypes: PropTypes.array.isRequired,
    isAllCellTypesSelected: PropTypes.bool.isRequired,
}

export default DotPlot

