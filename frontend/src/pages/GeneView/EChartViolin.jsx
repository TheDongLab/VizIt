import ReactECharts from "echarts-for-react";
import {groupBy} from "lodash";
import * as d3 from "d3";
import PropTypes from "prop-types";

const EChartViolin = ({gene, geneData, sampleData, metaData, group}) => {
    if (sampleData.length >= 1 && !sampleData.includes("all")) {
        metaData = metaData.filter((meta) => sampleData.includes(meta.sample_id));
    }
    if(metaData.length === 0) return "Sample not found in the MetaData";

    if (gene === "all") return null;

    const groupedData = groupBy(metaData, group);
    const xCategories = Object.keys(groupedData);

    const numCategories = xCategories.length;

    // Global range calculation
    let globalMin = Infinity;
    let globalMax = -Infinity;
    const allExpressionLevels = [];

    xCategories.forEach(cellType => {
        const levels = groupedData[cellType].map(d => {
            return geneData[d.cs_id] ?? 0
        });
        if (levels.length < 2) return;
        allExpressionLevels.push(...levels);
        globalMin = Math.min(globalMin, ...levels);
        globalMax = Math.max(globalMax, ...levels);
    });

    // KDE parameters
    const bandwidth = 0.2;
    const maxViolinWidth = 0.3;
    const kdeThresholds = d3.range(
        globalMin - bandwidth,
        globalMax + bandwidth,
        0.1
    );

    // Calculate global max density
    let globalMaxDensity = 0;
    const densityMap = new Map();

    xCategories.forEach(cellType => {
        const levels = groupedData[cellType].map(d => {
            return geneData[d.cs_id] ?? 0
        });
        if (levels.length < 2) return;

        const kernel = epanechnikovKernel(bandwidth);
        const density = kernelDensityEstimator(kernel, kdeThresholds, levels);
        densityMap.set(cellType, density);

        const currentMax = Math.max(...density.map(([, v]) => v));
        globalMaxDensity = Math.max(globalMaxDensity, currentMax);
    });

    // Generate violin series
    const violinSeries = [];
    xCategories.forEach((cellType, index) => {
        const density = densityMap.get(cellType) || [];
        const scaledDensity = density.map(([y, v]) => [
            y,
            (v / globalMaxDensity) * maxViolinWidth
        ]);

        const position = index + 1; // Shift positions right by 1 unit
        const left = scaledDensity.map(([y, w]) => [position - w, y]);
        const right = scaledDensity.map(([y, w]) => [position + w, y]).reverse();
        const polygon = [...left, ...right];

        violinSeries.push({
            type: "custom",
            name: cellType,
            renderItem: (params, api) => ({
                type: "polygon",
                shape: {points: polygon.map(([x, y]) => api.coord([x, y]))},
                style: api.style({
                    fill: api.visual("color"),
                    stroke: api.visual("color"),
                    opacity: 0.6,
                }),
            }),
            data: [polygon],
        });
    });

    // ECharts configuration
    const option = {
        title: {
            // text: `${gene} Expression Distribution`,
            left: "center",
            textStyle: {fontSize: 16}
        },
        tooltip: {
            trigger: "item",
            formatter: (params) => {
                const index = Math.round(params.value[0]) - 1; // Adjust index for shifted positions
                return `${xCategories[index]}<br/>${gene}: ${params.value[1].toFixed(2)}`;
            }
        },
        xAxis: {
            type: "value",
            min: 0.6,
            max: numCategories + 0.5,
            axisLabel: {
                formatter: (value) => {
                    const index = Math.round(value) - 1; // Use floor instead of round
                    return xCategories[index] || "";
                },
                interval: 0, // Force show all labels
                fontSize: 12,
                rotate: 45,
                margin: 10, // Increased margin
                align: "right",
                verticalAlign: "middle",
                overflow: "None",
                width: null // Set maximum label width
            },
            axisTick: {
                show: true,
                alignWithLabel: true,
                interval: 0 // Force show all ticks
            },
            // name: "Cell Type",
            nameLocation: "center",
            nameGap: 10, // Increased name gap
            splitLine: {show: false}
        },
        yAxis: {
            type: "value",
            min: globalMin - bandwidth,
            max: globalMax + bandwidth,
            name: `${gene}`,
            nameLocation: "center",
            nameGap: 30,
            splitLine: {lineStyle: {type: "dashed"}}
        },
        series: violinSeries,
        color: ["#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE"],
        animationDuration: 1000
    };

    return <ReactECharts option={option} style={{height: "200px", width: "100%"}}/>;
};

// KDE utilities
const kernelDensityEstimator = (kernel, X, values) =>
    X.map(x => [
        x,
        d3.sum(values, v => kernel(x - v)) / values.length
    ]);

const epanechnikovKernel = (bandwidth) => (x) =>
    Math.abs((x /= bandwidth)) <= 1 ? (0.75 * (1 - x * x)) / bandwidth : 0;

EChartViolin.propTypes = {
    gene: PropTypes.string.isRequired,
    geneData: PropTypes.object.isRequired,
    sampleData: PropTypes.array.isRequired,
    metaData: PropTypes.array.isRequired,
    group: PropTypes.string.isRequired,
};

export default EChartViolin;