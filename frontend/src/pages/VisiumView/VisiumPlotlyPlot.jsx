import React, {useEffect, useRef, useState, useCallback, useMemo} from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";
import {calculateMinMax, isCategorical, sortObjectByKey} from "../../utils/funcs.js";

const PlotlyFeaturePlotVisium = React.memo(function PlotlyFeaturePlot({
                                                                          visiumData,
                                                                          geneData,
                                                                          metaData,
                                                                          feature,
                                                                          showImage = true
                                                                      }) {

    const containerRef = useRef(null);
    const plotRef = useRef(null);
    const [imageUrl, setImageUrl] = useState("");
    const [naturalDimensions, setNaturalDimensions] = useState({width: 0, height: 0});
    const [zoomLevel, setZoomLevel] = useState(1);
    const [currentLayout, setCurrentLayout] = useState(null);
    const baseMarkerSize = 6;

    // Destructure visium data
    const {coordinates, scales, image} = visiumData;
    const {lowres} = scales;
    const {cell_metadata, cell_metadata_mapping, sample_metadata} = metaData
    const cell_level_meta = Object.keys(cell_metadata_mapping);

    // Load image and extract dimensions - FIXED: Properly use showImage prop
    useEffect(() => {
        // Check if image should be shown
        if (!showImage) {
            setImageUrl("");
            setNaturalDimensions({width: 0, height: 0});
            return;
        }

        // More robust image availability check
        if (!image || ("success" in image && !image.success)) {
            setImageUrl("");
            setNaturalDimensions({width: 0, height: 0});
            return;
        }

        // Handle case where image might be a string URL
        if (typeof image === "string") {
            setImageUrl(image);
            const img = new Image();
            img.onload = () => {
                setNaturalDimensions({width: img.naturalWidth, height: img.naturalHeight});
            };
            img.onerror = () => {
                setImageUrl("");
                setNaturalDimensions({width: 0, height: 0});
            };
            img.src = image;
            return;
        }

        // Handle Blob case
        try {
            const url = URL.createObjectURL(image);
            setImageUrl(url);

            const img = new Image();
            img.onload = () => {
                setNaturalDimensions({width: img.naturalWidth, height: img.naturalHeight});
            };
            img.onerror = () => {
                setImageUrl("");
                setNaturalDimensions({width: 0, height: 0});
                URL.revokeObjectURL(url);
            };
            img.src = url;

            return () => URL.revokeObjectURL(url);
        } catch (error) {
            console.warn('Error loading image:', error);
            setImageUrl("");
            setNaturalDimensions({width: 0, height: 0});
        }
    }, [image, showImage]); // Added showImage to dependency array


    // Extract feature data
    const featuredData = useMemo(() => {
        if (geneData[feature]) return geneData[feature];
        const data = {};
        Object.entries(cell_metadata || {}).forEach(([id, item]) => {
            if (cell_level_meta.includes(feature)) {
                data[id] = cell_metadata_mapping[feature][item[feature]][0];
            } else {
                const sample_id = id.split('_').slice(0, -1).join('_')
                data[id] = sample_metadata[sample_id][feature];
            }
        });
        return data;
    }, [geneData, cell_metadata, feature]);

    // Compute color mapping
    let minFeature = 0, maxFeature = 0, isCat = false;
    const values = Object.values(featuredData);
    if (isCategorical(values)) {
        minFeature = 0;
        maxFeature = new Set(values).size - 1;
        isCat = true;
    } else {
        [minFeature, maxFeature] = calculateMinMax(values);
    }

    // Prepare scatter plot data
    const scatterData = useMemo(() => {
        return Object.entries(coordinates).map(([id, item]) => ({
            x: item.imagecol * lowres,
            y: item.imagerow * lowres,
            value: featuredData[id] ?? (isCat ? "Other" : 0)
        }));
    }, [coordinates, lowres, featuredData]);

    // Calculate coordinate ranges from object format - ENHANCED
    const coordinateRanges = useMemo(() => {
        if (!coordinates || Object.keys(coordinates).length === 0) {
            return {xRange: [0, 1], yRange: [0, 1], dataWidth: 1, dataHeight: 1};
        }

        const xValues = Object.values(coordinates).map(coord => coord.imagecol * lowres);
        const yValues = Object.values(coordinates).map(coord => coord.imagerow * lowres);

        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);

        const xPadding = (xMax - xMin) * 0.2;
        const yPadding = (yMax - yMin) * 0.2;

        // Use natural dimensions if available and showImage is true, otherwise use data bounds
        const effectiveWidth = (showImage && naturalDimensions.width > 0) ? naturalDimensions.width : xMax + xPadding;
        const effectiveHeight = (showImage && naturalDimensions.height > 0) ? naturalDimensions.height : yMax + yPadding;

        return {
            xRange: [Math.max(0, xMin - xPadding), Math.max(effectiveWidth, xMax + xPadding)],
            yRange: [Math.max(effectiveHeight, yMax + yPadding), Math.max(0, yMin - yPadding)],
            dataWidth: Math.max(1, xMax - xMin),
            dataHeight: Math.max(1, yMax - yMin)
        };
    }, [coordinates, lowres, naturalDimensions, showImage]); // Added showImage to dependency array

    const colorPalette = [
        "#A7D16B", "#ADD9E9", "#A84D9D", "#F68D40", "#0A71B1", "#016B62", "#BFAFD4", "#6BAED6", "#7BCCC4",
    ];

    // Calculate current marker size based on zoom level
    const calculateMarkerSize = useCallback((currentZoomLevel = zoomLevel) => {
        if (!currentZoomLevel || isNaN(currentZoomLevel) || currentZoomLevel <= 0) {
            return baseMarkerSize;
        }
        const dynamicSize = baseMarkerSize * Math.abs(currentZoomLevel);
        return Math.max(1, Math.min(100, dynamicSize));
    }, [baseMarkerSize, zoomLevel]);

    // Current marker size based on zoom level
    const currentMarkerSize = useMemo(() => {
        return calculateMarkerSize();
    }, [calculateMarkerSize]);

    // Prepare trace data for Plotly
    const traces = useMemo(() => {
        if (!scatterData.length) return [];

        if (isCat) {
            let groups = {};
            scatterData.forEach((p) => {
                if (!groups[p.value]) groups[p.value] = {x: [], y: [], text: []};
                groups[p.value].x.push(p.x);
                groups[p.value].y.push(p.y);
                groups[p.value].text.push(`${feature}: ${p.value}`);
            });
            groups = sortObjectByKey(groups);
            return Object.entries(groups).map(([group, data], i) => ({
                x: data.x,
                y: data.y,
                text: data.text,
                mode: "markers",
                type: "scatter",
                name: `${group}`,
                marker: {size: currentMarkerSize, color: colorPalette[i % colorPalette.length]},
                hovertemplate: `${feature}: ${group}<br><extra></extra>`
            }));
        } else {
            return [{
                x: scatterData.map(p => p.x),
                y: scatterData.map(p => p.y),
                text: scatterData.map(p => `${feature}: ${p.value}`),
                mode: "markers",
                type: "scatter",
                marker: {
                    size: currentMarkerSize,
                    color: scatterData.map(p => p.value),
                    colorscale: [
                        ['0.0000', 'rgb(49,54,149)'],
                        ['0.1111', 'rgb(69,117,180)'],
                        ['0.2222', 'rgb(116,173,209)'],
                        ['0.3333', 'rgb(171,217,233)'],
                        ['0.4444', 'rgb(224,243,248)'],
                        ['0.5556', 'rgb(254,224,144)'],
                        ['0.6667', 'rgb(253,174,97)'],
                        ['0.7778', 'rgb(244,109,67)'],
                        ['0.8889', 'rgb(215,48,39)'],
                        ['1.0000', 'rgb(165,0,38)']
                    ],
                    colorbar: {titleside: 'right', len: 0.4, thickness: 20, x: 0.85, y: 0.5},
                    cmin: minFeature,
                    cmax: maxFeature,
                },
                hovertemplate: `${feature}: %{text}<br><extra></extra>`
            }];
        }
    }, [scatterData, isCat, currentMarkerSize, feature, minFeature, maxFeature]);

    // Handle zoom and layout changes
    const handlePlotUpdate = useCallback((data) => {
        if (!data || !plotRef.current) return;

        try {
            const layout = data.layout;
            if (!layout) return;

            const xRange = layout.xaxis && layout.xaxis.range;
            const yRange = layout.yaxis && layout.yaxis.range;

            if (xRange && yRange) {
                setCurrentLayout(layout);

                const viewWidth = Math.abs(xRange[1] - xRange[0]);
                const viewHeight = Math.abs(yRange[1] - yRange[0]);

                // Prevent division by zero and invalid calculations
                if (viewWidth <= 0 || viewHeight <= 0 ||
                    coordinateRanges.dataWidth <= 0 || coordinateRanges.dataHeight <= 0) {
                    setZoomLevel(1);
                    return;
                }

                const zoomX = coordinateRanges.dataWidth / viewWidth;
                const zoomY = coordinateRanges.dataHeight / viewHeight;
                const newZoomLevel = Math.max(0.1, (zoomX + zoomY) / 2);

                if (!isNaN(newZoomLevel) && isFinite(newZoomLevel)) {
                    setZoomLevel(newZoomLevel);
                } else {
                    setZoomLevel(1);
                }
            }
        } catch (error) {
            console.warn('Error handling plot update:', error);
            setZoomLevel(1);
        }
    }, [coordinateRanges]);

    // Use useEffect to listen for layout changes
    useEffect(() => {
        if (!currentLayout) return;

        const xRange = currentLayout.xaxis && currentLayout.xaxis.range;
        const yRange = currentLayout.yaxis && currentLayout.yaxis.range;

        if (xRange && yRange) {
            const viewWidth = Math.abs(xRange[1] - xRange[0]);
            const viewHeight = Math.abs(yRange[1] - yRange[0]);

            // Prevent division by zero and invalid calculations
            if (viewWidth <= 0 || viewHeight <= 0 ||
                coordinateRanges.dataWidth <= 0 || coordinateRanges.dataHeight <= 0) {
                setZoomLevel(1);
                return;
            }

            const zoomX = coordinateRanges.dataWidth / viewWidth;
            const zoomY = coordinateRanges.dataHeight / viewHeight;
            const newZoomLevel = Math.max(1, (zoomX + zoomY) / 2);

            if (!isNaN(newZoomLevel) && isFinite(newZoomLevel)) {
                setZoomLevel(newZoomLevel);
            } else {
                setZoomLevel(1);
            }
        }
    }, [currentLayout, coordinateRanges]);

    // Plotly layout - FIXED: Conditionally add image based on showImage
    const layout = useMemo(() => {
        const baseLayout = {
            title: feature,
            showlegend: isCat,
            autosize: true,
            scrollZoom: true,
            xaxis: {
                showgrid: false,
                zeroline: false,
                visible: false,
                range: coordinateRanges.xRange,
                autorange: false
            },
            yaxis: {
                showgrid: false,
                zeroline: false,
                visible: false,
                range: coordinateRanges.yRange,
                autorange: false
            },
            margin: {l: 0, r: 0, t: 0, b: 0},
            legend: {
                orientation: "v",
                x: 0.85,
                y: 0.8,
                itemsizing: "constant",
                bgcolor: "rgba(0,0,0,0)"
            },
        };

        // Only add image if available AND showImage is true
        if (showImage && imageUrl && naturalDimensions.width > 0 && naturalDimensions.height > 0) {
            baseLayout.images = [{
                source: imageUrl,
                x: 0, y: 0,
                xref: "x", yref: "y",
                sizex: naturalDimensions.width,
                sizey: naturalDimensions.height,
                layer: "below",
                sizing: 'stretch',
            }];
        }

        return baseLayout;
    }, [imageUrl, naturalDimensions, feature, isCat, coordinateRanges, showImage]); // Added showImage to dependency array

    // Improved reset zoom function
    const resetZoom = (gd) => {
        // Get the container size
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        // Set zoom-out level to fit the container
        const xRange = [0, containerWidth];
        const yRange = [containerHeight, 0];

        // Apply new range with relayout
        Plotly.relayout(gd, {
            'xaxis.range': xRange,
            'yaxis.range': yRange,
        });
    };

    return (
        <div ref={containerRef} style={{
            width: "100%",
            position: "relative",
            aspectRatio: (showImage && naturalDimensions.width > 0 && naturalDimensions.height > 0)
                ? `${naturalDimensions.width / naturalDimensions.height}`
                : "1",
            backgroundColor: (showImage && imageUrl) ? "transparent" : "#f5f5f5",
            border: (showImage && imageUrl) ? "none" : "1px solid #e0e0e0",
            borderRadius: "4px"
        }}>
            <Plot
                ref={plotRef}
                data={traces}
                layout={layout}
                useResizeHandler
                style={{width: "100%", height: "100%"}}
                onUpdate={handlePlotUpdate}
                config={{
                    responsive: true,
                    displaylogo: false,
                    doubleClick: false,
                    toImageButtonOptions: {
                        name: "Save as PNG",
                        format: 'png',
                        filename: `BDP_png-${feature}`,
                        scale: 1
                    },
                    modeBarButtonsToRemove: [
                        "autoScale2d",
                        "resetScale2d",
                        "select2d",
                        "lasso2d",
                    ],
                    modeBarButtonsToAdd: [
                        [
                            {
                                name: "Save as SVG",
                                icon: Plotly.Icons.disk,
                                click: function (gd) {
                                    Plotly.downloadImage(gd, {format: "svg", filename: `BDP_svg-${feature}`});
                                },
                            },
                            {
                                name: "Reset View",
                                icon: Plotly.Icons.autoscale,
                                click: function (gd) {
                                    resetZoom(gd);
                                },
                            },
                        ],
                    ],
                }}
            />
        </div>
    );
});

PlotlyFeaturePlotVisium.propTypes = {
    visiumData: PropTypes.shape({
        coordinates: PropTypes.object.isRequired,
        scales: PropTypes.object.isRequired,
        image: PropTypes.oneOfType([PropTypes.instanceOf(Blob), PropTypes.object])
    }).isRequired,
    geneData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    feature: PropTypes.string.isRequired,
    showImage: PropTypes.bool.isRequired
};

export default PlotlyFeaturePlotVisium;