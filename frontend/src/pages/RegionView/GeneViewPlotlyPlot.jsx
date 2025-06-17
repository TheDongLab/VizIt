import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";
import {
  calculateMinMax,
  isCategorical,
  sortObjectByKey,
} from "../../utils/funcs.js";

function dataToRGB({ beta, y }) {
  beta = Math.max(Math.min(beta, 1), 0);
  if (Math.abs(y) < 2) return "rgb(161, 161, 161)";
  if (y >= 0)
    return `rgb(230, ${Math.floor(230 * (1 - beta))}, ${Math.floor(230 * (1 - beta))})`;
  return `rgb(${Math.floor(230 * (1 - beta))}, ${Math.floor(230 * (1 - beta))}, 230)`;
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
      y: -Math.log10(p_value),
      beta: beta_value,
      x: position,
      p_value,
    }),
  );
  console.log(snps);
  const padding = 50000;
  const xMin = geneStart - 1000000 - padding;
  const xMax = geneEnd + 1000000 + padding;
  const yValues = snps.map((snp) => snp.y);
  const yPadding = 1;
  const yMin = Math.min(...yValues, -2) - yPadding;
  const yMax = Math.max(...yValues, 2) + yPadding;
  const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);
  const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);

  const [xRange, setXRange] = useState(initialXRange);
  const [yRange, setYRange] = useState(initialYRange);

  useEffect(() => {
    console.log("Rendering gene plot: ", celltype);
    console.log("SNPs loaded:", snpData.length);
    console.log("Gene start and end", geneStart, geneEnd);
    console.log("initialRange", initialXRange, initialYRange);
    console.log("range", xRange, yRange);
  }, [
    celltype,
    snpData.length,
    geneStart,
    geneEnd,
    initialXRange,
    initialYRange,
    xRange,
    yRange,
  ]);

  const snpTraces = snps.map((snp) => ({
    x: [snp.x],
    y: [snp.y],
    type: "scatter",
    mode: "markers",
    marker: {
      color: dataToRGB(snp),
      size: 6,
    },
    name: snp.id,
    hoverinfo: "text",
    text: `${snp.id}<br>β=${snp.beta}<br>-log10(p)=${snp.y}`,
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
      const [xMin, xMax] = xRange; // TODO shadowing?
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
          if (e["xaxis.range[0]"] == null && e["yaxis.range[0]"] == null) {
            console.log(initialXRange, initialYRange);
            setXRange(initialXRange);
            setYRange(initialYRange);
            return;
          }

          const r0 = e["xaxis.range[0]"] ?? e["xaxis.range"]?.[0];
          const r1 = e["xaxis.range[1]"] ?? e["xaxis.range"]?.[1];
          const yr0 = e["yaxis.range[0]"] ?? e["yaxis.range"]?.[0];
          const yr1 = e["yaxis.range[1]"] ?? e["yaxis.range"]?.[1];

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
