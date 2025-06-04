"use client"

import {useEffect, useRef, useState} from "react"
import PropTypes from "prop-types"
import Plotly from "plotly.js-dist-min"
import {FormControl, InputLabel, Select, MenuItem} from "@mui/material"

const BarPlot = ({cellCounts, selectedCellTypes}) => {
    console.log("cellCounts", cellCounts)
    const plotRef = useRef(null)
    const [comparisonType, setComparisonType] = useState("conditions")

    const color_platte = [
        "#d62728", "#1f77b4", "#2ca02c", "#ff7f0e",
        "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
        "#bcbd22", "#17becf", "#c49c94", "#c7c7c7",
        "#b5bd61", "#dbdb8d", "#9a9ac8", "#f7b6d2",
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
                // Condition comparison
                // Track which conditions have been added to the legend
                const conditionLegendAdded = {}

                Object.entries(filteredCounts).forEach(([cellType, data]) => {
                    ConditionSet.forEach((condition) => {
                        const conditionData = data.filter((item) => item.condition === condition)
                        const count_sum = conditionData.reduce((sum, item) => sum + item.count, 0)

                        // Only show in legend if this is the first occurrence of this condition
                        const showInLegend = !conditionLegendAdded[condition]
                        if (showInLegend) {
                            conditionLegendAdded[condition] = true
                        }

                        traces.push({
                            x: [`${cellType}`],
                            y: [count_sum],
                            type: "bar",
                            name: condition,
                            showlegend: showInLegend,
                            marker: {color: color_platte[ConditionSet.indexOf(condition)]},
                        })
                    })
                })
                break
            }
            case "sex": {
                // Male vs Female comparison
                // Track which sexes have been added to the legend
                const sexLegendAdded = {}

                Object.entries(filteredCounts).forEach(([cellType, data]) => {
                    SexSet.forEach((sex) => {
                        const sexData = data.filter((item) => item.sex === sex)
                        const count_sum = sexData.reduce((sum, item) => sum + item.count, 0)

                        // Only show in legend if this is the first occurrence of this sex
                        const showInLegend = !sexLegendAdded[sex]
                        if (showInLegend) {
                            sexLegendAdded[sex] = true
                        }

                        traces.push({
                            x: [`${cellType}`],
                            y: [count_sum],
                            type: "bar",
                            name: sex,
                            showlegend: showInLegend,
                            marker: {color: color_platte[SexSet.indexOf(sex)]},
                        })
                    })
                })
                break
            }
            case "conditions_sex": {
                // PD vs Control within Male vs Female
                // Track which conditions have been added to the legend
                const condSexLegendAdded = {}

                Object.entries(filteredCounts).forEach(([cellType, data]) => {
                    ConditionSet.forEach((condition) => {
                        SexSet.forEach((sex) => {
                            const conditionData = data.filter((item) => item.condition === condition && item.sex === sex)
                            const count_sum = conditionData.reduce((sum, item) => sum + item.count, 0)

                            // Create a combined key for condition and sex
                            const groupKey = `${condition}_${sex}`

                            // Only show in legend if this is the first occurrence of this combination
                            const showInLegend = !condSexLegendAdded[groupKey]
                            if (showInLegend) {
                                condSexLegendAdded[groupKey] = true
                            }

                            traces.push({
                                x: [`${cellType}`],
                                y: [count_sum],
                                type: "bar",
                                name: `${condition} - ${sex}`,
                                showlegend: showInLegend,
                                marker: {color: color_platte[ConditionSet.indexOf(condition) * 2 + SexSet.indexOf(sex)]},
                            })
                        })
                    })
                })
                break
            }
            case `conditions_${SexSet[0]}`: {
                // PD vs Control within first sex (e.g., Male)
                // Track which conditions have been added to the legend
                const condFirstSexLegendAdded = {}

                Object.entries(filteredCounts).forEach(([cellType, data]) => {
                    ConditionSet.forEach((condition) => {
                        const conditionData = data.filter((item) => item.condition === condition && item.sex === SexSet[0])
                        const count_sum = conditionData.reduce((sum, item) => sum + item.count, 0)

                        // Only show in legend if this is the first occurrence of this condition
                        const showInLegend = !condFirstSexLegendAdded[condition]
                        if (showInLegend) {
                            condFirstSexLegendAdded[condition] = true
                        }

                        traces.push({
                            x: [`${cellType}`],
                            y: [count_sum],
                            type: "bar",
                            name: condition,
                            showlegend: showInLegend,
                            marker: {color: color_platte[ConditionSet.indexOf(condition)]},
                        })
                    })
                })
                break
            }

            case `conditions_${SexSet[1]}`: {
                // PD vs Control within second sex (e.g., Female)
                // Track which conditions have been added to the legend
                const condSecondSexLegendAdded = {}

                Object.entries(filteredCounts).forEach(([cellType, data]) => {
                    ConditionSet.forEach((condition) => {
                        const conditionData = data.filter((item) => item.condition === condition && item.sex === SexSet[1])
                        const count_sum = conditionData.reduce((sum, item) => sum + item.count, 0)

                        // Only show in legend if this is the first occurrence of this condition
                        const showInLegend = !condSecondSexLegendAdded[condition]
                        if (showInLegend) {
                            condSecondSexLegendAdded[condition] = true
                        }

                        traces.push({
                            x: [`${cellType}`],
                            y: [count_sum],
                            type: "bar",
                            name: condition,
                            showlegend: showInLegend,
                            marker: {color: color_platte[ConditionSet.indexOf(condition)]},
                        })
                    })
                })
                break
            }

            default:
                break
        }

        const layout = {
            title: "Cell Counts",
            xaxis: {
                type: 'category',
                title: "Cell Type",
                automargin: true,},
            yaxis: {
                title: "Total Cell Count",
                zeroline: true,
            },
            barmode: "group",
            bargap: 0.01,
            bargroupgap: 0.05,
            legend: {orientation: "h", y: 1.25},
            margin: {
                l: 50,
                r: 50,
                b: 100,
                t: 50,
                pad: 4,
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
                <InputLabel id="comparison-type-label">Comparison Type</InputLabel>
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
