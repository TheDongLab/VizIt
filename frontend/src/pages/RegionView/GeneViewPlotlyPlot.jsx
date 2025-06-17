import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";
import {
  calculateMinMax,
  isCategorical,
  sortObjectByKey,
} from "../../utils/funcs.js";

function dataToRGB({ beta, y }, min = 2, max = 3) {
  const maxLevel = 230;

  if (Math.abs(y) < 2)
    return beta > 0 ? `rgb(181, 161, 161)` : `rgb(161, 161, 181)`;

  const absBeta = Math.abs(beta);
  let intensity;

  if (min >= max) {
    intensity = absBeta >= max ? 1 : 0; // Treat min/max as single threshold
  } else {
    if (absBeta < min) intensity = 0;
    else if (absBeta > max) intensity = 1;
    else intensity = (absBeta - min) / (max - min); // Normalize to [0,1]
  }

  const channelValue = Math.round(maxLevel * (1 - intensity));

  return beta > 0
    ? `rgb(${maxLevel}, ${channelValue}, ${channelValue})`
    : `rgb(${channelValue}, ${channelValue}, ${maxLevel})`;
}

function round(num, precision = 6) {
  if (num == null || isNaN(num)) return "";
  return Number(Number(num).toPrecision(precision));
}

const GeneViewPlotlyPlot = ({
  geneName,
  geneStart,
  geneEnd,
  snpData,
  celltype,
}) => {
  // TODO
  // const [naturalDimensions, setNaturalDimensions] = useState({
  //   width: 0,
  //   height: 0,
  // });
  // const [displayScale, setDisplayScale] = useState(1);

  const snps = snpData.map(
    ({ snp_id, p_value, beta_value, position, ...rest }) => ({
      ...rest,
      id: snp_id,
      y: -Math.log10(p_value) * Math.sign(beta_value),
      beta: beta_value,
      x: position,
      p_value,
    }),
  );

  // Calculate X and Y ranges
  const oneMb = 1_000_000;
  const xValues = snps.map((snp) => snp.x);
  const yValues = snps.map((snp) => snp.y);
  const betaValues = snps.map((snp) => snp.beta);
  const maxBetaMagnitude = Math.max(...betaValues.map((b) => Math.abs(b)));
  const minBetaMagnitude = Math.min(...betaValues.map((b) => Math.abs(b)));

  const snpMin = Math.min(...xValues);
  const snpMax = Math.max(...xValues);

  const combinedMin = Math.min(snpMin, geneStart);
  const combinedMax = Math.max(snpMax, geneEnd);
  const combinedRange = combinedMax - combinedMin;

  const xPadding = Math.round((combinedRange * 0.05) / 1000) * 1000; // 5% of range

  const paddedMin = combinedMin - xPadding;
  const paddedMax = combinedMax + xPadding;

  const xMin = Math.max(paddedMin, geneStart - oneMb);
  const xMax = Math.min(paddedMax, geneEnd + oneMb);

  const yPadding = 1;
  const yMin = Math.min(...yValues, -2) - yPadding;
  const yMax = Math.max(...yValues, 2) + yPadding;

  const [xRange, setXRange] = useState([xMin, xMax]);
  const [yRange, setYRange] = useState([yMin, yMax]);

  useEffect(() => {
    console.log("Rendering gene plot: ", celltype);
    console.log("SNPs loaded:", snpData.length);
    console.log("Gene start and end", geneStart, geneEnd);
    console.log("range", xRange, yRange);
  }, [snpData.length, geneStart, geneEnd, xRange, yRange, celltype]);

  const snpTraces = snps.map((snp) => ({
    x: [snp.x],
    y: [snp.y],
    type: "scatter",
    mode: "markers",
    marker: {
      color: dataToRGB(snp, minBetaMagnitude, maxBetaMagnitude),
      size: 6,
    },
    name: snp.id,
    hoverinfo: "text",
    text: `<b>ID:</b> ${snp.id}<br><b>β:</b> ${round(snp.beta, 4)}<br><b>-log10(p):</b> ${round(snp.y, 4)}`,
    pointType: "snp",
    showlegend: false,
  }));

  const annotation = useMemo(() => {
    return {
      x: geneEnd,
      y: 0,
      ax: geneStart,
      ay: 0,
      xref: "x",
      yref: "y",
      axref: "x",
      ayref: "y",
      showarrow: true,
      arrowhead: 3,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: "black",
    };
  }, [geneStart, geneEnd]);

  const getClippedAnnotation = useCallback(
    (xRange) => {
      const { ax, x, y } = annotation;

      // const [min, max] = currentLayout.xaxis.range;
      const [xMin, xMax] = xRange;
      const [yMin, yMax] = yRange;

      // Completely outside the view
      if ((ax < xMin && x < xMin) || (ax > xMax && x > xMax)) return null;
      if (y < yMin || y > yMax) return null;

      // Truncate at edges
      const clippedAx = Math.max(xMin, Math.min(ax, xMax));
      const clippedX = Math.max(xMin, Math.min(x, xMax));
      const clipped = { ...annotation, ax: clippedAx, x: clippedX };

      // Don't show arrowhead if truncated
      if (x !== clippedX) {
        clipped.arrowhead = 0;
      }

      return clipped;
    },
    [annotation, yRange],
  );

  // Handle resize TODO
  // const updateScale = useCallback(() => {
  //   if (!containerRef.current || !naturalDimensions.width) return;
  //   const containerWidth = containerRef.current.offsetWidth;
  //   const scale = containerWidth / naturalDimensions.width;
  //   setDisplayScale(scale);
  // }, [naturalDimensions.width]);

  // useEffect(() => {
  //   if (!containerRef.current) return;
  //   const resizeObserver = new ResizeObserver(updateScale);
  //   resizeObserver.observe(containerRef.current);
  //   return () => resizeObserver.disconnect();
  // }, [updateScale]);

  // maybe useMemo
  const geneTrace = useMemo(() => {
    return {
      x: [geneStart],
      y: [0],
      type: "scatter",
      mode: "markers+text",
      marker: {
        color: "black",
        size: 10,
      },
      text: [geneName],
      textposition: "top center",
      name: geneName,
      pointType: "gene",
      showlegend: false,
      hoverinfo: "text",
    };
  }, [geneName, geneStart]);

  // Plotly layout
  const layout = useMemo(
    () => ({
      title: `SNPs around ${geneName} (${celltype})`,
      plot_bgcolor: "white",
      showlegend: false,
      automargin: true,
      /* margin: { l: "auto", r: "auto", t: "auto", b: "auto" }, */
      autosize: true,
      xaxis: {
        title: { text: "Genomic Position" },
        range: xRange,
        autorange: false,
        tickfont: { size: 10 },
        showgrid: false,
        ticks: "outside",
        ticklen: 6,
        tickwidth: 1,
        tickcolor: "black",
        zeroline: false,
        showline: true,
        mirror: true,
        linewidth: 1,
        linecolor: "black",
      },
      yaxis: {
        title: { text: "-log10(p)" },
        autorange: false,
        range: yRange,
        showgrid: false,
        zeroline: false,
        ticks: "outside",
        ticklen: 6,
        tickwidth: 1,
        tickcolor: "black",
        showline: true,
        mirror: true,
        linewidth: 1,
        linecolor: "black",
      },
      shapes: [
        {
          type: "line",
          xref: "paper",
          yref: "y",
          x0: 0,
          x1: 1,
          y0: -2,
          y1: -2,
          line: {
            color: "black",
            width: 1,
          },
          layer: "below",
        },
        {
          type: "line",
          xref: "paper",
          yref: "y",
          x0: 0,
          x1: 1,
          y0: 2,
          y1: 2,
          line: {
            color: "black",
            width: 1,
          },
          layer: "below",
        },
        {
          type: "rect",
          xref: "paper",
          yref: "y",
          x0: 0,
          x1: 1,
          y0: -2,
          y1: 2,
          fillcolor: "lightgray",
          opacity: 0.3,
          layer: "below",
          line: { width: 0 },
        },
        {
          type: "line",
          xref: "paper",
          yref: "y",
          x0: 0,
          x1: 1,
          y0: 0,
          y1: 0,
          line: {
            color: "black",
            width: 1,
            dash: "dash",
          },
          layer: "below",
        },
      ],
      annotations: [getClippedAnnotation(xRange)],
    }),
    [geneName, celltype, xRange, yRange, getClippedAnnotation],
  );

  // TODO test this instead of my thing
  // const resetZoom = (gd) => {
  //   // Get the container size
  //   const containerWidth = containerRef.current.offsetWidth;
  //   const containerHeight = containerRef.current.offsetHeight;

  //   // Set zoom-out level to fit the container
  //   const xRange = [0, containerWidth];
  //   const yRange = [containerHeight, 0];

  //   // const { width, height } = naturalDimensions;
  //   // console.log("Container size:",containerWidth, containerHeight);
  //   // console.log("Natural dimensions:",width, height);
  //   //
  //   // console.log(displayScale)

  //   // Apply new range with relayout
  //   Plotly.relayout(gd, {
  //     "xaxis.range": xRange,
  //     "yaxis.range": yRange,
  //     // 'images[0].sizex': containerWidth,
  //     // 'images[0].sizey': containerHeight
  //   });
  // };

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
      }}
    >
      <Plot
        data={[geneTrace, ...snpTraces]}
        style={{ width: "100%", height: "100%" }}
        layout={layout}
        useResizeHandler
        config={{
          doubleClick: "reset", // Double-click to reset zoom
          responsive: true, // Makes it adapt to screen size
          displaylogo: false, // Removes the Plotly logo
          scrollZoom: true, // Enable zooming with scroll wheel
          toImageButtonOptions: {
            name: "Save as PNG",
            format: "png", // one of png, svg, jpeg, webp
            filename: `BDP_png-${geneTrace.name}-${celltype}`, // TODO name
            scale: 1, // Multiply title/legend/axis/canvas sizes by this factor
          },
          /* modeBarButtonsToRemove: [ */
          /*   "autoScale2d", */
          /*   // "resetScale2d", */
          /*   // "select2d", */
          /*   // "lasso2d", */
          /* ], */
          modeBarButtonsToAdd: [
            [
              {
                name: "Save as SVG",
                icon: Plotly.Icons.disk,
                click: function (gd) {
                  Plotly.downloadImage(gd, {
                    format: "svg",
                    filename: `BDP_svg-${geneTrace.name}-${celltype}`, // TODO name
                  });
                },
              },
              /* { */
              /*   name: "Reset View", */
              /*   icon: Plotly.Icons.home, */
              /*   click: function (gd) { */
              /*     resetZoom(gd); // Reset the zoom and fit to container size */
              /*   }, */
              /* }, */
            ],
          ],
        }}
        onRelayout={(e) => {
          const r0 = e["xaxis.range[0]"] ?? e["xaxis.range"]?.[0];
          const r1 = e["xaxis.range[1]"] ?? e["xaxis.range"]?.[1];
          const yr0 = e["yaxis.range[0]"] ?? e["yaxis.range"]?.[0];
          const yr1 = e["yaxis.range[1]"] ?? e["yaxis.range"]?.[1];

          if (r0 == null && yr0 == null) {
            setXRange([xMin, xMax]);
            setYRange([yMin, yMax]);
            return;
          }

          if (r0 != null && r1 != null) setXRange([r0, r1]);
          if (yr0 != null && yr1 != null) setYRange([yr0, yr1]);
        }}
      />
    </div>
  );
};

GeneViewPlotlyPlot.propTypes = {
  geneName: PropTypes.string.isRequired,
  geneStart: PropTypes.number.isRequired,
  geneEnd: PropTypes.number.isRequired,
  snpData: PropTypes.arrayOf(
    PropTypes.shape({
      snp_id: PropTypes.string.isRequired,
      p_value: PropTypes.number.isRequired,
      beta_value: PropTypes.number.isRequired,
      position: PropTypes.number.isRequired,
    }),
  ).isRequired,
  celltype: PropTypes.string.isRequired,
};

export default GeneViewPlotlyPlot;
