import { useState, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";

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

function GeneViewPlotlyPlot({
  geneName,
  genes,
  snpData,
  celltype,
  handleSelect,
}) {
  // TODO
  // const [naturalDimensions, setNaturalDimensions] = useState({
  //   width: 0,
  //   height: 0,
  // });
  // const [displayScale, setDisplayScale] = useState(1);

  const snpList = snpData.map(
    ({ snp_id, p_value, beta_value, position, ...rest }) => ({
      ...rest,
      id: snp_id,
      y: -Math.log10(p_value) * Math.sign(beta_value),
      beta: beta_value,
      x: position,
      p_value,
    }),
  );

  const gene = genes.find((g) => g.gene_id === geneName);
  const geneStart = gene ? gene.position_start : 0;
  const geneEnd = gene ? gene.position_end : 0;

  // Calculate X and Y ranges
  const oneMb = 1_000_000;
  const xValues = snpList.map((snp) => snp.x);
  const yValues = snpList.map((snp) => snp.y);
  const betaValues = snpList.map((snp) => snp.beta);
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

  const formatNumber = (num, precision) => {
    const rounded = round(num, precision);
    return rounded < 0 // Just in case there's a hyphen in there somehow
      ? rounded.toString().replace("-", "−")
      : rounded.toString();
  };

  const snpTraces = snpList.map((snp) => {
    return {
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
      text:
        `<b>SNP:</b> ${snp.id}<br>` +
        `<b>Position:</b> ${snp.x}<br>` +
        `<b>β:</b> ${formatNumber(snp.beta, 3)}<br>` +
        `−<b>log10(p):</b> ${formatNumber(snp.y * Math.sign(snp.beta), 3)}`,
      pointType: "snp",
      showlegend: false,
    };
  });

  const visibleNearbyGenes = useMemo(() => {
    const [xMin, xMax] = xRange;
    return genes.filter(
      (g) =>
        g.position_end >= xMin - 100_000 && g.position_start <= xMax + 100_000,
    );
  }, [genes, xRange]);

  const jitterMap = useMemo(() => {
    const map = new Map();
    const minDistanceFromZero = 0.25;
    const maxAmplitude = 1.75;

    genes.forEach((gene) => {
      const sign = Math.random() > 0.5 ? 1 : -1;
      const amplitude =
        minDistanceFromZero +
        Math.random() * (maxAmplitude - minDistanceFromZero);
      map.set(gene.gene_id, sign * amplitude);
    });
    return map;
  }, [genes]);

  const annotations = useMemo(() => {
    return visibleNearbyGenes.map((gene) => {
      const start =
        gene.strand === "-" ? gene.position_end : gene.position_start;
      const end = gene.strand === "-" ? gene.position_start : gene.position_end;
      const isTargetGene = gene.gene_id === geneName;
      const jitter = jitterMap.get(gene.gene_id);

      return {
        x: end,
        y: isTargetGene ? 0 : jitter,
        ax: start,
        ay: isTargetGene ? 0 : jitter,
        xref: "x",
        yref: "y",
        axref: "x",
        ayref: "y",
        showarrow: true,
        arrowhead: isTargetGene ? 3 : 2,
        arrowsize: 1,
        arrowwidth: isTargetGene ? 2 : 1,
        arrowcolor: isTargetGene ? "black" : "rgb(161, 161, 161)",
      };
    });
  }, [geneName, jitterMap, visibleNearbyGenes]);

  const getClippedAnnotations = useCallback(
    (xRange) => {
      return annotations
        .map((a) => {
          const { ax, x, y } = a;

          // const [min, max] = currentLayout.xaxis.range;
          const [xMin, xMax] = xRange;
          const [yMin, yMax] = yRange;

          // Completely outside the view
          if ((ax < xMin && x < xMin) || (ax > xMax && x > xMax)) return null;
          if (y < yMin || y > yMax) return null;

          // Truncate at edges
          const clippedAx = Math.max(xMin, Math.min(ax, xMax));
          const clippedX = Math.max(xMin, Math.min(x, xMax));
          const clipped = { ...a, ax: clippedAx, x: clippedX };

          // Don't show arrowhead if truncated
          if (x !== clippedX) {
            clipped.arrowhead = 0;
          }

          return clipped;
        })
        .filter(Boolean);
    },
    [annotations, yRange],
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

  const geneTraces = useMemo(() => {
    // Create traces for all visible genes
    return visibleNearbyGenes.map((gene) => {
      const isTargetGene = gene.gene_id === geneName;
      const xPosition =
        gene.strand === "-" ? gene.position_end : gene.position_start;
      const jitter = isTargetGene ? 0 : jitterMap.get(gene.gene_id); // No jitter for target gene

      return {
        x: [xPosition],
        y: [jitter],
        type: "scatter",
        mode: isTargetGene ? "markers+text" : "markers",
        marker: {
          color: isTargetGene ? "black" : "rgb(161, 161, 161)",
          size: isTargetGene ? 10 : 8,
        },
        text: isTargetGene ? [gene.gene_id] : undefined,
        textposition: isTargetGene ? "top center" : undefined,
        name: gene.gene_id,
        pointType: "gene",
        showlegend: false,
        hoverinfo: "text",
        hovertext:
          `<b>Gene:</b> ${gene.gene_id}<br>` +
          `<b>Start:</b> ${gene.position_start}<br>` +
          `<b>End:</b> ${gene.position_end}<br>` +
          `<b>Strand:</b> ${gene.strand === "-" ? "−" : "+"}<br>`,
      };
    });
  }, [visibleNearbyGenes, geneName, jitterMap]);

  // Handle clicking points
  const onClick = (data) => {
    console.log("onClick data:", data);
    if (!data.points || data.points.length === 0) return;

    const point = data.points[0];
    const pointData = point.data;
    const pointType = pointData.pointType;

    if (pointType === "snp") {
      const name = pointData.name;
      const data = snpList.find((s) => s.id === name);

      const formattedData = (
        <>
          <strong>SNP:</strong> {data.id}
          <br />
          <strong>Position:</strong> {data.x}
          <br />
          <strong>β:</strong> {formatNumber(data.beta, 6)}
          <br />−<strong>log10(p):</strong>{" "}
          {formatNumber(data.y * Math.sign(data.beta), 6)}
        </>
      );

      handleSelect(name, formattedData);
      return;
    } else if (pointType === "gene") {
      const name = pointData.name;
      const data = genes.find((g) => g.gene_id === name);
      if (!data) return;

      // const formattedData = `
      //   Gene: ${data.gene_id}
      //   Start: ${data.position_start}
      //   End: ${data.position_end}
      //   Strand: ${data.strand === "-" ? "−" : "+"}
      // `.trim();

      const formattedData = (
        <>
          <strong>Gene:</strong> {data.gene_id}
          <br />
          <strong>Start:</strong> {data.position_start}
          <br />
          <strong>End:</strong> {data.position_end}
          <br />
          <strong>Strand:</strong> {data.strand === "-" ? "−" : "+"}
        </>
      );

      handleSelect(name, formattedData);
      return;
    }
  };

  // Plotly layout
  const layout = useMemo(
    () => ({
      title: `SNPs around ${geneName} (${celltype})`,
      plot_bgcolor: "white",
      paper_bgcolor: "#f5f5f5",
      showlegend: false,
      margin: { l: "auto", r: 5, t: 30, b: 30 },
      autosize: true,
      dragmode: "pan",
      xaxis: {
        // title: { text: `Genomic Position` },
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
        title: { text: "−log10(p)" },
        autorange: false,
        range: yRange,
        // minallowed: yMin,
        // maxallowed: yMax,
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
      annotations: getClippedAnnotations(xRange),
    }),
    [geneName, celltype, xRange, yRange, getClippedAnnotations],
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
        onClick={onClick}
        data={[...geneTraces, ...snpTraces]}
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
            filename: `BDP_png-${geneName}-${celltype}`, // TODO name
            scale: 1, // Multiply title/legend/axis/canvas sizes by this factor
          },
          modeBarButtonsToRemove: [
            "autoScale2d",
            /* "resetScale2d", */
            /* "select2d", */
            /* "lasso2d", */
          ],
          modeBarButtonsToAdd: [
            [
              {
                name: "Save as SVG",
                icon: Plotly.Icons.disk,
                click: function (gd) {
                  Plotly.downloadImage(gd, {
                    format: "svg",
                    filename: `BDP_svg-${geneName}-${celltype}`, // TODO name
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

          console.log(e);
          if (e["xaxis.autorange"]) setXRange([xMin, xMax]);
          if (e["yaxis.autorange"]) setYRange([yMin, yMax]);
          if (e["autosize"]) {
            setXRange([xMin, xMax]);
            setYRange([yMin, yMax]);
          }

          if (r0 != null && r1 != null) setXRange([r0, r1]);
          if (yr0 != null && yr1 != null) setYRange([yr0, yr1]);
        }}
      />
    </div>
  );
}

GeneViewPlotlyPlot.propTypes = {
  geneName: PropTypes.string.isRequired,
  genes: PropTypes.arrayOf(
    PropTypes.shape({
      gene_id: PropTypes.string.isRequired,
      position_start: PropTypes.number.isRequired,
      position_end: PropTypes.number.isRequired,
      strand: PropTypes.oneOf(["+", "-"]).isRequired,
    }),
  ).isRequired,
  snpData: PropTypes.arrayOf(
    PropTypes.shape({
      snp_id: PropTypes.string.isRequired,
      p_value: PropTypes.number.isRequired,
      beta_value: PropTypes.number.isRequired,
      position: PropTypes.number.isRequired,
    }),
  ).isRequired,
  celltype: PropTypes.string.isRequired,
  handleSelect: PropTypes.func.isRequired,
};

export default GeneViewPlotlyPlot;
