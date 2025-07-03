import React, {useEffect, useRef, useState, useCallback, useMemo} from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";
import {calculateMinMax, isCategorical, sortObjectByKey} from "../../utils/funcs.js";

const PlotlyFeaturePlot = React.memo(function PlotlyFeaturePlot({visiumData, geneData, metaData, feature}) {

    const containerRef = useRef(null);
    const [imageUrl, setImageUrl] = useState("");
    const [naturalDimensions, setNaturalDimensions] = useState({width: 0, height: 0});
    const [displayScale, setDisplayScale] = useState(1);

    // Destructure visium data
    const {coordinates, scales, image} = visiumData;
    const {lowres} = scales; // only use lowres value
    const {cell_metadata, cell_metadata_mapping, sample_metadata} = metaData
    const cell_level_meta = Object.keys(cell_metadata_mapping);

    // Load image and extract dimensions
    useEffect(() => {
        if (!image) return;
        const url = URL.createObjectURL(image);
        setImageUrl(url);

        const img = new Image();
        img.onload = () => {
            setNaturalDimensions({width: img.naturalWidth, height: img.naturalHeight});
        };
        img.src = url;

        return () => URL.revokeObjectURL(url);
    }, [image]);

    // Handle resize
    const updateScale = useCallback(() => {
        if (!containerRef.current || !naturalDimensions.width) return;
        const containerWidth = containerRef.current.offsetWidth;
        const scale = containerWidth / naturalDimensions.width;
        setDisplayScale(scale);
    }, [naturalDimensions.width]);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [updateScale]);

    // Extract feature data
    const featuredData = useMemo(() => {
        if (geneData[feature]) return geneData[feature];
        const data = {};
        Object.entries(cell_metadata || {}).forEach(([id, item]) => {
            if(cell_level_meta.includes(feature)){
                data[id] = cell_metadata_mapping[feature][item[feature]][0];
            } else{
                const sample_id = id.split("_")[0]
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
            x: item.imagecol * lowres,  // X coordinate
            y: item.imagerow * lowres,  // Y coordinate
            value: featuredData[id] ?? (isCat ? "Other" : 0)
        }));
    }, [coordinates, lowres, featuredData]);

    const colorPalette = [
        "#A7D16B", "#ADD9E9", "#A84D9D","#F68D40","#0A71B1","#016B62","#BFAFD4","#6BAED6","#7BCCC4",
        // "#ff7f0e", "#1f77b4", "#2ca02c", "#da6f70", "#9467bd", "#8c564b", "#e377c2",
        // "#0d1dd1", "#bcbd22", "#17becf", "#ff0000", "#00ff00", "#0000ff", "#ff00ff",
        // "#00ffff", "#ffff00", "#9bed56", "#8000ff", "#0080ff", "#80ff00"
    ]; // Up to 20 unique colors

    // Prepare trace data for Plotly
    const traces = useMemo(() => {
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
                marker: {size: 6 * displayScale, color: colorPalette[i % colorPalette.length]}
            }));
        } else {
            return [{
                x: scatterData.map(p => p.x),
                y: scatterData.map(p => p.y),
                text: scatterData.map(p => `${feature}: ${p.value}`),
                mode: "markers",
                type: "scatter",
                marker: {
                    size: 6 * displayScale,
                    color: scatterData.map(p => p.value),
                    colorscale: [
                        ['0.000000000000', 'rgb(49,54,149)'],
                        ['0.111111111111', 'rgb(69,117,180)'],
                        ['0.222222222222', 'rgb(116,173,209)'],
                        ['0.333333333333', 'rgb(171,217,233)'],
                        ['0.444444444444', 'rgb(224,243,248)'],
                        ['0.555555555556', 'rgb(254,224,144)'],
                        ['0.666666666667', 'rgb(253,174,97)'],
                        ['0.777777777778', 'rgb(244,109,67)'],
                        ['0.888888888889', 'rgb(215,48,39)'],
                        ['1.000000000000', 'rgb(165,0,38)']
                    ],
                    colorbar: {titleside: 'right', len: 0.4, thickness: 20, x: 0.85, y: 0.5},
                    cmin: minFeature,
                    cmax: maxFeature
                }
            }];
        }
    }, [scatterData, isCat, displayScale]);

    // Plotly layout
    const layout = useMemo(() => ({
        title: feature,
        showlegend: isCat,
        // automrgin: true,
        autosize: true,
        scrollZoom: true,
        xaxis: {showgrid: false, zeroline: false, visible: false, range: [0, naturalDimensions.width], autorange: false},
        yaxis: {showgrid: false, zeroline: false, visible: false, range: [naturalDimensions.height, 0], autorange: false},
        images: imageUrl ? [{
            source: imageUrl,
            x: 0, y: 0,
            xref: "x", yref: "y",
            sizex: naturalDimensions.width, sizey: naturalDimensions.height,
            layer: "below",
            sizing: 'stretch',
        }] : [],
        margin: {l: 0, r: 0, t: 0, b: 0},
        legend: {orientation: "v", x: 0.85, y: 0.8, itemsizing: "constant",bgcolor: "rgba(0,0,0,0)"},
    }), [imageUrl, naturalDimensions, feature]);

    const resetZoom = (gd) => {
         // Get the container size
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        // Set zoom-out level to fit the container
        const xRange = [0, containerWidth];
        const yRange = [containerHeight, 0];

        // const { width, height } = naturalDimensions;
        // console.log("Container size:",containerWidth, containerHeight);
        // console.log("Natural dimensions:",width, height);
        //
        // console.log(displayScale)

        // Apply new range with relayout
        Plotly.relayout(gd, {
            'xaxis.range': xRange,
            'yaxis.range': yRange,
            // 'images[0].sizex': containerWidth,
            // 'images[0].sizey': containerHeight
        });

    };

    return (
        <div ref={containerRef} style={{
            width: "100%",
            position: "relative",
            aspectRatio: naturalDimensions.width > 0 ? `${naturalDimensions.width / naturalDimensions.height}` : "1"
        }}>
            <Plot
                data={traces}
                layout={layout}
                useResizeHandler
                style={{width: "100%", height: "100%"}}
                config={{
                    responsive: true,  // Makes it adapt to screen size
                    displaylogo: false, // Removes the Plotly logo
                    doubleClick: false,
                    toImageButtonOptions: {
                        name: "Save as PNG",
                        format: 'png', // one of png, svg, jpeg, webp
                        filename: `BDP_png-${feature}`,
                        scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
                    },
                    modeBarButtonsToRemove: [
                        "autoScale2d", // Remove auto scale
                        "resetScale2d", // Remove reset axis
                        "select2d", // Remove 2D selection
                        "lasso2d", // Remove Lasso selection
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
                                icon: Plotly.Icons.home,
                                click: function (gd) {
                                    resetZoom(gd); // Reset the zoom and fit to container size
                                },
                            },
                        ],
                    ],
                }}
            />
        </div>
    );
});

PlotlyFeaturePlot.propTypes = {
    visiumData: PropTypes.shape({
        coordinates: PropTypes.object.isRequired,
        scales: PropTypes.object.isRequired,
        image: PropTypes.instanceOf(Blob).isRequired
    }).isRequired,
    geneData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    feature: PropTypes.string.isRequired
};

export default PlotlyFeaturePlot;
