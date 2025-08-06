import ReactECharts from "echarts-for-react"
import PropTypes from "prop-types"
import {isCategorical} from "../../utils/funcs.js"
import {useRef} from "react";

const EChartScatterPlot = ({
                               gene, sampleList, umapData, exprData,
                               cellMetaData, CellMetaMap, sampleMetaData,
                               group, isMetaDataLoading
                           }) => {
    // console.log("EChartScatterPlot: ", gene, cellMetaData, CellMetaMap, sampleMetaData, group);
    const chartRef = useRef(null);
    const exportSVG = () => {
        const chartInstance = chartRef.current?.getEchartsInstance?.();
        if (!chartInstance) return;

        const svgData = chartInstance.getDataURL({
            type: 'svg',
            backgroundColor: '#f5f5f5',
        });

        const link = document.createElement('a');
        link.href = svgData;
        link.download = `scatterplot-${gene}-${group}.svg`;
        link.click();
    };

    if (umapData.length === 0) return "UMAP data is loading..."

    // Add this new check
    if (gene === "all" && isMetaDataLoading) {
        // Show a basic plot without coloring when metadata is still loading
        const plotData = umapData.map((item) => ({
            x: item[1],
            y: item[2],
        }))

        const basicOptions = {
            title: {
                text: "UMAP (Metadata loading...)",
                left: "center",
                top: 0,
            },
            tooltip: {
                trigger: "item",
                formatter: (params) => `X: ${params.value[0]}<br>Y: ${params.value[1]}`,
            },
            xAxis: {
                type: "value",
                axisLine: {show: false},
                axisTick: {show: false},
                splitLine: {show: false},
                axisLabel: {show: false},
            },
            yAxis: {
                type: "value",
                axisLine: {show: false},
                axisTick: {show: false},
                splitLine: {show: false},
                axisLabel: {show: false},
            },
            series: [
                {
                    type: "scatter",
                    symbolSize: 3,
                    data: plotData.map((point) => [point.x, point.y]),
                    itemStyle: {color: "#CCCCCC"},
                },
            ],
            backgroundColor: "#f5f5f5",
        }

        return (
            <ReactECharts
                option={basicOptions}
                notMerge={true}
                lazyUpdate={true}
                theme="light"
                style={{width: "100%", height: "100%"}}
                autoResize={true}
            />
        )
    }

    if (sampleList.length >= 1 && !sampleList.includes("all")) {
        umapData = umapData.filter((point) => {
            const sample_id = point[0].split(/_[cs]\d+$/)[0];
            return sampleList.includes(sample_id)
        })
    }

    const createCategoryOptions = (plotData, colorGroup) => {
        // Step 0: Group the data by 'plotGroup'
        const groupedData = {}
        plotData.forEach((p) => {
            if (!groupedData[p[colorGroup]]) groupedData[p[colorGroup]] = []
            groupedData[p[colorGroup]].push([p["x"], p["y"]])
        })

        // Step 1: Generate distinct colors for each group and create a series for each group
        const colorPalette = [
            "#A7D16B", "#ADD9E9", "#A84D9D", "#F68D40",
            "#0A71B1", "#016B62", "#BFAFD4", "#6BAED6",
            "#7BCCC4", "#ff7f0e", "#1f77b4", "#2ca02c",
            "#da6f70", "#9467bd", "#8c564b", "#e377c2",
            "#0d1dd1", "#bcbd22", "#17becf", "#ff0000",
            "#00ff00", "#0000ff", "#ff00ff", "#00ffff",
            "#ffff00", "#9bed56", "#8000ff", "#0080ff",
            "#80ff00", "#cccccc", "#333333", "#000000"
        ] // Up to 20 unique colors

        const groupNames = Object.keys(groupedData).sort()
        const series = groupNames.map((group_i, index) => ({
            name: `${group_i}`,
            type: "scatter",
            data: groupedData[group_i],
            symbolSize: 3,
            itemStyle: {color: colorPalette[index % colorPalette.length]}, // Cycle colors if >20 groups
        }))

        // Step 3: Configure ECharts options
        return {
            grid: {
                right: 150,
                left: '0%',
                bottom: '5%',
            },
            title: {
                text: colorGroup,
                left: "center",
                top: 0,
            },
            tooltip: {
                trigger: "item",
                formatter: (params) => `X: ${params.value[0]}<br>Y: ${params.value[1]}<br>Group: ${params.seriesName}`,
            },
            legend: {
                type: "scroll", // Support for many groups
                orient: "vertical",
                right: 0,
                top: 50,
                width: 150, // Adjust as needed
                data: groupNames.map((group_i) => `${group_i}`).sort(),
                // Optional: truncate long names
                formatter: function (name) {
                    return name.length > 16 ? name.slice(0, 16) + '…' : name;
                },
                textStyle: {
                    overflow: 'truncate', // Optional: helps when wrapping isn't wanted
                },
            },
            xAxis: {
                type: "value",
                axisLine: {show: false}, // Hide axis line
                axisTick: {show: false}, // Hide ticks
                splitLine: {show: false}, // Hide grid lines
                axisLabel: {show: false}, // Hide labels
            },
            yAxis: {
                type: "value",
                axisLine: {show: false},
                axisTick: {show: false},
                splitLine: {show: false},
                axisLabel: {show: false},
            },
            series: series,
        }
    }

    const createContinuousOptions = (plotData, colorGroup) => {
        // Convert data to the format required by ECharts
        const scatterData = plotData.map((point) => [point["x"], point["y"], point[colorGroup]])
        // Determine min/max values for visualMap
        const minValue = Math.min(...scatterData.map((p) => p[2]))
        const maxValue = Math.max(...scatterData.map((p) => p[2]))

        return {
            title: {text: colorGroup, left: "center", top: 0},
            xAxis: {
                type: "value",
                axisLine: {show: false}, // Hide axis line
                axisTick: {show: false}, // Hide ticks
                splitLine: {show: false}, // Hide grid lines
                axisLabel: {show: false}, // Hide labels
            },
            yAxis: {
                type: "value",
                axisLine: {show: false},
                axisTick: {show: false},
                splitLine: {show: false},
                axisLabel: {show: false},
            },
            visualMap: {
                min: minValue,
                max: maxValue,
                dimension: 2, // Apply to the "value" dimension
                orient: "vertical",
                right: 10,
                top: "center",
                text: ["High", "Low"],
                calculable: true,
                inRange: {color: ["#CCCCCCFF", "#FF0000FF"]}, // Color gradient from low to high
            },
            legend: {show: false},
            series: [
                {
                    type: "scatter",
                    symbolSize: 3,
                    data: scatterData,
                },
            ],
        }
    }

    let options = {}
    const cell_level_meta = Object.keys(CellMetaMap ?? {});
    if (gene === "all") {
        //===============================
        // In this case the expression data is not needed, just use the metaData
        //===============================

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
        const plotData =
            umapData.map((item) => ({
                x: item[1],
                y: item[2],
                [group]: updatedCellMetaData?.[item[0]]?.[group] ?? "Cell/Spot", // Works for both objects and arrays, returns 0 for undefined/null values
            })) || []

        const isCategoricalGroup = isCategorical(Object.values(updatedCellMetaData).map((p) => p[group]))
        if (isCategoricalGroup) {
            options = createCategoryOptions(plotData, group)
        } else {
            options = createContinuousOptions(plotData, group)
        }
    } else {
        // data processing
        const plotData =
            umapData.map((item) => ({
                x: item[1],
                y: item[2],
                [gene]: exprData?.[item[0]] ?? 0, // Works for both objects and arrays, returns 0 for undefined/null values
            })) || []
        options = createContinuousOptions(plotData, gene)
    }
    options.backgroundColor = "#f5f5f5";

    return (
        <div>
            <div style={{display: "flex", justifyContent: "flex-end", marginBottom: "0px" ,backgroundColor: "#f5f5f5" }}>
                <button onClick={exportSVG}>Export as SVG</button>
            </div>
            <ReactECharts
                ref={chartRef}
                key={`${gene}-${group}`}
                option={options}
                notMerge={true}
                lazyUpdate={true}
                opts={{renderer: 'svg'}} // IMPORTANT: ensures SVG rendering
                theme="light"
                // showLoading={true}
                style={{width: "100%", height: "100%"}}
                autoResize={true}
            />
        </div>
    )
}

EChartScatterPlot.propTypes = {
    gene: PropTypes.string.isRequired,
    sampleList: PropTypes.array.isRequired,
    umapData: PropTypes.array.isRequired,
    exprData: PropTypes.object.isRequired,
    cellMetaData: PropTypes.object,
    sampleMetaData: PropTypes.object,
    CellMetaMap: PropTypes.object,
    group: PropTypes.string.isRequired,
    isMetaDataLoading: PropTypes.bool,
}

export default EChartScatterPlot
