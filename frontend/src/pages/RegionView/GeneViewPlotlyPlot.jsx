import React, { useMemo } from "react";
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

const GeneViewPlotlyPlot = React.memo(function GeneViewPlotlyPlot({
  geneName,
  genes,
  snpData,
  chromosome,
  cellTypes,
  handleSelect,
}) {
  // TODO
  // const [naturalDimensions, setNaturalDimensions] = useState({
  //   width: 0,
  //   height: 0,
  // });
  // const [displayScale, setDisplayScale] = useState(1);

  const combinedSnpList = Object.entries(snpData).flatMap(([celltype, snps]) =>
    snps.map(({ snp_id, p_value, beta_value, position, ...rest }) => ({
      ...rest,
      id: snp_id,
      y: -Math.log10(p_value),
      beta: beta_value,
      x: position,
      p_value,
      celltype,
    })),
  );

  const gene = genes.find((g) => g.gene_id === geneName);
  const geneStart = gene ? gene.position_start : 0;
  const geneEnd = gene ? gene.position_end : 0;

  // Calculate X and Y ranges
  const radius = 1_000_000;
  const xValues = combinedSnpList.map((snp) => snp.x);
  const yValues = combinedSnpList.map((snp) => snp.y);
  const betaValues = combinedSnpList.map((snp) => snp.beta);
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

  const xMin = Math.max(paddedMin, geneStart - radius);
  const xMax = Math.min(paddedMax, geneEnd + radius);

  const yPadding = 1;
  const yMin = Math.min(...yValues, 0);
  const yMax = Math.max(...yValues, 2) + yPadding;

  const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);
  const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);

  const nearbyXValues = useMemo(
    () => genes.flatMap((gene) => [gene.position_start, gene.position_end]),
    [genes],
  );

  const nearbyGenesRange = useMemo(() => {
    const nearbyMin = Math.min(...nearbyXValues);
    const nearbyMax = Math.max(...nearbyXValues);
    const nearbyPadding =
      Math.round(((nearbyMax - nearbyMin) * 0.05) / 1000) * 1000; // 5% padding
    return [
      Math.max(nearbyMin - nearbyPadding),
      Math.min(nearbyMax + nearbyPadding),
    ];
  }, [nearbyXValues]);

  const formatNumber = (num, precision) => {
    const rounded = round(num, precision);
    return rounded < 0 // Just in case there's a hyphen in there somehow
      ? rounded.toString().replace("-", "−")
      : rounded.toString();
  };

  const snpTraces = useMemo(() => {
    return cellTypes.flatMap((celltype, i) => {
      const cellSnps = snpData[celltype] || [];
      const snpList = cellSnps.map(
        ({ snp_id, p_value, beta_value, position, ...rest }) => ({
          ...rest,
          id: snp_id,
          y: -Math.log10(p_value),
          beta: beta_value,
          x: position,
          p_value,
        }),
      );

      return [
        {
          name: celltype,
          x: snpList.map((snp) => snp.x),
          y: snpList.map((snp) => snp.y),
          xaxis: "x",
          yaxis: `y${i + 2}`,
          type: "scatter",
          mode: "markers",
          marker: {
            color: snpList.map((snp) =>
              dataToRGB(snp, minBetaMagnitude, maxBetaMagnitude),
            ),
            opacity: 1,
            size: snpList.map((snp) => (Math.abs(snp.y) < 2 ? 8 : 10)),
            line: {
              width: 0.2,
              opacity: 0.8,
            },
          },
          customdata: snpList.map((snp) => snp.id),
          hoverinfo: "text",
          text: snpList.map(
            (snp) =>
              `<b>SNP:</b> ${snp.id}<br>` +
              `<b>Position:</b> ${snp.x}<br>` +
              `<b>β:</b> ${formatNumber(snp.beta, 3)}<br>` +
              `<b>−log10(p):</b> ${formatNumber(snp.y, 3)}`,
          ),
          pointType: "snp",
        },
      ];
    });
  }, [cellTypes, snpData, minBetaMagnitude, maxBetaMagnitude]);

  const jitterMap = useMemo(() => {
    const map = new Map();
    const maxAmplitude = 1.75;

    genes.forEach((gene) => {
      const sign = Math.random() > 0.5 ? 1 : -1;
      const amplitude = Math.random() * maxAmplitude;
      map.set(gene.gene_id, sign * amplitude);
    });
    return map;
  }, [genes]);

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

  const geneTraces = useMemo(() => {
    const getStart = (gene) =>
      gene.strand === "-" ? gene.position_end : gene.position_start;
    const getEnd = (gene) =>
      gene.strand === "-" ? gene.position_start : gene.position_end;
    const isTargetGene = (gene) => gene.gene_id === geneName;

    const otherGenes = genes.filter((g) => !isTargetGene(g));
    const targetGene = gene;
    if (!targetGene) return [];

    // We need null values to create breaks in the line
    const others = {
      x: otherGenes.flatMap((gene) => [getStart(gene), getEnd(gene), null]),
      y: otherGenes.flatMap((gene) => {
        const jitter = jitterMap.get(gene.gene_id);
        return [jitter, jitter, null];
      }),
      xaxis: "x",
      yaxis: "y",
      type: "scatter",
      mode: "lines+markers",
      line: {
        color: "rgb(161,161,161)",
        width: 2,
      },
      marker: {
        symbol: otherGenes.flatMap((gene) => [
          "circle",
          gene.strand === "-" ? "triangle-left" : "triangle-right",
          null,
        ]),
        size: otherGenes.flatMap(() => [0, 8, null]),
        color: otherGenes.flatMap(() => [
          "rgb(161,161,161)",
          "rgb(161,161,161)",
          null,
        ]),
        opacity: otherGenes.flatMap(() => [0, 1, null]),
      },
      customdata: otherGenes.flatMap((gene) => [
        gene.gene_id,
        gene.gene_id,
        null,
      ]),
      hoverinfo: "text",
      hovertext: otherGenes.flatMap((gene) => {
        const text =
          `<b>Gene:</b> ${gene.gene_id}<br>` +
          `<b>Start:</b> ${gene.position_start}<br>` +
          `<b>End:</b> ${gene.position_end}<br>` +
          `<b>Strand:</b> ${gene.strand === "-" ? "−" : "+"}`;
        return [text, text, null];
      }),
      name: "Nearby Genes",
      pointType: "gene",
      showlegend: false,
    };

    const target = {
      x: [getStart(targetGene), getEnd(targetGene)],
      y: [0, 0],
      xaxis: "x",
      yaxis: "y",
      type: "scatter",
      mode: "lines+markers",
      line: {
        color: "black",
        width: 3,
      },
      marker: {
        symbol: [
          "circle",
          targetGene.strand === "-" ? "triangle-left" : "triangle-right",
        ],
        size: [0, 12],
        color: ["black", "black"],
        opacity: [0, 1],
      },
      customdata: [targetGene.gene_id],
      hoverinfo: "text",
      hovertext:
        `<b>Gene:</b> ${targetGene.gene_id}<br>` +
        `<b>Start:</b> ${targetGene.position_start}<br>` +
        `<b>End:</b> ${targetGene.position_end}<br>` +
        `<b>Strand:</b> ${targetGene.strand === "-" ? "−" : "+"}`,
      name: targetGene.gene_id,
      pointType: "gene",
      showlegend: false,
    };

    return [others, target];
  }, [gene, geneName, genes, jitterMap]);

  // Handle clicking points
  const onClick = (data) => {
    console.log("onClick data:", data);
    if (!data.points || data.points.length === 0) return;

    const point = data.points[0];
    const pointData = point.data;
    const pointType = pointData.pointType;
    const name = point.customdata || pointData.name;

    if (pointType === "snp") {
      const data = combinedSnpList.filter((s) => s.id === name);
      if (!data || data.length === 0) return;

      const formattedData = (
        <>
          <strong>SNP:</strong> {data[0].id}
          <br />
          <strong>Position:</strong> {data[0].x}
          <br />
          {/* <strong>β:</strong> {formatNumber(data.beta, 6)} */}
          {/* <br />−<strong>log10(p):</strong>{" "} */}
          {/* {formatNumber(data.y * Math.sign(data.beta), 6)} */}
          {/* Group each cell‑type’s stats on the same row */}
          <table
            style={{
              marginTop: "0.75em",
              borderCollapse: "collapse",
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Cell Type</th>
                <th style={{ textAlign: "right" }}>β</th>
                <th style={{ textAlign: "right" }}>−log10(p)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, idx) => (
                <tr key={idx}>
                  <td>{d.celltype}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(d.beta, 3)}
                  </td>
                  <td style={{ textAlign: "right" }}>{formatNumber(d.y, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );

      handleSelect(name, formattedData);
      return;
    } else if (pointType === "gene") {
      console.log("Clicked gene:", name);
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

  const subplotSpacing = 0.02;
  const totalSubplots = cellTypes.length + 1; // +1 for the gene trace
  const heightPerTrack =
    (1 - subplotSpacing * (totalSubplots - 1)) / totalSubplots;

  // Plotly layout
  const layout = useMemo(
    () => ({
      title: {
        text: `<b>${geneName}</b><br>${chromosome}`,
        font: { size: 20 },
      },
      paper_bgcolor: "rgba(0,0,0,0)", // Transparent paper background
      showlegend: false,
      margin: { l: 80, r: 80, t: 80, b: 80 },
      autosize: true,
      dragmode: "pan",
      grid: {
        rows: cellTypes.length + 1,
        columns: 1,
        roworder: "top to bottom",
        // shared_xaxes: true,
        // pattern: "independent",
      },
      xaxis: {
        title: { text: `Genomic Position` },
        range: initialXRange,
        minallowed: Math.min(nearbyGenesRange[0], xMin),
        maxallowed: Math.max(nearbyGenesRange[1], xMax),
        autorange: false,
        tickfont: { size: 10 },
        showgrid: true,
        ticks: "inside",
        ticklen: 6,
        tickwidth: 1,
        tickcolor: "black",
        zeroline: false,
        showline: true,
        mirror: "all",
        // mirror: true,
        linewidth: 1,
        linecolor: "black",
        side: "bottom",
        anchor: "y",
        // position: 0,
        // domain: [0, 1],
        // side: "bottom",
      },
      ...cellTypes.reduce((acc, celltype, i) => {
        const start = (heightPerTrack + subplotSpacing) * (i + 1);
        const end = start + heightPerTrack;

        acc[`yaxis${i + 2}`] = {
          title: { text: `−log10(p)`, font: { size: 12 } },
          // title: {
          //   text: celltype,
          //   standoff: i % 2 === 0 ? 35 : 5, // Add standoff for every second cell type
          // },
          domain: [start, end],
          autorange: false,
          range: initialYRange,
          fixedrange: true, // Prevent zooming on y-axis
          showgrid: true,
          zeroline: false,
          ticks: "outside",
          ticklen: 6,
          tickwidth: 1,
          tickcolor: "black",
          showline: true,
          mirror: true,
          linewidth: 1,
          linecolor: "black",
          anchor: "x",
        };
        return acc;
      }, {}),
      yaxis: {
        autorange: false,
        domain: [0, heightPerTrack],
        range: [-2, 2],
        fixedrange: true, // Prevent zooming on y-axis
        // minallowed: yMin,
        // maxallowed: yMax,
        showgrid: false,
        zeroline: false,
        ticks: "",
        showticklabels: false,
        showline: true,
        mirror: true,
        linewidth: 1,
        linecolor: "black",
        anchor: "x",
      },
      shapes: [
        // ...Array(cellTypes.length - 1)
        //   .fill(0)
        //   .map((_, i) => ({
        //     type: "line",
        //     xref: "paper",
        //     yref: "paper", // coordinates relative to entire plot (0-1)
        //     x0: 0,
        //     x1: 1,
        //     y0: (i + 2) / (cellTypes.length + 1),
        //     y1: (i + 2) / (cellTypes.length + 1),
        //     line: {
        //       color: "black",
        //       width: 1,
        //       dash: "dot",
        //     },
        //     layer: "above",
        //   })),
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
        // {
        //   type: "line",
        //   xref: "paper",
        //   yref: "y",
        //   x0: 0,
        //   x1: 1,
        //   y0: 0,
        //   y1: 0,
        //   line: {
        //     color: "black",
        //     width: 1,
        //     dash: "dash",
        //   },
        //   layer: "below",
        // },
        ...cellTypes.flatMap((celltype, i) => [
          {
            type: "rect",
            xref: "paper",
            yref: `y${i + 2}`,
            x0: 0,
            x1: 1,
            y0: -2,
            y1: 2,
            fillcolor: "lightgray",
            opacity: 0.3,
            // layer: "below",
            line: { width: 0 },
          },
          // {
          //   type: "line",
          //   xref: "paper",
          //   yref: `y${i + 2}`,
          //   x0: 0,
          //   x1: 1,
          //   y0: 0,
          //   y1: 0,
          //   line: {
          //     color: "black",
          //     width: 1,
          //     dash: "dash",
          //   },
          //   layer: "below",
          // },
        ]),
      ],
      annotations: [
        ...cellTypes.map((celltype, i) => {
          const start = (heightPerTrack + subplotSpacing) * (i + 1);
          const top = start + heightPerTrack;

          return {
            text: celltype,
            font: {
              size: 16,
            },
            xref: "paper",
            yref: "paper",
            x: 0.001,
            y: top,
            showarrow: false,
            xanchor: "left",
            yanchor: "top",
          };
        }),
      ],
    }),
    [
      geneName,
      chromosome,
      cellTypes,
      initialXRange,
      nearbyGenesRange,
      xMin,
      xMax,
      heightPerTrack,
      initialYRange,
    ],
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
            filename: `BDP_png-${geneName}`, // TODO name
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
                    filename: `BDP_svg-${geneName}`, // TODO name
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
  snpData: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        snp_id: PropTypes.string.isRequired,
        p_value: PropTypes.number.isRequired,
        beta_value: PropTypes.number.isRequired,
        position: PropTypes.number.isRequired,
      }),
    ),
  ).isRequired,
  chromosome: PropTypes.string.isRequired,
  cellTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleSelect: PropTypes.func.isRequired,
};

export default GeneViewPlotlyPlot;
