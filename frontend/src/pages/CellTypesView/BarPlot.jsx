"use client"

import {useEffect, useRef, useState} from "react"
import PropTypes from "prop-types"
import Plotly from "plotly.js-dist-min"
import {FormControl, InputLabel, Select, MenuItem} from "@mui/material"

const BarPlot = ({cellCounts, selectedCellTypes}) => {
    const plotRef = useRef(null)
    const [comparisonType, setComparisonType] = useState("conditions")

    const color_platte = [
        "#d62728", "#1f77b4", "#2ca02c", "#ff7f0e",
        "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
        "#bcbd22", "#17becf",
    ]

    let ConditionSet = new Set()
    let SexSet = new Set()
    for (const cellType in cellCounts) {
        cellCounts[cellType].forEach((item) => ConditionSet.add(item.condition))
        cellCounts[cellType].forEach((item) => SexSet.add(item.sex))
    }
    ConditionSet = [...ConditionSet]
    SexSet = [...SexSet]

    useEffect(() => {
        if (!cellCounts || !plotRef.current) return

        // Filter data based on selected cell types
        const filteredCounts = {}
        selectedCellTypes.forEach((cellType) => {
            if (cellCounts[cellType]) {
                filteredCounts[cellType] = cellCounts[cellType]
            }
        })

        const traces = []

        switch (comparisonType) {
            case "conditions": {
                // PD vs Control comparison
                ConditionSet.forEach((condition, index) => {
                    const x = []
                    const y = []

                    // Collect data for all cell types for this condition
                    Object.entries(filteredCounts).forEach(([cellType, data]) => {
                        const conditionData = data.filter((item) => item.condition === condition)
                        const count_sum = conditionData.reduce((sum, item) => sum + item.count, 0)

                        x.push(cellType)
                        y.push(count_sum)
                    })

                    traces.push({
                        x: x,
                        y: y,
                        type: "bar",
                        name: condition,
                        marker: {color: color_platte[index % color_platte.length]},
                    })
                })
                break
            }

            case "sex":{
                // Male vs Female comparison
                SexSet.forEach((sex, index) => {
                    const x = []
                    const y = []

                    // Collect data for all cell types for this sex
                    Object.entries(filteredCounts).forEach(([cellType, data]) => {
                        const sexData = data.filter((item) => item.sex === sex)
                        const count_sum = sexData.reduce((sum, item) => sum + item.count, 0)

                        x.push(cellType)
                        y.push(count_sum)
                    })

                    traces.push({
                        x: x,
                        y: y,
                        type: "bar",
                        name: sex,
                        marker: {color: color_platte[index % color_platte.length]},
                    })
                })
                break
            }
            case "conditions_sex": {
                // PD vs Control within Male vs Female
                let combinedIndex = 0

                ConditionSet.forEach((condition, con_index) => {
                    SexSet.forEach((sex, sex_index) => {
                        const x = []
                        const y = []

                        // Collect data for all cell types for this condition and sex
                        Object.entries(filteredCounts).forEach(([cellType, data]) => {
                            const filteredData = data.filter((item) => item.condition === condition && item.sex === sex)
                            const count_sum = filteredData.reduce((sum, item) => sum + item.count, 0)

                            x.push(cellType)
                            y.push(count_sum)
                        })

                        let color_str = color_platte[con_index % color_platte.length]
                        if(sex_index === 1) {
                            color_str = color_str + "99"
                        }

                        traces.push({
                            x: x,
                            y: y,
                            type: "bar",
                            name: `${condition} - ${sex}`,
                            marker: {color: color_str},
                        })

                        combinedIndex++
                    })
                })
                break
            }
            case `conditions_${SexSet[0]}`:{
                // PD vs Control within first sex (e.g., Male)
                ConditionSet.forEach((condition, index) => {
                    const x = []
                    const y = []

                    // Collect data for all cell types for this condition and first sex
                    Object.entries(filteredCounts).forEach(([cellType, data]) => {
                        const filteredData = data.filter((item) => item.condition === condition && item.sex === SexSet[0])
                        const count_sum = filteredData.reduce((sum, item) => sum + item.count, 0)

                        x.push(cellType)
                        y.push(count_sum)
                    })

                    traces.push({
                        x: x,
                        y: y,
                        type: "bar",
                        name: condition,
                        marker: {color: color_platte[index % color_platte.length]},
                    })
                })
                break
            }
            case `conditions_${SexSet[1]}`:{
                // PD vs Control within second sex (e.g., Female)
                ConditionSet.forEach((condition, index) => {
                    const x = []
                    const y = []

                    // Collect data for all cell types for this condition and second sex
                    Object.entries(filteredCounts).forEach(([cellType, data]) => {
                        const filteredData = data.filter((item) => item.condition === condition && item.sex === SexSet[1])
                        const count_sum = filteredData.reduce((sum, item) => sum + item.count, 0)

                        x.push(cellType)
                        y.push(count_sum)
                    })

                    traces.push({
                        x: x,
                        y: y,
                        type: "bar",
                        name: condition,
                        marker: {color: color_platte[index % color_platte.length]},
                    })
                })
                break
            }
            default:
                break
        }

        const layout = {
            title: "Cell Counts",
            yaxis: {
                title: "Total Cell Count",
                zeroline: true,
            },
            xaxis: {
                tickangle: 45,
            },
            barmode: "group",
            bargap: 0.1, // Minimal gap between different cell types
            bargroupgap: 0.05, // Minimal gap between bars within the same cell type
            legend: {orientation: "h", y: 1.25},
            margin: {
                l: 50,
                r: 50,
                b: 100,
                t: 50,
                pad: 0,
            },
            plot_bgcolor: "rgba(0,0,0,0)",
            paper_bgcolor: "rgba(0,0,0,0)",
        }

        Plotly.newPlot(plotRef.current, traces, layout, {
            responsive: true,
            displaylogo: false,
        })

        // Cleanup
        return () => {
            if (plotRef.current) {
                Plotly.purge(plotRef.current)
            }
        }
    }, [cellCounts, selectedCellTypes, comparisonType])

    return (
        <div style={{minHeight: "450px"}}>
            <FormControl variant="standard" sx={{width: "250px", marginBottom: "20px"}}>
                <InputLabel id="comparison-type-label">Group by</InputLabel>
                <Select
                    labelId="comparison-type-label"
                    id="comparison-type-select"
                    value={comparisonType}
                    onChange={(e) => setComparisonType(e.target.value)}
                    size="small"
                >
                    <MenuItem value="conditions">Conditions</MenuItem>
                    <MenuItem value="sex">Sex</MenuItem>
                    <MenuItem value="conditions_sex">Conditions x Sex</MenuItem>
                    <MenuItem value={`conditions_${SexSet[0]}`}>Conditions (Within {SexSet[0]})</MenuItem>
                    <MenuItem value={`conditions_${SexSet[1]}`}>Conditions (Within {SexSet[1]})</MenuItem>
                </Select>
            </FormControl>
            <div ref={plotRef} style={{width: "100%", height: "400px", minHeight: "400px"}}/>
        </div>
    )
}

BarPlot.propTypes = {
    cellCounts: PropTypes.object.isRequired,
    selectedCellTypes: PropTypes.array.isRequired,
}

export default BarPlot
