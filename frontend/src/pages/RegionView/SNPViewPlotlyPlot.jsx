import React, { useMemo, useEffect } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";

function dataToRGB({ beta, y }, min = 2, max = 3) {
  const maxLevel = 230;

  if (Math.abs(y) < 2)
    return beta > 0 ? `rgb(200, 161, 161)` : `rgb(161, 161, 200)`;

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

const SNPViewPlotlyPlot = React.memo(function SNPViewPlotlyPlot({
  snpName,
  snps,
  geneData,
  celltype,
  handleSelect,
}) {
  // TODO
  // const [naturalDimensions, setNaturalDimensions] = useState({
  //   width: 0,
  //   height: 0,
  // });
  // const [displayScale, setDisplayScale] = useState(1);

  const geneList = geneData.map(
    ({
      gene_id,
      p_value,
      beta_value,
      position_start,
      position_end,
      strand,
      ...rest
    }) => ({
      ...rest,
      id: gene_id,
      y: -Math.log10(p_value) * Math.sign(beta_value),
      beta: beta_value,
      position_start,
      position_end,
      p_value,
      strand,
    }),
  );

  const snp = snps.find((s) => s.snp_id === snpName);
  const snpPosition = snp ? snp.position : 0;

  // Calculate X and Y ranges
  const radius = 1_100_000;
  const xValues = geneList.flatMap((gene) => [
    gene.position_start,
    gene.position_end,
  ]);
  const yValues = geneList.map((gene) => gene.y);
  const betaValues = geneList.map((gene) => gene.beta);
  const maxBetaMagnitude = Math.max(...betaValues.map((b) => Math.abs(b)));
  const minBetaMagnitude = Math.min(...betaValues.map((b) => Math.abs(b)));

  const geneMin = Math.min(...xValues);
  const geneMax = Math.max(...xValues);

  const combinedMin = Math.min(geneMin, snpPosition);
  const combinedMax = Math.max(geneMax, snpPosition);
  const combinedRange = combinedMax - combinedMin;

  const xPadding = Math.round((combinedRange * 0.05) / 1000) * 1000; // 5% of range

  const paddedMin = combinedMin - xPadding;
  const paddedMax = combinedMax + xPadding;

  const xMin = Math.max(paddedMin, snpPosition - radius);
  const xMax = Math.min(paddedMax, snpPosition + radius);

  const yPadding = 1;
  const yMin = Math.min(...yValues, -2) - yPadding;
  const yMax = Math.max(...yValues, 2) + yPadding;

  const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);
  const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);

  const nearbySnpsRadius = 2_000_000;
  const nearbySnpsRange = useMemo(
    () => [snpPosition - nearbySnpsRadius, snpPosition + nearbySnpsRadius],
    [snpPosition],
  );

  const formatNumber = (num, precision) => {
    const rounded = round(num, precision);
    return rounded < 0 // Just in case there's a hyphen in there somehow
      ? rounded.toString().replace("-", "−")
      : rounded.toString();
  };

  const nearbySnps = useMemo(() => {
    const [xMin, xMax] = nearbySnpsRange;
    return snps.filter(
      (s) => s.snp_id !== snp && s.position >= xMin && s.position <= xMax,
    );
  }, [nearbySnpsRange, snps, snp]);

  const jitterMap = useMemo(() => {
    const map = new Map();
    const minDistanceFromZero = 0.25;
    const maxAmplitude = 1.75;

    snps.forEach((s) => {
      const sign = Math.random() > 0.5 ? 1 : -1;
      const amplitude =
        minDistanceFromZero +
        Math.random() * (maxAmplitude - minDistanceFromZero);
      map.set(s.snp_id, sign * amplitude);
    });
    return map;
  }, [snps]);

  // const snpTraces = useMemo(() => {
  //   return nearbySnps.map((s) => {
  //     const isTarget = s.snp_id === snpName;
  //     const x = s.position;
  //     const y = isTarget ? 0 : jitterMap.get(s.snp_id);

  //     return {
  //       x: [x],
  //       y: [y],
  //       type: "scatter",
  //       mode: isTarget ? "markers+text" : "markers",
  //       marker: {
  //         color: isTarget ? "black" : "rgb(161, 161, 161)",
  //         size: isTarget ? 12 : 8,
  //       },
  //       text: isTarget ? [s.snp_id] : [],
  //       textposition: isTarget ? "top center" : "none",
  //       name: s.snp_id,
  //       pointType: "snp",
  //       showlegend: false,
  //       hoverinfo: "text",
  //       hovertext: `<b>SNP ID:</b> ${s.snp_id}<br><b>Position:</b> ${s.position}<br>`,
  //     };
  //   });
  // }, [nearbySnps, snpName, jitterMap]);

  const snpTrace = useMemo(() => {
    return {
      x: nearbySnps.map((s) => s.position),
      y: nearbySnps.map((s) =>
        s.snp_id === snpName ? 0 : jitterMap.get(s.snp_id),
      ),
      type: "scatter",
      mode: "markers+text",
      marker: {
        color: nearbySnps.map((s) =>
          s.snp_id === snpName ? "black" : "rgb(161, 161, 161)",
        ),
        opacity: 1,
        size: nearbySnps.map((s) => (s.snp_id === snpName ? 12 : 8)),
        line: {
          width: 0.2,
          opacity: 0.8,
        },
      },
      text: nearbySnps.map((s) => (s.snp_id === snpName ? s.snp_id : "")),
      customdata: nearbySnps.map((s) => s.snp_id),
      textposition: "top center",
      name: "SNPs",
      pointType: "snp",
      showlegend: false,
      hoverinfo: "text",
      hovertext: nearbySnps.map(
        (s) =>
          `<b>SNP ID:</b> ${s.snp_id}<br><b>Position:</b> ${s.position}<br>`,
      ),
    };
  }, [nearbySnps, snpName, jitterMap]);

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

  // Multiple gene traces so each line can have its own color
  const geneTraces = useMemo(() => {
    return geneList.map((gene) => {
      const x0 = gene.strand === "-" ? gene.position_end : gene.position_start;
      const x1 = gene.strand === "-" ? gene.position_start : gene.position_end;
      const y0 = gene.y;
      const y1 = y0;
      const arrowSymbol =
        gene.strand === "-" ? "triangle-left" : "triangle-right";

      return {
        x: [x0, x1],
        y: [y0, y1],
        type: "scatter",
        mode: "lines+markers",
        line: {
          color: dataToRGB(gene, minBetaMagnitude, maxBetaMagnitude),
          width: 3,
        },
        marker: {
          symbol: ["circle", arrowSymbol],
          size: [0, 12],
          color: [
            dataToRGB(gene, minBetaMagnitude, maxBetaMagnitude),
            dataToRGB(gene, minBetaMagnitude, maxBetaMagnitude),
          ],
          opacity: [0, 1],
        },
        customdata: [gene.id],
        hoverinfo: "text",
        hovertext:
          `<b>Gene:</b> ${gene.id}<br>` +
          `<b>Start:</b> ${gene.position_start}<br>` +
          `<b>End:</b> ${gene.position_end}<br>` +
          `<b>Strand:</b> ${gene.strand === "-" ? "−" : "+"}<br>` +
          `<b>β:</b> ${formatNumber(gene.beta, 3)}<br>` +
          `−<b>log10(p):</b> ${formatNumber(gene.y * Math.sign(gene.beta), 3)}`,
        name: gene.id,
        pointType: "gene",
        showlegend: false,
      };
    });
  }, [geneList, minBetaMagnitude, maxBetaMagnitude]);

  // Handle clicking points
  const onClick = (data) => {
    console.log("onClick data:", data);
    if (!data.points || data.points.length === 0) return;

    const point = data.points[0];
    const pointData = point.data;
    const pointType = pointData.pointType;

    if (pointType === "snp") {
      const name = point.customdata || pointData.name;
      const data = nearbySnps.find((s) => s.snp_id === name);
      if (!data) return;

      const formattedData = (
        <>
          <strong>SNP:</strong> {data.snp_id}
          <br />
          <strong>Position:</strong> {data.position}
        </>
      );
      handleSelect(name, formattedData);
      return;
    } else if (pointType === "gene") {
      const name = point.customdata || pointData.name;
      const data = geneList.find((g) => g.id === name);
      if (!data) return;

      const formattedData = (
        <>
          <strong>Gene:</strong> {data.id}
          <br />
          <strong>Start:</strong> {data.position_start}
          <br />
          <strong>End:</strong> {data.position_end}
          <br />
          <strong>Strand:</strong> {data.strand === "-" ? "−" : "+"}
          <br />
          <strong>β:</strong> {formatNumber(data.beta, 6)}
          <br />−<strong>log10(p):</strong>{" "}
          {formatNumber(data.y * Math.sign(data.beta), 6)}
        </>
      );

      handleSelect(name, formattedData);
      return;
    }
  };

  // Plotly layout
  const layout = useMemo(
    () => ({
      title: `Genes around ${snpName} (${celltype})`,
      plot_bgcolor: "white",
      paper_bgcolor: "#f5f5f5",
      showlegend: false,
      margin: { l: "auto", r: 5, t: 30, b: 30 },
      autosize: true,
      dragmode: "pan",
      xaxis: {
        // title: { text: `Genomic Position` },
        range: initialXRange,
        minallowed: Math.min(nearbySnpsRange[0], paddedMin),
        maxallowed: Math.max(nearbySnpsRange[1], paddedMax),
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
        range: initialYRange,
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
    }),
    [snpName, celltype, initialXRange, nearbySnpsRange, initialYRange],
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
        data={[...geneTraces, snpTrace]}
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
            filename: `BDP_png-${snpName}-${celltype}`, // TODO name
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
                    filename: `BDP_svg-${snpName}-${celltype}`, // TODO name
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
      />
    </div>
  );
});

SNPViewPlotlyPlot.propTypes = {
  snpName: PropTypes.string.isRequired,
  snps: PropTypes.arrayOf(
    PropTypes.shape({
      snp_id: PropTypes.string.isRequired,
      position: PropTypes.number.isRequired,
    }),
  ).isRequired,
  geneData: PropTypes.arrayOf(
    PropTypes.shape({
      gene_id: PropTypes.string.isRequired,
      p_value: PropTypes.number.isRequired,
      beta_value: PropTypes.number.isRequired,
      position_start: PropTypes.number.isRequired,
      position_end: PropTypes.number.isRequired,
      strand: PropTypes.oneOf(["+", "-"]).isRequired,
    }),
  ).isRequired,
  celltype: PropTypes.string.isRequired,
  handleSelect: PropTypes.func.isRequired,
};

export default SNPViewPlotlyPlot;
