import {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import ReactECharts from 'echarts-for-react';
import PropTypes from "prop-types";
import {calculateMinMax, isCategorical} from "../../utils/funcs.js";

const EChartFeaturePlot = ({visiumData, geneData, metaData, feature}) => {

    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const resizeObserver = useRef(null);
    const [version, setVersion] = useState(0);

    // Destructure required data
    const {coordinates, scales, image} = visiumData;
    const {hires, lowres} = scales;

    // State management
    const [naturalDimensions, setNaturalDimensions] = useState({width: 0, height: 0});
    const [displayScale, setDisplayScale] = useState(1);
    const [imageUrl, setImageUrl] = useState('');

    // Load image and get natural dimensions
    useEffect(() => {
        if (!image) return;

        const url = URL.createObjectURL(image);
        setImageUrl(url);

        const img = new Image();
        img.onload = () => {
            setNaturalDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };
        img.src = url;

        return () => URL.revokeObjectURL(url);
    }, [image]);

    // Calculate display scale and force update
    const updateScale = useCallback(() => {
        if (!containerRef.current || !naturalDimensions.width) return;

        const containerWidth = containerRef.current.offsetWidth;
        const scale = containerWidth / naturalDimensions.width;

        // console.log("scale: ", scale);
        // console.log("containerWidth: ", containerWidth);

        if (scale !== displayScale) {
            setDisplayScale(scale);
            setVersion(v => v + 1); // Force chart re-render
        }
    }, [naturalDimensions.width, displayScale]);

    // Setup resize observer
    useEffect(() => {
        if (!containerRef.current) return;

        resizeObserver.current = new ResizeObserver(updateScale);
        resizeObserver.current.observe(containerRef.current);

        return () => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
            }
        };
    }, [updateScale]);

    // Process feature data
    const featuredData = useMemo(() => {
        const data = {};
        if (Object.keys(geneData).includes(feature)) {
            return geneData[feature];
        }

        if (metaData) {
            Object.entries(metaData).forEach(([id, item]) => {
                data[id] = item[feature];

            })
        }
        return data;
    }, [geneData, metaData, feature]);


    const colorPalette = [
        "#ff7f0e", "#1f77b4", "#2ca02c", "#da6f70", "#9467bd", "#8c564b", "#e377c2",
        "#0d1dd1", "#bcbd22", "#17becf", "#ff0000", "#00ff00", "#0000ff", "#ff00ff",
        "#00ffff", "#ffff00", "#9bed56", "#8000ff", "#0080ff", "#80ff00"
    ]; // Up to 20 unique colors

    // Calculate value range for visual mapping
    let minFeature = 0;
    let maxFeature = 0;
    let isCat = false;

    const values = Object.values(featuredData);
    if (isCategorical(values)) {
        minFeature = 0;
        maxFeature = new Set(values).size - 1;
        isCat = true;
    } else {
        [minFeature, maxFeature] = calculateMinMax(values);
        isCat = false;
    }


    // Generate scatter data with proper scaling
    const scatterData = useMemo(() => {
        return Object.entries(coordinates).map(([id, item]) => ({
            name: id,
            value: [
                item.imagerow * lowres, // X
                item.imagecol * lowres, // Y
                featuredData[id] ?? (isCat ? "Other" : 0)  // Value
            ]
        }))
    }, [coordinates, hires, displayScale, featuredData]);

    let mySeries = [];
    let legendData = [];
    if (isCat) {
        const groupedData = {};
        scatterData.forEach((p) => {
            if (!groupedData[p["value"][2]]) {
                groupedData[p["value"][2]] = [];
            }
            groupedData[p["value"][2]].push(p);
        });
        // console.log("groupedData: ", groupedData);
        const groupNames = Object.keys(groupedData);
        legendData = groupNames;

        mySeries = groupNames.map((group_i, index) => {
            return {
                name: `${group_i}`,
                type: 'scatter',
                coordinateSystem: 'cartesian2d',
                data: groupedData[group_i],
                symbolSize: 6 * displayScale,
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 0.1 * displayScale,
                    color: colorPalette[index % colorPalette.length]
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                z: 2
            };
        })
    } else {
        mySeries.push({
            type: 'scatter',
            coordinateSystem: 'cartesian2d',
            data: scatterData,
            symbolSize: 6 * displayScale,
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 0.1 * displayScale
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            z: 2
        });
    }

    // ECharts configuration
    const option = useMemo(() => ({
            // =====================
            // !!!!! This grid configuration is very important !!!!!
            // The grid configuration aligns the scatter plot with the image
            // =====================
            grid: {top: 0, left: 0, right: 0, bottom: 0, containLabel: false},
            xAxis: {show: false, min: 0, max: naturalDimensions.width},
            yAxis: {show: false, min: 0, max: naturalDimensions.height, inverse: true},
            graphic: [{
                type: 'image',
                left: 0,
                top: 0,
                style: {
                    image: imageUrl,
                    width: naturalDimensions.width * displayScale,
                    height: naturalDimensions.height * displayScale
                },
                z: 0
            }],
            tooltip: {
                trigger: 'item',
                formatter: params =>
                    `ID: ${params.name}<br/>${feature}: ${params.value[2]}`
            },
            toolbox: {
                show: true,
                showTitle: false, // hide the default text so they don't overlap each other
                feature: {
                    saveAsImage: {
                        show: true,
                        title: 'Save As Image',
                        name: `${feature}`,

                    },
                },
            },
            series: mySeries,
            // dataZoom: [{type: 'inside', xAxisIndex: 0, yAxisIndex: 0},],
            brush: {toolbox: ['rect', 'polygon', 'clear']},
        }
), [scatterData, displayScale, imageUrl, minFeature, maxFeature, feature, naturalDimensions]);

    if (!isCat) {
        option.visualMap = {
            min: minFeature,
            max: maxFeature,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 10,
            inRange: {
                // color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
                color: ['#5d4ea8', '#58b2ac', '#fcfeba', "#f6804b", '#9e0341']
            }
        }
    } else {
        option.legend = {
            orient: 'vertical',
            left: 'right',
            top: 'center',
            show: true,
            data: legendData
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                position: 'relative',
                aspectRatio: naturalDimensions.width > 0 ?
                    `${naturalDimensions.width / naturalDimensions.height}` : '1'
            }}
        >
            <ReactECharts
                key={`chart-${feature}-${version}`}
                ref={chartRef}
                option={option}
                style={{
                    width: '100%',
                    height: '100%',
                    minWidth: '200px'
                }}
                opts={{
                    renderer: 'svg',
                    width: naturalDimensions.width * displayScale,
                    height: naturalDimensions.height * displayScale
                }}
                notMerge={true}
            />
        </div>
    );
};

EChartFeaturePlot.propTypes = {
    visiumData: PropTypes.shape({
        coordinates: PropTypes.object.isRequired,
        scales: PropTypes.object.isRequired,
        image: PropTypes.instanceOf(Blob).isRequired
    }).isRequired,
    geneData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    feature: PropTypes.string.isRequired
};


export default EChartFeaturePlot;
