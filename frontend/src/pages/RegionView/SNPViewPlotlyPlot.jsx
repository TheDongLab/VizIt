import React, { useMemo, useCallback } from "react";
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

  const combinedGeneList = Object.entries(geneData).flatMap(
    ([celltype, genes]) =>
      genes.map(
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
          y: -Math.log10(p_value),
          beta: beta_value,
          x: strand === "-" ? position_end : position_start,
          position_start,
          position_end,
          p_value,
          strand,
          celltype,
        }),
      ),
  );

  const snp = snps.find((s) => s.snp_id === snpName);
  const snpPosition = snp ? snp.position : 0;

  // Calculate X and Y ranges
  const radius = 1_100_000;
  // const xValues = geneList.flatMap((gene) => [
  //   gene.position_start,
  //   gene.position_end,
  // ]);
  const xValues = combinedGeneList.flatMap((gene) => [
    gene.position_start,
    gene.position_end,
  ]);
  const yValues = combinedGeneList.map((gene) => gene.y);
  const betaValues = combinedGeneList.map((gene) => gene.beta);
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
  const yMin = Math.min(...yValues, 0);
  const yMax = Math.max(...yValues, 2) + yPadding;

  const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);
  const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);

  const nearbyXValues = useMemo(() => snps.map((s) => s.position), [snps]);

  const nearbySnpsRange = useMemo(() => {
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

  // Primitive jitter due to large number of SNPs
  const jitterMap = useMemo(() => {
    const map = new Map();
    const maxAmplitude = 1.75;

    snps.forEach((s) => {
      const sign = Math.random() > 0.5 ? 1 : -1;
      const amplitude = Math.random() * maxAmplitude;
      map.set(s.snp_id, sign * amplitude);
    });
    return map;
  }, [snps]);

  const snpTraces = useMemo(() => {
    const otherSnps = snps.filter((s) => s.snp_id !== snpName);
    const snp = snps.find((s) => s.snp_id === snpName);
    if (!snp) return [];

    const others = {
      x: otherSnps.map((s) => s.position),
      y: otherSnps.map((s) => jitterMap.get(s.snp_id)),
      type: "scattergl",
      mode: "markers",
      marker: {
        color: "rgb(161, 161, 161)",
        opacity: 1,
        size: 6,
        line: {
          width: 0,
        },
      },
      customdata: otherSnps.map((s) => s.snp_id),
      hoverinfo: "text",
      hovertext: otherSnps.map(
        (s) =>
          `<b>SNP ID:</b> ${s.snp_id}<br><b>Position:</b> ${s.position}<br>`,
      ),
    };

    const target = {
      x: [snp.position],
      y: [0],
      type: "scatter",
      mode: "markers+text",
      marker: {
        color: "black",
        opacity: 1,
        size: 10,
        line: {
          width: 0,
        },
      },
      text: [snp.snp_id],
      customdata: [snp.snp_id],
      textposition: "bottom center",
      name: "Target SNP",
      pointType: "snp",
      showlegend: false,
      hoverinfo: "text",
      hovertext: `<b>SNP ID:</b> ${snp.snp_id}<br><b>Position:</b> ${snp.position}<br>`,
    };

    return [others, target];
  }, [snps, snpName, jitterMap]);

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
  const geneTraces = useMemo(
    () =>
      cellTypes.flatMap((celltype, i) => {
        // const x0 = gene.strand === "-" ? gene.position_end : gene.position_start;
        // const x1 = gene.strand === "-" ? gene.position_start : gene.position_end;
        // const y0 = gene.y;
        // const y1 = y0;
        const cellGenes = geneData[celltype] || [];
        const geneList = cellGenes.map(
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
            y: -Math.log10(p_value),
            beta: beta_value,
            x: strand === "-" ? position_end : position_start,
            position_start,
            position_end,
            strand,
            p_value,
          }),
        );

        return geneList.map((gene) => {
          const x0 =
            gene.strand === "-" ? gene.position_end : gene.position_start;
          const x1 =
            gene.strand === "-" ? gene.position_start : gene.position_end;
          const y0 = gene.y;
          const y1 = y0;
          const arrowSymbol =
            gene.strand === "-" ? "triangle-left" : "triangle-right";

          return {
            name: gene.id,
            x: [x0, x1],
            y: [y0, y1],
            xaxis: "x",
            yaxis: `y${i + 2}`,
            type: "scattergl",
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
              `−<b>log10(p):</b> ${formatNumber(gene.y, 3)}`,
            pointType: "gene",
          };
        });
      }),
    [cellTypes, geneData, minBetaMagnitude, maxBetaMagnitude],
  );

  // Handle clicking points
  const onClick = (data) => {
    console.log("onClick data:", data);
    if (!data.points || data.points.length === 0) return;

    const point = data.points[0];
    const pointData = point.data;
    const pointType = pointData.pointType;
    const name = point.customdata || pointData.name;

    if (pointType === "snp") {
      const data = snps.find((s) => s.snp_id === name);
      if (!data) return;

      const formattedData = (
        <>
          <strong>SNP:</strong> {data.snp_id}
          <br />
          <strong>Position:</strong> {data.position}
        </>
      );
      handleSelect(name, formattedData, "snp");
      return;
    } else if (pointType === "gene") {
      const data = combinedGeneList.filter((g) => g.id === name);
      if (!data || data.length === 0) return;

      const formattedData = (
        <>
          <strong>Gene:</strong> {data[0].id}
          <br />
          <strong>Start:</strong> {data[0].position_start}
          <br />
          <strong>End:</strong> {data[0].position_end}
          <br />
          {/* <strong>Strand:</strong> {data.strand === "-" ? "−" : "+"} */}
          {/* <br /> */}
          {/* <strong>β:</strong> {formatNumber(data.beta, 6)} */}
          {/* <br />−<strong>log10(p):</strong> {formatNumber(data.y, 6)} */}
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

      handleSelect(name, formattedData, "gene");
      return;
    }
  };

  // Calculate layout dimensions
  const pixelsPerTrack = 150;
  const pixelsPerGap = 20;
  const marginTop = 80;
  const marginBottom = 80;
  const marginLeft = 80;
  const marginRight = 80;

  const nTracks = cellTypes.length + 1; // +1 for the gene track
  const totalHeight =
    marginTop +
    marginBottom +
    nTracks * pixelsPerTrack +
    (nTracks - 1) * pixelsPerGap;

  // Normalized domain
  const trackDomainHeight =
    pixelsPerTrack / (totalHeight - marginTop - marginBottom);
  const gapDomainHeight =
    pixelsPerGap / (totalHeight - marginTop - marginBottom);

  const calculateDomain = useCallback(
    (trackIndex) => {
      const start = trackIndex * (trackDomainHeight + gapDomainHeight);
      return [start, start + trackDomainHeight];
    },
    [trackDomainHeight, gapDomainHeight],
  );

  // Plotly layout
  const layout = useMemo(
    () => ({
      title: {
        text: `<b>${snpName}</b><br>${chromosome}`,
        font: { size: 20 },
      },
      paper_bgcolor: "rgba(0,0,0,0)", // Transparent paper background
      showlegend: false,
      margin: {
        t: marginTop,
        b: marginBottom,
        l: marginLeft,
        r: marginRight,
      },
      height: totalHeight,
      autosize: true,
      dragmode: "pan",
      grid: {
        rows: cellTypes.length + 1,
        columns: 1,
        roworder: "top to bottom",
      },
      xaxis: {
        title: { text: `Genomic Position` },
        range: initialXRange,
        minallowed: Math.min(nearbySnpsRange[0], xMin),
        maxallowed: Math.max(nearbySnpsRange[1], xMax),
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
        linewidth: 1,
        linecolor: "black",
        side: "bottom",
        anchor: "y",
      },
      ...cellTypes.reduce((acc, celltype, i) => {
        acc[`yaxis${i + 2}`] = {
          title: { text: `−log10(p)`, font: { size: 12 } },
          domain: calculateDomain(i + 1), // i+1 because first track is gene
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
        domain: calculateDomain(0), // 0th track is for genes
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
        ]),
      ],
      annotations: [
        ...cellTypes.map((celltype, i) => {
          const domain = calculateDomain(i + 1);

          return {
            text: celltype,
            font: {
              size: 16,
            },
            xref: "paper",
            yref: "paper",
            x: 0.001,
            y: domain[1],
            showarrow: false,
            xanchor: "left",
            yanchor: "top",
          };
        }),
      ],
    }),
    [
      snpName,
      chromosome,
      cellTypes,
      initialXRange,
      nearbySnpsRange,
      xMin,
      xMax,
      calculateDomain,
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
            filename: `BDP_png-${snpName}`, // TODO name
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
                    filename: `BDP_svg-${snpName}`, // TODO name
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
  geneData: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        gene_id: PropTypes.string.isRequired,
        p_value: PropTypes.number.isRequired,
        beta_value: PropTypes.number.isRequired,
        position_start: PropTypes.number.isRequired,
        position_end: PropTypes.number.isRequired,
        strand: PropTypes.string.isRequired,
      }),
    ),
  ).isRequired,
  chromosome: PropTypes.string.isRequired,
  cellTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleSelect: PropTypes.func.isRequired,
};

export default SNPViewPlotlyPlot;
