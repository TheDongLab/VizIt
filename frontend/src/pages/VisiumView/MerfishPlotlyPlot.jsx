import React, {useEffect, useRef, useState, useCallback, useMemo} from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";
import {calculateMinMax, isCategorical, sortObjectByKey} from "../../utils/funcs.js";

const PlotlyFeaturePlotMerfish = React.memo(function PlotlyFeaturePlot({visiumData, geneData, metaData, feature, showImage=false}) {
    const containerRef = useRef(null);
    const plotRef = useRef(null);
    const [imageUrl, setImageUrl] = useState("");
    const [naturalDimensions, setNaturalDimensions] = useState({width: 0, height: 0});
    const [zoomLevel, setZoomLevel] = useState(1);
    const [currentLayout, setCurrentLayout] = useState(null);

    const baseMarkerSize = 2.0;

    // Destructure visium data
    const {coordinates, image} = visiumData;
    const {cell_metadata, cell_metadata_mapping, sample_metadata} = metaData
    const cell_level_meta = Object.keys(cell_metadata_mapping);

    // Load image and extract dimensions - FIXED
    useEffect(() => {
        // Clear image if showImage is false or no image available
        if (!showImage || !image || ("success" in image && !image.success)) {
            setImageUrl("");
            setNaturalDimensions({width: 0, height: 0});
            return;
        }

        // Handle different image types
        let urlToUse = "";

        if (typeof image === "string") {
            // Image is already a URL string
            urlToUse = image;
        } else if (image instanceof Blob) {
            // Image is a Blob - create object URL
            urlToUse = URL.createObjectURL(image);
        } else {
            console.warn("Unsupported image type:", typeof image);
            setImageUrl("");
            setNaturalDimensions({width: 0, height: 0});
            return;
        }

        setImageUrl(urlToUse);

        const img = new Image();
        img.onload = () => {
            setNaturalDimensions({width: img.naturalWidth, height: img.naturalHeight});
        };
        img.onerror = () => {
            console.warn("Failed to load image");
            setImageUrl("");
            setNaturalDimensions({width: 0, height: 0});
            // Only revoke if we created the URL
            if (typeof image !== "string") {
                URL.revokeObjectURL(urlToUse);
            }
        };
        img.src = urlToUse;

        // Cleanup function - only revoke if we created the URL
        return () => {
            if (typeof image !== "string" && urlToUse) {
                URL.revokeObjectURL(urlToUse);
            }
        };
    }, [image, showImage]); // Added showImage to dependencies

    // Calculate coordinate ranges from object format
    const coordinateRanges = useMemo(() => {
        if (!coordinates || Object.keys(coordinates).length === 0) {
            return { xRange: [0, 1], yRange: [0, 1], dataWidth: 1, dataHeight: 1 };
        }

        const xValues = Object.values(coordinates).map(coord => coord.x);
        const yValues = Object.values(coordinates).map(coord => coord.y);

        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);

        const xPadding = (xMax - xMin) * 0.05;
        const yPadding = (yMax - yMin) * 0.05;

        return {
            xRange: [xMin - xPadding, xMax + xPadding],
            yRange: [yMin - yPadding, yMax + yPadding],
            dataWidth: xMax - xMin,
            dataHeight: yMax - yMin
        };
    }, [coordinates]);

    // Extract feature data
    const featuredData = useMemo(() => {
        if (geneData[feature]) return geneData[feature];

        const data = {};
        Object.entries(cell_metadata || {}).forEach(([id, item]) => {
            if(cell_level_meta.includes(feature)){
                data[id] = cell_metadata_mapping[feature][item[feature]][0];
            } else{
                const sample_id = id.split('_').slice(0,-1).join('_')
                data[id] = sample_metadata[sample_id][feature];
            }
        });
        return data;
    }, [geneData, cell_metadata, feature, cell_level_meta, cell_metadata_mapping, sample_metadata]);

    // Compute color mapping
    const {minFeature, maxFeature, isCat} = useMemo(() => {
        const values = Object.values(featuredData);
        if (values.length === 0) {
            return { minFeature: 0, maxFeature: 1, isCat: false };
        }

        if (isCategorical(values)) {
            return {
                minFeature: 0,
                maxFeature: new Set(values).size - 1,
                isCat: true
            };
        } else {
            const [min, max] = calculateMinMax(values);
            return { minFeature: min, maxFeature: max, isCat: false };
        }
    }, [featuredData]);

    // Prepare scatter plot data from object coordinates
    const scatterData = useMemo(() => {
        if (!coordinates || Object.keys(coordinates).length === 0) return [];

        return Object.entries(coordinates).map(([csid, coord]) => ({
            id: csid,
            x: coord.x,
            y: coord.y,
            value: featuredData[csid] ?? (isCat ? "Other" : 0)
        }));
    }, [coordinates, featuredData, isCat]);

    const colorPalette = [
        "#A7D16B", "#ADD9E9", "#A84D9D","#F68D40","#0A71B1","#016B62","#BFAFD4","#6BAED6","#7BCCC4",
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    ];

    // Calculate current marker size based on zoom level
    const calculateMarkerSize = useCallback((currentZoomLevel = zoomLevel) => {
        const dynamicSize = baseMarkerSize * Math.abs(currentZoomLevel);
        return Math.max(2, Math.min(100, dynamicSize));
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
                marker: {
                    size: currentMarkerSize,
                    color: colorPalette[i % colorPalette.length],
                    opacity: 0.8
                },
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
                    colorbar: {
                        titleside: 'right',
                        len: 0.4,
                        thickness: 20,
                        x: 0.85,
                        y: 0.5
                    },
                    cmin: minFeature,
                    cmax: maxFeature,
                    opacity: 0.8,
                },
                hovertemplate: `${feature}: %{value}<br><extra></extra>`
            }];
        }
    }, [scatterData, isCat, feature, minFeature, maxFeature, currentMarkerSize]);

    // Handle plot updates to detect zoom
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

                // Prevent division by zero
                if (viewWidth <= 0 || viewHeight <= 0 ||
                    coordinateRanges.dataWidth <= 0 || coordinateRanges.dataHeight <= 0) {
                    setZoomLevel(1);
                    return;
                }

                const zoomX = coordinateRanges.dataWidth / viewWidth;
                const zoomY = coordinateRanges.dataHeight / viewHeight;
                const newZoomLevel = Math.max(1, (zoomX + zoomY) / 2);

                setZoomLevel(newZoomLevel);
            }
        } catch (error) {
            console.warn('Error handling plot update:', error);
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

            // Prevent division by zero
            if (viewWidth <= 0 || viewHeight <= 0 ||
                coordinateRanges.dataWidth <= 0 || coordinateRanges.dataHeight <= 0) {
                setZoomLevel(1);
                return;
            }

            const zoomX = coordinateRanges.dataWidth / viewWidth;
            const zoomY = coordinateRanges.dataHeight / viewHeight;
            const newZoomLevel = Math.max(1, (zoomX + zoomY) / 2);

            setZoomLevel(newZoomLevel);
        }
    }, [currentLayout, coordinateRanges]);

    // Plotly layout - FIXED
    const layout = useMemo(() => {
        const hasImage = showImage && imageUrl && naturalDimensions.width > 0 && naturalDimensions.height > 0;

        // Use image dimensions if available and showImage is true, otherwise use coordinate ranges
        const xRange = hasImage ? [0, naturalDimensions.width] : coordinateRanges.xRange;
        const yRange = hasImage ? [naturalDimensions.height, 0] : coordinateRanges.yRange;

        const images = hasImage ? [{
            source: imageUrl,
            x: 0,
            y: 0, // Fixed: Start from bottom (0) instead of naturalDimensions.height
            xref: "x",
            yref: "y",
            sizex: naturalDimensions.width,
            sizey: naturalDimensions.height,
            layer: "below",
            sizing: 'stretch',
            opacity: 0.8
        }] : [];

        return {
            // title: {text: feature, font: { size: 14 }},
            showlegend: isCat && scatterData.length > 0,
            autosize: true,
            scrollZoom: true,
            xaxis: {
                showgrid: false,
                zeroline: false,
                visible: false,
                range: xRange,
                autorange: false,
                scaleanchor: 'y', // Keep aspect ratio
            },
            yaxis: {
                showgrid: false,
                zeroline: false,
                visible: false,
                range: yRange,
                autorange: false
            },
            images: images,
            margin: {l: 0, r: 0, t: 40, b: 0},
            legend: {
                orientation: "v",
                x: 0.85,
                y: 0.8,
                itemsizing: "constant",
                bgcolor: "rgba(255,255,255,0.8)",
                // bordercolor: "rgba(0,0,0,0.2)",
                // borderwidth: 1
            },
            // plot_bgcolor: hasImage ? 'rgba(0,0,0,0)' : '#f5f5f5', // Background when no image
            // paper_bgcolor: 'rgba(0,0,0,0)',
        };
    }, [imageUrl, naturalDimensions, coordinateRanges, feature, isCat, scatterData.length, showImage]);

    // Handle plot initialization
    const handlePlotInitialized = useCallback((gd) => {
        plotRef.current = gd;
    }, []);

    // Calculate container aspect ratio - FIXED
    const containerStyle = useMemo(() => {
        const hasImage = showImage && imageUrl && naturalDimensions.width > 0 && naturalDimensions.height > 0;

        if (hasImage) {
            return {
                width: "100%",
                position: "relative",
                aspectRatio: `${naturalDimensions.width} / ${naturalDimensions.height}`
            };
        } else if (coordinateRanges.dataWidth > 0 && coordinateRanges.dataHeight > 0) {
            return {
                width: "100%",
                position: "relative",
                aspectRatio: `${coordinateRanges.dataWidth} / ${coordinateRanges.dataHeight}`,
                border: "1px solid #e0e0e0",
                borderRadius: "4px"
            };
        }

        return {
            width: "100%",
            height: "400px",
            position: "relative"
        };
    }, [imageUrl, naturalDimensions, coordinateRanges, showImage]);

    return (
        <div ref={containerRef} style={containerStyle}>
            <Plot
                ref={plotRef}
                data={traces}
                layout={layout}
                useResizeHandler
                style={{width: "100%", height: "100%"}}
                onInitialized={handlePlotInitialized}
                onUpdate={handlePlotUpdate}
                config={{
                    responsive: true,
                    displaylogo: false,
                    doubleClick: false,
                    toImageButtonOptions: {
                        name: "Save as PNG",
                        format: 'png',
                        filename: `BDP_png-${feature}`,
                        scale: 2
                    },
                    modeBarButtonsToRemove: [
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
                        ],
                    ],
                }}
            />
        </div>
    );
});

PlotlyFeaturePlotMerfish.propTypes = {
    visiumData: PropTypes.shape({
        coordinates: PropTypes.objectOf(PropTypes.shape({
            x: PropTypes.number.isRequired,
            y: PropTypes.number.isRequired
        })).isRequired,
        image: PropTypes.oneOfType([
            PropTypes.instanceOf(Blob),
            PropTypes.string,
            PropTypes.object
        ]),
    }).isRequired,
    geneData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    feature: PropTypes.string.isRequired,
    showImage: PropTypes.bool.isRequired
};

export default PlotlyFeaturePlotMerfish;