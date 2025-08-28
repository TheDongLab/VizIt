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

function getDisplayOption(displayOptions, option, defaultValue) {
  if (!displayOptions || typeof displayOptions[option] === "undefined") {
    return defaultValue;
  }
  return displayOptions[option];
}

const SNPViewPlotlyPlot = React.memo(function SNPViewPlotlyPlot({
  dataset,
  snpName,
  snps,
  hasGwas,
  geneData,
  chromosome,
  cellTypes,
  handleSelect,
  useWebGL,
  displayOptions,
}) {
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
          y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
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
  const maxBetaMagnitude = betaValues.reduce(
    (max, b) => Math.max(max, Math.abs(b)),
    0,
  );
  const minBetaMagnitude = betaValues.reduce(
    (min, b) => Math.min(min, Math.abs(b)),
    Infinity,
  );

  // const geneMin = Math.min(...xValues);
  // const geneMax = Math.max(...xValues);
  const geneMin = xValues.reduce((min, x) => Math.min(min, x), Infinity);
  const geneMax = xValues.reduce((max, x) => Math.max(max, x), -Infinity);

  const combinedMin = Math.min(geneMin, snpPosition);
  const combinedMax = Math.max(geneMax, snpPosition);
  const combinedRange = combinedMax - combinedMin;

  const xPadding = Math.round((combinedRange * 0.05) / 1000) * 1000; // 5% of range

  const paddedMin = combinedMin - xPadding;
  const paddedMax = combinedMax + xPadding;

  const xMin = Math.max(paddedMin, snpPosition - radius);
  const xMax = Math.min(paddedMax, snpPosition + radius);

  const yPadding = 1;
  const yHeight = getDisplayOption(displayOptions, "yHeight", "");
  const yMax =
    yHeight !== ""
      ? Number(yHeight)
      : yValues.reduce((max, y) => Math.max(max, y, 2), -Infinity) + yPadding;
  const yMin = yValues.reduce((min, y) => Math.min(min, y, 0), Infinity);

  const otherSnps = snps.filter((s) => s.snp_id !== snpName);

  const gwasMin = hasGwas
    ? otherSnps.reduce((min, s) => Math.min(min, s.y), 0)
    : -2;
  const gwasMax = hasGwas
    ? otherSnps.reduce((max, s) => Math.max(max, s.y), 2) + yPadding
    : 2;

  const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);
  const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);
  const initialGwasYRange = useMemo(
    () => [gwasMin, gwasMax],
    [gwasMin, gwasMax],
  );

  const nearbyXValues = useMemo(() => snps.map((s) => s.position), [snps]);

  const nearbySnpsRange = useMemo(() => {
    const nearbyMin = nearbyXValues.reduce(
      (min, x) => Math.min(min, x),
      Infinity,
    );
    const nearbyMax = nearbyXValues.reduce(
      (max, x) => Math.max(max, x),
      -Infinity,
    );
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
    const snp = snps.find((s) => s.snp_id === snpName);
    if (!snp) return [];

    const others = {
      x: otherSnps.map((s) => s.position),
      y: hasGwas
        ? otherSnps.map((s) => s.y)
        : otherSnps.map((s) => jitterMap.get(s.snp_id)),
      type: useWebGL ? "scattergl" : "scatter",
      mode: "markers",
      marker: {
        color: hasGwas
          ? otherSnps.map((s) =>
              s.beta > 0 ? "rgb(230, 120, 120)" : "rgb(120, 120, 230)",
            )
          : "rgb(161, 161, 161)",
        opacity: 1,
        size: 6,
        line: {
          width: 0,
        },
      },
      customdata: otherSnps.map((s) => s.snp_id),
      pointType: hasGwas ? "gwas" : "snp",
      hoverinfo: "text",
      hovertext: otherSnps.flatMap((s) => {
        const text =
          `<b>SNP:</b> ${s.snp_id}<br>` + `<b>Position:</b> ${s.position}<br>`;

        if (hasGwas)
          return (
            text +
            `<b>β (GWAS):</b> ${formatNumber(s.beta, 6)}<br>` +
            `<b>−log10(p) (GWAS):</b> ${formatNumber(s.y, 6)}`
          );
        return text;
      }),
    };

    const targetHasGwas = hasGwas && snp.y != null;

    const target = {
      x: [snp.position],
      y: hasGwas ? [snp.y || (gwasMin + gwasMax) / 2] : [0],
      type: "scattergl",
      mode: "markers",
      marker: {
        color: "black",
        opacity: 1,
        size: 10,
        line: {
          width: 0,
        },
      },
      customdata: [snp.snp_id],
      name: "Target SNP",
      pointType: targetHasGwas ? "gwas" : "snp",
      showlegend: false,
      hoverinfo: "text",
      hovertext:
        `<b>SNP:</b> ${snp.snp_id}<br>` +
        `<b>Position:</b> ${snp.position}<br>` +
        (targetHasGwas
          ? `<b>β (GWAS):</b> ${formatNumber(snp.beta_value, 6)}<br>` +
            `<b>−log10(p) (GWAS):</b> ${formatNumber(-Math.log10(Math.max(snp.p_value, 1e-20)), 6)}`
          : ""),
      text: [snp.snp_id],
      textposition:
        (snp.y - gwasMin) / (gwasMax - gwasMin) > 0.2
          ? "bottom center"
          : "top center",
      textfont: {
        color: "black",
      },
    };

    return [others, target];
  }, [
    snps,
    otherSnps,
    hasGwas,
    useWebGL,
    gwasMin,
    gwasMax,
    snpName,
    jitterMap,
  ]);

  const targetAnnotation = useMemo(() => {
    const snp = snps.find((s) => s.snp_id === snpName);
    if (!snp) return null;
    const yPos = hasGwas ? snp.y || (gwasMin + gwasMax) / 2 : 0;
    const isTop = (yPos - gwasMin) / (gwasMax - gwasMin) < 0.2;
    const distance = (gwasMax - gwasMin) * 0.04;
    const annotationY = isTop ? yPos + distance : yPos - distance;
    // const annotationY = hasGwas ? (isTop ? yPos - 0.2 : yPos + 0.2) : -0.2;

    return {
      x: snp.position,
      y: annotationY,
      xref: "x",
      yref: "y",
      text: snp.snp_id,
      showarrow: false,
      font: { color: "black" },
      xanchor: "center",
      yanchor: isTop ? "bottom" : "top", // Positions text above/below point
    };
  }, [gwasMax, gwasMin, hasGwas, snpName, snps]);

  // Multiple gene traces so each line can have its own color
  const geneTraces = useMemo(
    () =>
      cellTypes.flatMap((celltype, i) => {
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
            y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
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

          const isPeak = gene.strand === "x";

          return {
            name: gene.id,
            x: [x0, x1],
            y: [y0, y1],
            xaxis: "x",
            yaxis: `y${i + 2}`,
            type: useWebGL ? "scattergl" : "scatter",
            mode: "lines+markers",
            line: {
              color: dataToRGB(gene, minBetaMagnitude, maxBetaMagnitude),
              width: 3,
            },
            marker: {
              symbol: [
                isPeak ? "line-ew" : "circle",
                gene.strand === "-"
                  ? "triangle-left"
                  : gene.strand === "+"
                    ? "triangle-right"
                    : "line-ew",
              ],
              size: [isPeak ? 4 : 0, isPeak ? 4 : 12],
              color: [
                dataToRGB(gene, minBetaMagnitude, maxBetaMagnitude),
                dataToRGB(gene, minBetaMagnitude, maxBetaMagnitude),
              ],
              opacity: [isPeak ? 1 : 0, 1],
              line: { width: isPeak ? 3 : 1 },
            },
            customdata: [gene.id],
            hoverinfo: "text",
            hovertext:
              `<b>${isPeak ? "Peak" : "Gene"}:</b> ${gene.id}<br>` +
              `<b>Start:</b> ${gene.position_start}<br>` +
              `<b>End:</b> ${gene.position_end}<br>` +
              `<b>Strand:</b> ${gene.strand === "-" ? "−" : gene.strand === "+" ? "+" : "N/A"}<br>` +
              `<b>β:</b> ${formatNumber(gene.beta, 3)}<br>` +
              `<b>−log10(p):</b> ${formatNumber(gene.y, 3)}`,
            pointType: "gene",
          };
        });
      }),
    [cellTypes, geneData, useWebGL, minBetaMagnitude, maxBetaMagnitude],
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

      const gwasUrl = `https://www.ebi.ac.uk/gwas/search?query=${encodeURIComponent(data.snp_id)}`;

      const formattedData = (
        <>
          <strong>SNP:</strong> {data.snp_id}{" "}
          <a href={gwasUrl} target="_blank" rel="noopener noreferrer">
            (View in GWAS Catalog)
          </a>
          <br />
          <strong>Chromosome:</strong> {chromosome}
          <br />
          <strong>Position:</strong> {data.position}
        </>
      );
      handleSelect(name, formattedData, "snp");
      return;
    } else if (pointType === "gwas") {
      const data = snps.find((s) => s.snp_id === name);
      if (!data) return;

      const gwasUrl = `https://www.ebi.ac.uk/gwas/search?query=${encodeURIComponent(data.snp_id)}`;

      const formattedData = (
        <>
          <strong>SNP:</strong> {data.snp_id}{" "}
          <a href={gwasUrl} target="_blank" rel="noopener noreferrer">
            (View in GWAS Catalog)
          </a>
          <br />
          <strong>Chromosome:</strong> {chromosome}
          <br />
          <strong>Position:</strong> {data.position}
          <br />
          <strong>β (GWAS):</strong> {formatNumber(data.beta, 6)}
          <br />
          <strong>−log10(p) (GWAS):</strong> {formatNumber(data.y, 6)}
        </>
      );
      handleSelect(name, formattedData, "snp");
      return;
    } else if (pointType === "gene") {
      const data = combinedGeneList.filter((g) => g.id === name);
      if (!data || data.length === 0) return;

      const formattedData = (
        <>
          <strong>{data[0].strand === "x" ? "Peak" : "Gene"}:</strong>{" "}
          {data[0].id}
          <br />
          <strong>Chromosome:</strong> {chromosome}
          <br />
          <strong>Start:</strong> {data[0].position_start}
          <br />
          <strong>End:</strong> {data[0].position_end}
          <br />
          <strong>Strand:</strong>{" "}
          {data[0].strand === "-" ? "−" : data[0].strand === "+" ? "+" : "N/A"}
          <br />
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
  const pixelsPerTrack = getDisplayOption(displayOptions, "trackHeight", 150);
  const pixelsPerGap = getDisplayOption(displayOptions, "gapHeight", 20);
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
      const end = start + trackDomainHeight;

      // Prevent floating point precision errors from exceeding 1.0
      return [start, Math.min(end, 1.0)];
    },
    [trackDomainHeight, gapDomainHeight],
  );

  // Plotly layout
  const layout = useMemo(
    () => ({
      title: {
        text: `<b>${snpName}</b>`,
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
        title: { text: `Genomic Position (${chromosome})` },
        range: initialXRange,
        minallowed: Math.min(nearbySnpsRange[0], xMin),
        maxallowed: Math.max(nearbySnpsRange[1], xMax),
        autorange: false,
        tickfont: { size: 10 },
        showgrid: getDisplayOption(displayOptions, "showGrid", true),
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
          showgrid: getDisplayOption(displayOptions, "showGrid", true),
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
        title: hasGwas
          ? {
              text: `−log10(p)`,
              font: { size: 12 },
            }
          : undefined,
        autorange: false,
        domain: calculateDomain(0), // 0th track is for genes
        range: initialGwasYRange,
        fixedrange: true, // Prevent zooming on y-axis
        // minallowed: yMin,
        // maxallowed: yMax,
        showgrid: hasGwas
          ? getDisplayOption(displayOptions, "showGrid", true)
          : false,
        zeroline: false,
        ticks: hasGwas ? "outside" : "",
        ticklen: hasGwas ? 6 : 0,
        tickwidth: hasGwas ? 1 : 0,
        tickcolor: hasGwas ? "black" : undefined,
        showticklabels: hasGwas ? true : false,
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
          y0: hasGwas ? Math.log10(5e-8) : -2,
          y1: hasGwas ? -Math.log10(5e-8) : 2,
          fillcolor: "lightgray",
          opacity: 0.3,
          layer: "below",
          line: { width: 0 },
        },
        ...(getDisplayOption(displayOptions, "showDashedLine", true)
          ? getDisplayOption(displayOptions, "crossGapDashedLine", true)
            ? [
                {
                  type: "line",
                  xref: "x",
                  yref: "paper",
                  x0: snpPosition,
                  x1: snpPosition,
                  y0: 0,
                  y1: 1,
                  line: {
                    color: getDisplayOption(
                      displayOptions,
                      "dashedLineColor",
                      "#000000",
                    ),
                    width: 1,
                    dash: "dash",
                  },
                  layer: getDisplayOption(
                    displayOptions,
                    "dashedLineOnTop",
                    false,
                  )
                    ? "above"
                    : "below",
                },
              ]
            : [
                ...(hasGwas
                  ? [
                      {
                        type: "line",
                        xref: "x",
                        yref: "y",
                        x0: snpPosition,
                        x1: snpPosition,
                        y0: initialGwasYRange[0],
                        y1: initialGwasYRange[1],
                        line: {
                          color: getDisplayOption(
                            displayOptions,
                            "dashedLineColor",
                            "#000000",
                          ),
                          width: 1,
                          dash: "dash",
                        },
                        layer: getDisplayOption(
                          displayOptions,
                          "dashedLineOnTop",
                          false,
                        )
                          ? "above"
                          : "below",
                      },
                    ]
                  : []),
                ...cellTypes.map((celltype, i) => ({
                  type: "line",
                  xref: "x",
                  yref: `y${i + 2}`,
                  x0: snpPosition,
                  x1: snpPosition,
                  y0: initialYRange[0],
                  y1: initialYRange[1],
                  line: {
                    color: getDisplayOption(
                      displayOptions,
                      "dashedLineColor",
                      "#000000",
                    ),
                    width: 1,
                    dash: "dash",
                  },
                  layer: getDisplayOption(
                    displayOptions,
                    "dashedLineOnTop",
                    false,
                  )
                    ? "above"
                    : "below",
                })),
              ]
          : []),
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
        ...(hasGwas
          ? [
              {
                text: "GWAS",
                font: { size: 16 },
                xref: "paper",
                yref: "paper",
                x: 0.001,
                y: calculateDomain(0)[1],
                showarrow: false,
                xanchor: "left",
                yanchor: "top",
              },
            ]
          : []),
        targetAnnotation,
      ],
    }),
    [
      snpName,
      totalHeight,
      cellTypes,
      chromosome,
      initialXRange,
      nearbySnpsRange,
      xMin,
      xMax,
      hasGwas,
      calculateDomain,
      initialGwasYRange,
      displayOptions,
      snpPosition,
      targetAnnotation,
      initialYRange,
    ],
  );

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
            filename: `${dataset}.${snpName}`,
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
                  if (!useWebGL) {
                    Plotly.downloadImage(gd, {
                      format: "svg",
                      filename: `${dataset}.${snpName}`,
                    });
                    return;
                  }

                  // Create offscreen and hidden container with same dimensions
                  const exportDiv = document.createElement("div");
                  exportDiv.style.position = "fixed";
                  exportDiv.hidden = true;
                  exportDiv.style.left = "-1000px";
                  exportDiv.style.width = gd.offsetWidth + "px";
                  exportDiv.style.height = gd.offsetHeight + "px";
                  document.body.appendChild(exportDiv);

                  // Convert scattergl to scatter
                  const exportData = gd.data.map((trace) =>
                    trace.type === "scattergl"
                      ? { ...trace, type: "scatter" }
                      : trace,
                  );

                  // Clone layout and disable responsiveness
                  const exportLayout = {
                    ...gd.layout,
                    width: gd.offsetWidth,
                    height: gd.offsetHeight,
                    autosize: false,
                  };

                  Plotly.newPlot(exportDiv, exportData, exportLayout, {
                    responsive: false,
                  }).then(() => {
                    Plotly.downloadImage(exportDiv, {
                      format: "svg",
                      filename: `${dataset}.${snpName}`,
                    }).then(() => {
                      document.body.removeChild(exportDiv);
                      Plotly.purge(exportDiv);
                    });
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
  dataset: PropTypes.string.isRequired,
  snpName: PropTypes.string.isRequired,
  snps: PropTypes.arrayOf(
    PropTypes.shape({
      snp_id: PropTypes.string.isRequired,
      position: PropTypes.number.isRequired,
    }),
  ).isRequired,
  hasGwas: PropTypes.bool.isRequired,
  geneData: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        gene_id: PropTypes.string.isRequired,
        p_value: PropTypes.number.isRequired,
        beta_value: PropTypes.number.isRequired,
        position_start: PropTypes.number.isRequired,
        position_end: PropTypes.number.isRequired,
        strand: PropTypes.oneOf(["+", "-", "x"]).isRequired,
      }),
    ),
  ).isRequired,
  chromosome: PropTypes.string.isRequired,
  cellTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleSelect: PropTypes.func.isRequired,
  useWebGL: PropTypes.bool,
  displayOptions: PropTypes.shape({
    showDashedLine: PropTypes.bool,
    crossGapDashedLine: PropTypes.bool,
    dashedLineColor: PropTypes.string,
    showGrid: PropTypes.bool,
    trackHeight: PropTypes.number,
    gapHeight: PropTypes.number,
    yHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};

export default SNPViewPlotlyPlot;
