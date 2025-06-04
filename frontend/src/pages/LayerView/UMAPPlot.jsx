"use client"

import {useEffect, useRef} from "react"
import PropTypes from "prop-types"
import Plotly from "plotly.js-dist-min"

const UMAPPlot = ({umapData, metaData, selectedCellTypes, isAllCellTypesSelected, mainCluster}) => {
    console.log("UMAPPlot", umapData, metaData, selectedCellTypes, isAllCellTypesSelected, mainCluster)
    const plotRef = useRef(null)

    const {cell_metadata, sample_metadata, cell_metadata_mapping} = metaData
    const updatedCellMetaData = Object.fromEntries(
        Object.entries(cell_metadata??{}).map(([cs_id, csObj]) => {
            const newSubObj = {...csObj};  // shallow copy of inner object
            const targetValue = csObj[mainCluster];
            newSubObj[mainCluster] = cell_metadata_mapping[mainCluster]?.[targetValue]?.[0];
            return [cs_id, newSubObj];
        })
    );

    // console.log("cell_metadata", cell_metadata)
    // console.log("updatedCellMetaData", updatedCellMetaData)

    useEffect(() => {
        if (!umapData || !metaData || !plotRef.current) return

        const colorPalette = [
            "#ff7f0e", "#1f77b4", "#2ca02c", "#da6f70", "#9467bd", "#8c564b", "#e377c2",
            "#0d1dd1", "#bcbd22", "#17becf", "#ff0000", "#00ff00", "#0000ff", "#ff00ff",
            "#00ffff", "#ffff00", "#9bed56", "#8000ff", "#0080ff", "#80ff00"
        ]; // Up to 20 unique colors

        // cell type colors
        const cellTypeColors = {}
        selectedCellTypes.forEach((cellType) => {
            cellTypeColors[cellType] = colorPalette[selectedCellTypes.indexOf(cellType) % colorPalette.length]
        })

        const traces = []

        if (isAllCellTypesSelected) {
            // Group by cell type for coloring
            const cellTypeGroups = {}

            umapData.forEach((point) => {
                const cellType = updatedCellMetaData[point[0]]?.[mainCluster] || "Other"
                if (!cellTypeGroups[cellType]) {
                    cellTypeGroups[cellType] = {x: [], y: [], text: [], ids: []}
                }

                cellTypeGroups[cellType].x.push(point[1])
                cellTypeGroups[cellType].y.push(point[2])
                cellTypeGroups[cellType].text.push(cellType)
                cellTypeGroups[cellType].ids.push(point[0])
            })

            // Create a trace for each cell type
            Object.entries(cellTypeGroups).forEach(([cellType, points]) => {
                traces.push({
                    x: points.x,
                    y: points.y,
                    text: points.text,
                    ids: points.ids,
                    mode: "markers",
                    type: "scattergl",
                    name: cellType,
                    marker: {size: 4, opacity: 0.8,},
                    hoverinfo: "text",
                })
            })
        } else {
            // Single trace with highlighted cell types
            const x = []
            const y = []
            const text = []
            const colors = []

            umapData.forEach((point) => {
                const cellType = updatedCellMetaData?.[point[0]]?.[mainCluster] ?? "Other"
                const isSelected = selectedCellTypes.includes(cellType)

                x.push(point[1])
                y.push(point[2])
                text.push(cellType)

                // Highlight selected cell types
                colors.push(isSelected ? cellTypeColors[cellType] : "rgba(200, 200, 200, 0.3)")
            })

            traces.push({
                x, y, text,
                mode: "markers",
                type: "scattergl",
                marker: {size: 4, color: colors,},
                hoverinfo: "text",
            })
        }

        const layout = {
            title: "UMAP Visualization of Cell Types",
            xaxis: {title: "UMAP_1", zeroline: true, showgrid: false, visible: false},
            yaxis: {title: "UMAP_2", zeroline: true, showgrid: false, visible: false},
            hovermode: "closest",
            showlegend: isAllCellTypesSelected,
            legend: {x: 1, y: 0.5,},
            margin: {l: 50, r: 50, b: 50, t: 50, pad: 4,},
            autosize: true,
            plot_bgcolor: "rgba(0,0,0,0)",
            paper_bgcolor: "rgba(0,0,0,0)",
        }

        Plotly.newPlot(plotRef.current, traces, layout, {
            responsive: true,
            displaylogo: false, // Removes the Plotly logo
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
        })

        // Cleanup
        return () => {
            if (plotRef.current) {
                Plotly.purge(plotRef.current)
            }
        }
    }, [umapData, metaData, selectedCellTypes, isAllCellTypesSelected])

    return <div ref={plotRef} style={{width: "100%", height: "100%"}}/>
}

UMAPPlot.propTypes = {
    umapData: PropTypes.array.isRequired,
    metaData: PropTypes.object.isRequired,
    selectedCellTypes: PropTypes.array.isRequired,
    isAllCellTypesSelected: PropTypes.bool.isRequired,
    mainCluster: PropTypes.string.isRequired
}

export default UMAPPlot

