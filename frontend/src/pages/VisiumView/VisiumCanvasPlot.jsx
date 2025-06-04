import {useEffect, useMemo, useRef} from 'react';
import PropTypes from "prop-types";
import {isCategorical} from "../../utils/funcs.js";

const CanvasFeaturePlot = ({visiumData, geneData, metaData, feature}) => {

    const coordinates = visiumData.coordinates;
    const scaleFactors = visiumData.scales;
    const imgBlob = visiumData.image;
    const imgUrl = URL.createObjectURL(imgBlob);

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
    // console.log("featuredData: ", featuredData);

    const colorPalette = [
        "#ff7f0e", "#1f77b4", "#2ca02c", "#da6f70", "#9467bd", "#8c564b", "#e377c2",
        "#0d1dd1", "#bcbd22", "#17becf", "#ff0000", "#00ff00", "#0000ff", "#ff00ff",
        "#00ffff", "#ffff00", "#9bed56", "#8000ff", "#0080ff", "#80ff00"
    ]; // Up to 20 unique colors

    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        const redraw = () => {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            const displayedWidth = img.offsetWidth;
            const displayedHeight = img.offsetHeight;

            if (!naturalWidth || !naturalHeight) return;

            const scaleX = displayedWidth / naturalWidth;
            const scaleY = displayedHeight / naturalHeight;

            const canvas = canvasRef.current;
            if (!canvas) return;

            canvas.width = displayedWidth;
            canvas.height = displayedHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Get valid data values
            const validEntries =  Object.entries(coordinates).map(([id,spot]) => ({
                ...spot,
                value: featuredData[id] ?? 0
            }))
            // .filter(spot => spot.value !== undefined);
            // console.log("validEntries: ", validEntries);

            if (validEntries.length === 0) return;

            // Calculate min/max for color scaling
            const values = validEntries.map(entry => entry.value);
            const uniqueValues = [...new Set(values)];
            // console.log("uniqueValues: ", uniqueValues);

            let min = 0;
            let max = 0;
            let colorMap = {};
            const isCat = isCategorical(values);
            // console.log("isCat: ", isCat);
            if (isCat) {
                colorMap = new Map();
                uniqueValues.forEach((value, index) => {
                    colorMap.set(value, colorPalette[index % colorPalette.length]);
                });
            } else {
                min = Math.min(...values);
                max = Math.max(...values);
            }


            // Color interpolation function (blue to red)
            const getColor = (value) => {
                const ratio = (value - min) / (max - min || 1);
                const hue = 240 - (ratio * 240); // 240 (blue) to 0 (red)
                return `hsl(${hue}, 100%, 50%)`;
            };

            // Calculate spot positions and draw
            validEntries.forEach(spot => {
                const y = spot.imagecol * scaleX * scaleFactors.lowres;
                const x = spot.imagerow * scaleY * scaleFactors.lowres;
                const radius = 2.5 * scaleX

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI); // Fixed radius of 3px
                ctx.fillStyle = isCat ? colorMap.get(spot.value) : getColor(spot.value);
                ctx.fill();
            });
        };

        img.addEventListener('load', redraw);

        // Handle container resize
        const resizeObserver = new ResizeObserver(redraw);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            img.removeEventListener('load', redraw);
            resizeObserver.disconnect();
        };
    }, [coordinates, scaleFactors, featuredData, imgBlob]);

    return (
        <div ref={containerRef} style={{position: 'relative', width: '100%'}}>
            <img
                ref={imgRef}
                src={imgUrl}
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block' // Remove extra space under image
                }}
                alt="Spatial tissue"
            />
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none' // Allow interactions with underlying elements
                }}
            />
        </div>
    );
};
CanvasFeaturePlot.propTypes = {
    visiumData: PropTypes.object.isRequired,
    geneData: PropTypes.object.isRequired,
    metaData: PropTypes.object.isRequired,
    feature: PropTypes.string.isRequired,
};
export default CanvasFeaturePlot;
