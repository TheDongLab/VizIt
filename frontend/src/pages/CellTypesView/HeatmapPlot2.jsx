"use client"

import {useEffect, useRef, useState} from "react"
import PropTypes from "prop-types"
import Plotly from "plotly.js-dist-min"
import {FormControl, InputLabel, Select, MenuItem} from "@mui/material"

const HeatmapPlot2 = ({diffExpGenes, selectedCellTypes}) => {
    console.log("diffExpGenes: ", diffExpGenes, selectedCellTypes)

    const plotRef = useRef(null)
    const [selectedCellType, setSelectedCellType] = useState("")
    const [compareList, setCompareList] = useState([]) // List of available comparisons
    const [selectedCompare, setSelectedCompare] = useState("") // Selected comparison

    // Update cell type when selectedCellTypes changes
    useEffect(() => {
        if (selectedCellTypes.length > 0 && !selectedCellType) {
            setSelectedCellType(selectedCellTypes[0])
        }
    }, [selectedCellTypes, selectedCellType])

    // Update compare list when selectedCellType changes
    useEffect(() => {
        if (selectedCellType && diffExpGenes && diffExpGenes[selectedCellType]) {
            const availableCompares = Object.keys(diffExpGenes[selectedCellType])
            setCompareList(availableCompares)

            // Set the first comparison as default if none is selected
            if (availableCompares.length > 0 && !selectedCompare) {
                setSelectedCompare(availableCompares[0])
            }
        }
    }, [selectedCellType, diffExpGenes, selectedCompare])

    // Update the plot when selectedCellType or selectedCompare changes
    useEffect(() => {
        if (!diffExpGenes || !plotRef.current || !selectedCellType || !selectedCompare) return
        if (!diffExpGenes[selectedCellType] || !diffExpGenes[selectedCellType][selectedCompare]) return

        const cellTypeData = diffExpGenes[selectedCellType][selectedCompare]

        // Extract conditions from the comparison string (format: "Cond1vsCond2")
        const compareMatch = selectedCompare.match(/(.+)vs(.+)/)
        const condition1 = compareMatch ? compareMatch[1] : "Condition1"
        const condition2 = compareMatch ? compareMatch[2] : "Condition2"

        // Get top 10 up and top 10 down genes
        const upGenes = cellTypeData
        .filter((gene) => gene.avg_log2FC > 0)
        .sort((a, b) => b.avg_log2FC - a.avg_log2FC)
        .slice(0, 10)

        const downGenes = cellTypeData
        .filter((gene) => gene.avg_log2FC < 0)
        .sort((a, b) => a.avg_log2FC - b.avg_log2FC)
        .slice(0, 10)

        // Combine genes for the heatmap
        const genes = [...upGenes, ...downGenes]

        if (genes.length === 0) {
            // Handle case where no genes are available
            Plotly.newPlot(
                plotRef.current,
                [],
                {
                    title: `No differentially expressed genes found for ${selectedCellType} (${selectedCompare})`,
                },
                {
                    responsive: true,
                    displaylogo: false,
                },
            )
            return
        }

        // Prepare data for heatmap
        const geneNames = genes.map((gene) => gene.gene)

        // Filter samples by the extracted conditions
        const cond1Samples = genes[0].expression.filter((exp) => exp.condition === condition1).map((exp) => exp.sampleId)
        const cond2Samples = genes[0].expression.filter((exp) => exp.condition === condition2).map((exp) => exp.sampleId)
        const allSamples = [...cond1Samples, ...cond2Samples]

        // Create z-values matrix (expression values)
        const exprValues = genes.map((gene) => {
            return allSamples.map((sampleId) => {
                const sampleExp = gene.expression.find((exp) => exp.sampleId === sampleId)
                return sampleExp ? sampleExp.value : 0
            })
        })

        // Z-score normalize the expression values for better visualization
        const ZValues = exprValues.map((row) => {
            const mean = row.reduce((sum, val) => sum + val, 0) / row.length
            const stdDev = Math.sqrt(row.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / row.length)
            return row.map((val) => (val - mean) / (stdDev || 1)) // Avoid division by zero
        })

        // Create annotation to mark the boundary between conditions
        const annotations = [
            {
                x: cond1Samples.length - 0.5,
                y: -1,
                xref: "x",
                yref: "y",
                text: `${condition1} | ${condition2}`,
                showarrow: false,
                font: {
                    family: "Arial",
                    size: 12,
                    color: "black",
                },
            },
        ]

        // Add annotations for up and down regulated genes
        annotations.push({
            x: -1.5,
            y: 4.5,
            xref: "x",
            yref: "y",
            text: `Up in ${condition1}`,
            showarrow: false,
            textangle: 270,
            font: {
                family: "Arial",
                size: 12,
                color: "red",
            },
        })

        annotations.push({
            x: -1.5,
            y: 14.5,
            xref: "x",
            yref: "y",
            text: `Up in ${condition2}`,
            showarrow: false,
            textangle: 270,
            font: {
                family: "Arial",
                size: 12,
                color: "blue",
            },
        })

        // Create heatmap trace
        const trace = {
            z: ZValues,
            x: allSamples,
            y: geneNames,
            type: "heatmap",
            colorscale: "RdBu", // Red for high values, blue for low values
            zmid:0,
            zmin:-4,
            zmax:4,
            colorbar: {
                orientation: 'h',
                title: { text: "Z-score",side: 'right' },
                len: 0.5,
                x:0.4,
                thickness: 15,
                xpad: 10,
                ypad: 0,
            },
            hovertemplate: "Gene: %{y}<br>Sample: %{x}<br>Score: %{z:.2f}",
            hoverlabel: {
                namelength: -1,
            },
        }

        // Create dot plot trace for statistical significance and fold change
        const dotSizes = genes.map((gene) => {
            // Convert p-value to -log10(p) for dot size
            // Handle p-values of 0 by setting a maximum value
            const pValue = gene.p_val_adj || 0.000001 // Default to a small value if missing
            const negLogP = -Math.log10(Math.max(pValue, 1e-10))
            // Scale the size for better visualization (adjust as needed)
            return Math.min(Math.max(negLogP, 1), 10) * 0.25
        })

        const dotColors = genes.map((gene) => gene.avg_log2FC)

        const dotPlotTrace = {
            x: Array(genes.length).fill(allSamples.length + 1), // Position dots to the right of heatmap
            y: geneNames,
            mode: "markers",
            marker: {
                size: dotSizes,
                color: dotColors,
                cmid: 0,
                colorscale: "Viridis", // Same colorscale as heatmap but reversed
                colorbar: {
                    title: { text: "log2FC", side: "top",},
                    len: 0.5,
                    thickness: 15,
                    x: 1.0, // Position at the right edge
                    xpad: 0,
                    ypad: 0,
                },
                sizemode: "diameter",
                sizeref: 0.1, // Adjust for appropriate scaling
                line: {
                    color: "black",
                    width: 1,
                },
            },
            showlegend: false,
            hoverinfo: "text",
            text: genes.map(
                (gene) =>
                    `Gene: ${gene.gene}<br>` +
                    `log2FC: ${gene.avg_log2FC.toFixed(2)}<br>` +
                    `p.adj: ${gene.p_val_adj.toExponential(2)}<br>` +
                    `-log10(p): ${(-Math.log10(Math.max(gene.p_val_adj, 1e-10))).toFixed(2)}`,
            ),
            xaxis: "x2",
        }

        // Add annotation for dot plot column
        annotations.push({
            x: allSamples.length + 1,
            y: -0.8,
            xref: "x2",
            yref: "y",
            text: "Statistics",
            showarrow: false,
            font: {
                family: "Arial",
                size: 12,
                color: "black",
            },
        })

        const layout = {
            // title: {text: `Differentially Expressed Genes: ${selectedCellType} (${selectedCompare})`},
            grid: {
                rows: 1,
                columns: 2,
                pattern: "independent",
                xgap: 0.1,
            },
            xaxis: {
                title: "Samples",
                automargin: true,
                tickangle: 90,
                tickfont: {
                    size: 8,
                },
                domain: [0, 0.85], // Allocate 85% of width to heatmap
            },
            xaxis2: {
                title: "",
                showticklabels: false,
                domain: [0.85, 1], // Allocate 14% of width to dot plot
            },
            yaxis: {
                title: "Genes",
                tickfont: {
                    size: 10,
                },
            },
            annotations: annotations,
            margin: {
                l: 80,
                r: 50, // Increased right margin for dot plot colorbar
                b: 10,
                t: 0, // Increased top margin for title
                pad: 0,
            },
            plot_bgcolor: "rgba(0,0,0,0)",
            paper_bgcolor: "rgba(0,0,0,0)",
        }

        Plotly.newPlot(plotRef.current, [trace, dotPlotTrace], layout, {
            responsive: true,
            displaylogo: false,
        })

        // Cleanup
        return () => {
            if (plotRef.current) {
                Plotly.purge(plotRef.current)
            }
        }
    }, [diffExpGenes, selectedCellType, selectedCompare])

    const handleCellTypeChange = (event) => {
        setSelectedCellType(event.target.value)
        // Reset the selected comparison when cell type changes
        setSelectedCompare("")
    }

    const handleCompareChange = (event) => {
        setSelectedCompare(event.target.value)
    }

    return (
        <div style={{minHeight: "650px"}}>
            <div style={{display: "flex", gap: "20px", marginBottom: "20px"}}>
                <FormControl variant="standard" sx={{width: "250px"}}>
                    <InputLabel id="cell-type-label">Cell Type</InputLabel>
                    <Select
                        labelId="cell-type-label"
                        id="cell-type-select"
                        value={selectedCellType}
                        onChange={handleCellTypeChange}
                        size="small"
                    >
                        {selectedCellTypes.map((cellType) => (
                            <MenuItem key={cellType} value={cellType}>
                                {cellType}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl variant="standard" sx={{width: "250px"}}>
                    <InputLabel id="compare-label">Comparison</InputLabel>
                    <Select
                        labelId="compare-label"
                        id="compare-select"
                        value={selectedCompare}
                        onChange={handleCompareChange}
                        size="small"
                        disabled={compareList.length === 0}
                    >
                        {compareList.map((compare) => (
                            <MenuItem key={compare} value={compare}>
                                {compare}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            <div style={{display: "flex", justifyContent: "center", marginBottom: "0px"}}>
                <div style={{display: "flex", alignItems: "center", marginRight: "20px"}}>
                    <div style={{width: "15px", height: "15px", backgroundColor: "red", marginRight: "5px"}}></div>
                    <span>Higher expression</span>
                </div>
                <div style={{display: "flex", alignItems: "center"}}>
                    <div style={{width: "15px", height: "15px", backgroundColor: "blue", marginRight: "5px"}}></div>
                    <span>Lower expression</span>
                </div>
                <div style={{display: "flex", alignItems: "center", marginLeft: "20px"}}>
                    <div
                        style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            border: "1px solid black",
                            marginRight: "5px",
                        }}
                    ></div>
                    <span>Dot size: -log10(p.adj)</span>
                </div>
            </div>

            <div ref={plotRef} style={{width: "100%", height: "600px", minHeight: "600px"}}/>
        </div>
    )
}

HeatmapPlot2.propTypes = {
    diffExpGenes: PropTypes.object.isRequired,
    selectedCellTypes: PropTypes.array.isRequired,
}

export default HeatmapPlot2
