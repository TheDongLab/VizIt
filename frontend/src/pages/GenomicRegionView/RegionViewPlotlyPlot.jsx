import React, { useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";

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

const RegionViewPlotlyPlot = React.memo(function RegionViewPlotlyPlot({
  dataset,
  chromosome,
  range,
  cellTypes,
  signalData,
  nearbyGenes,
  useWebGL,
  displayOptions,
}) {
  const hasGwas = false;
  // const combinedSnpList = Object.entries(snpData).flatMap(([celltype, snps]) =>
  //   snps.map(({ snp_id, p_value, beta_value, position, ...rest }) => ({
  //     ...rest,
  //     id: snp_id,
  //     y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
  //     beta: beta_value,
  //     x: position,
  //     p_value,
  //     celltype,
  //   })),
  // );
  const signalList = Object.entries(signalData).flatMap(([celltype, signals]) =>
    signals.map(({ position, value, ...rest }) => ({
      ...rest,
      x: position,
      y: value,
      celltype,
    })),
  );

  // const gene = genes.find((g) => g.gene_id === geneName);
  // const geneStart = gene ? gene.position_start : 0;
  // const geneEnd = gene ? gene.position_end : 0;

  // Calculate X and Y ranges
  // const radius = 1_000_000;
  // const xValues = signalList.map((snp) => snp.x);
  const yValues = signalList
    .map((snp) => snp.y)
    .filter((y) => Number.isFinite(y));
  //print first 20 in yvalues
  console.log("First 20 yValues:", yValues.slice(0, 20));
  console.log(yValues.length);
  // // const betaValues = signalList.map((snp) => snp.beta);
  // // const maxBetaMagnitude = Math.max(...betaValues.map((b) => Math.abs(b)));
  // // const minBetaMagnitude = Math.min(...betaValues.map((b) => Math.abs(b)));

  // const signalMin = Math.min(...xValues);
  // const signalMax = Math.max(...xValues);

  // // const combinedMin = Math.min(snpMin, geneStart);
  // // const combinedMax = Math.max(snpMax, geneEnd);
  // const signalRange = signalMax - signalMin;

  // const xPadding = Math.round((signalRange * 0.05) / 1000) * 1000; // 5% of range

  // const paddedMin = signalMin - xPadding;
  // const paddedMax = signalMax + xPadding;

  // const xMin = Math.max(paddedMin, geneStart - radius);
  // const xMax = Math.min(paddedMax, geneEnd + radius);

  const yPadding = 1;
  const yMax = yValues.reduce((max, y) => Math.max(max, y), 0) + yPadding;
  const yMin = yValues.reduce((min, y) => Math.min(min, y), 0);

  // const gwasMin = hasGwas ? Math.min(...gwasData.map((s) => s.y), 0) : -2;
  // const gwasMax = hasGwas
  //   ? Math.max(...gwasData.map((s) => s.y), 2) + yPadding
  //   : 2;

  // const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);
  const initialXRange = useMemo(
    () => [range.start, range.end],
    [range.start, range.end],
  );
  const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);
  const initialGwasYRange = [0, 0];
  // const initialGwasYRange = useMemo(
  //   () => [gwasMin, gwasMax],
  //   [gwasMin, gwasMax],
  // );

  // const nearbyXValues = useMemo(
  //   () => genes.flatMap((gene) => [gene.position_start, gene.position_end]),
  //   [genes],
  // );

  // const nearbyGenesRange = useMemo(() => {
  //   const nearbyMin = Math.min(...nearbyXValues);
  //   const nearbyMax = Math.max(...nearbyXValues);
  //   const nearbyPadding =
  //     Math.round(((nearbyMax - nearbyMin) * 0.05) / 1000) * 1000; // 5% padding
  //   return [
  //     Math.max(nearbyMin - nearbyPadding),
  //     Math.min(nearbyMax + nearbyPadding),
  //   ];
  // }, [nearbyXValues]);

  const formatNumber = (num, precision) => {
    const rounded = round(num, precision);
    return rounded < 0 // Just in case there's a hyphen in there somehow
      ? rounded.toString().replace("-", "−")
      : rounded.toString();
  };

  // const snpTraces = useMemo(() => {
  //   return cellTypes.flatMap((celltype, i) => {
  //     const cellSnps = snpData[celltype] || [];
  //     const snpList = cellSnps.map(
  //       ({ snp_id, p_value, beta_value, position, ...rest }) => ({
  //         ...rest,
  //         id: snp_id,
  //         y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
  //         beta: beta_value,
  //         x: position,
  //         p_value,
  //       }),
  //     );

  //     return [
  //       {
  //         name: celltype,
  //         x: snpList.map((snp) => snp.x),
  //         y: snpList.map((snp) => snp.y),
  //         xaxis: "x",
  //         yaxis: `y${i + (hasGwas ? 3 : 2)}`,
  //         type: useWebGL ? "scattergl" : "scatter",
  //         mode: "markers",
  //         marker: {
  //           color: snpList.map((snp) =>
  //             dataToRGB(snp, minBetaMagnitude, maxBetaMagnitude),
  //           ),
  //           opacity: 1,
  //           size: snpList.map((snp) => (Math.abs(snp.y) < 2 ? 6 : 8)),
  //           line: {
  //             width: 0,
  //           },
  //         },
  //         customdata: snpList.map((snp) => snp.id),
  //         hoverinfo: "text",
  //         text: snpList.map(
  //           (snp) =>
  //             `<b>SNP:</b> ${snp.id}<br>` +
  //             `<b>Position:</b> ${snp.x}<br>` +
  //             `<b>β:</b> ${formatNumber(snp.beta, 3)}<br>` +
  //             `<b>−log10(p):</b> ${formatNumber(snp.y, 3)}`,
  //         ),
  //         pointType: "snp",
  //       },
  //     ];
  //   });
  // }, [
  //   cellTypes,
  //   snpData,
  //   hasGwas,
  //   useWebGL,
  //   minBetaMagnitude,
  //   maxBetaMagnitude,
  // ]);

  // const gwasTrace = useMemo(() => {
  //   if (!hasGwas || gwasData.length === 0) return [];

  //   return [
  //     {
  //       x: gwasData.map((s) => s.x),
  //       y: gwasData.map((s) => s.y),
  //       xaxis: "x",
  //       yaxis: "y2", // Second track for GWAS
  //       type: useWebGL ? "scattergl" : "scatter",
  //       mode: "markers",
  //       marker: {
  //         color: gwasData.map((s) =>
  //           s.beta > 0 ? "rgb(230, 120, 120)" : "rgb(120, 120, 230)",
  //         ),
  //         // color: gwasData.map((s) =>
  //         //   dataToRGB(s, minBetaMagnitude, maxBetaMagnitude),
  //         // ),
  //         opacity: 1,
  //         size: 6,
  //         line: {
  //           width: 0,
  //         },
  //       },
  //       customdata: gwasData.map((s) => s.id),
  //       pointType: "gwas",
  //       hoverinfo: "text",
  //       hovertext: gwasData.flatMap(
  //         (s) =>
  //           `<b>SNP:</b> ${s.snp_id}<br>` +
  //           `<b>Position:</b> ${s.position}<br>` +
  //           `<b>β (GWAS):</b> ${formatNumber(s.beta, 6)}<br>` +
  //           `<b>−log10(p) (GWAS):</b> ${formatNumber(s.y, 6)}`,
  //       ),
  //     },
  //   ];
  // }, [hasGwas, gwasData, useWebGL]);

  // Advanced jitter to avoid overlapping gene labels
  const jitterMap = useMemo(() => {
    const map = new Map();
    const maxAmplitude = 1.55;
    const maxXSpacing = (range.end - range.start) * 0.02;
    const minYSpacing = 0.3;
    const maxAttempts = 100;

    const assigned = []; // array of { pos: number, jitter: number }

    const sortedGenes = [...nearbyGenes].sort(
      (a, b) => a.position_start - b.position_start,
    );

    let numFallbacks = 0;

    for (const gene of sortedGenes) {
      let jitterValue;
      let attempts = 0;

      while (attempts < maxAttempts) {
        const candidate = Math.random() * maxAmplitude;
        const sign = Math.random() > 0.5 ? 1 : -1;
        const jitter = sign * candidate;

        const isTooClose = assigned.some(
          ({ pos, jitter: prev }) =>
            Math.abs(prev - jitter) < minYSpacing &&
            Math.abs(pos - gene.position_start) < maxXSpacing,
        );

        if (!isTooClose) {
          jitterValue = jitter;
          break;
        }

        attempts++;
      }

      if (jitterValue === undefined) {
        numFallbacks++;
        jitterValue = (Math.random() - 0.5) * 2 * maxAmplitude;
      }

      assigned.push({ pos: gene.position_start, jitter: jitterValue });
      map.set(gene.gene_id, jitterValue);
    }

    console.log(
      `Assigned ${assigned.length} genes with ${numFallbacks} fallbacks`,
    );
    return map;
  }, [nearbyGenes, range.end, range.start]);

  const geneTraces = useMemo(() => {
    const getStart = (gene) =>
      gene.strand === "-" ? gene.position_end : gene.position_start;
    const getEnd = (gene) =>
      gene.strand === "-" ? gene.position_start : gene.position_end;

    // We need null values to create breaks in the line
    const others = {
      x: nearbyGenes.flatMap((gene) => [getStart(gene), getEnd(gene), null]),
      y: nearbyGenes.flatMap((gene) => {
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
        symbol: nearbyGenes.flatMap((gene) => [
          "circle",
          gene.strand === "-" ? "triangle-left" : "triangle-right",
          null,
        ]),
        size: nearbyGenes.flatMap(() => [0, 8, null]),
        color: nearbyGenes.flatMap(() => [
          "rgb(161,161,161)",
          "rgb(161,161,161)",
          null,
        ]),
        opacity: nearbyGenes.flatMap(() => [0, 1, null]),
      },
      customdata: nearbyGenes.flatMap((gene) => [
        gene.gene_id,
        gene.gene_id,
        null,
      ]),
      hoverinfo: "text",
      hovertext: nearbyGenes.flatMap((gene) => {
        const text =
          `<b>${gene.strand === "x" ? "Peak" : "Gene"}:</b> ${gene.gene_id}<br>` +
          `<b>Start:</b> ${gene.position_start}<br>` +
          `<b>End:</b> ${gene.position_end}<br>` +
          `<b>Strand:</b> ${
            gene.strand === "-" ? "−" : gene.strand === "+" ? "+" : "N/A"
          }`;
        return [text, text, null];
      }),
      name: "Nearby Genes",
      pointType: "gene",
      showlegend: false,
    };

    const otherLabels = {
      x: nearbyGenes.flatMap((gene) => [(getStart(gene) + getEnd(gene)) / 2]),
      y: nearbyGenes.flatMap((gene) => [jitterMap.get(gene.gene_id) - 0.2]),
      type: "scatter",
      mode: "text",
      text: nearbyGenes.map((gene) => gene.gene_id),
      textposition: "bottom center",
      showlegend: false,
      hoverinfo: "skip",
      textfont: {
        size: 10,
        color: "rgb(161,161,161)",
      },
    };

    return [others, otherLabels];
  }, [jitterMap, nearbyGenes]);

  // Handle clicking points
  // const onClick = (data) => {
  //   console.log("onClick data:", data);
  //   if (!data.points || data.points.length === 0) return;

  //   const point = data.points[0];
  //   const pointData = point.data;
  //   const pointType = pointData.pointType;
  //   const name = point.customdata || pointData.name;

  //   if (pointType === "snp" || pointType === "gwas") {
  //     let data = combinedSnpList.filter((s) => s.id === name);
  //     if (hasGwas) {
  //       data = data.concat(
  //         gwasData
  //           .filter((s) => s.id === name)
  //           .map((s) => ({
  //             ...s,
  //             celltype: "GWAS",
  //           })),
  //       );
  //     }

  //     if (!data || data.length === 0) return;

  //     const gwasUrl = `https://www.ebi.ac.uk/gwas/search?query=${encodeURIComponent(data[0].id)}`;

  //     const formattedData = (
  //       <>
  //         <strong>SNP:</strong> {data[0].id}{" "}
  //         <a href={gwasUrl} target="_blank" rel="noopener noreferrer">
  //           (View in GWAS Catalog)
  //         </a>
  //         <br />
  //         <strong>Position:</strong> {data[0].x}
  //         <br />
  //         {/* <strong>β:</strong> {formatNumber(data.beta, 6)} */}
  //         {/* <br />−<strong>log10(p):</strong>{" "} */}
  //         {/* {formatNumber(data.y * Math.sign(data.beta), 6)} */}
  //         {/* Group each cell‑type’s stats on the same row */}
  //         <table
  //           style={{
  //             marginTop: "0.75em",
  //             borderCollapse: "collapse",
  //             width: "100%",
  //           }}
  //         >
  //           <thead>
  //             <tr>
  //               <th style={{ textAlign: "left" }}>Cell Type</th>
  //               <th style={{ textAlign: "right" }}>β</th>
  //               <th style={{ textAlign: "right" }}>−log10(p)</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {data.map((d, idx) => (
  //               <tr key={idx}>
  //                 <td>{d.celltype}</td>
  //                 <td style={{ textAlign: "right" }}>
  //                   {formatNumber(d.beta, 3)}
  //                 </td>
  //                 <td style={{ textAlign: "right" }}>{formatNumber(d.y, 3)}</td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       </>
  //     );

  //     handleSelect(name, formattedData, "snp");
  //     return;
  //   } else if (pointType === "gene") {
  //     const data = genes.find((g) => g.gene_id === name);
  //     if (!data) return;

  //     const formattedData = (
  //       <>
  //         <strong>{data.strand === "x" ? "Peak" : "Gene"}:</strong>{" "}
  //         {data.gene_id}
  //         <br />
  //         <strong>Start:</strong> {data.position_start}
  //         <br />
  //         <strong>End:</strong> {data.position_end}
  //         <br />
  //         <strong>Strand:</strong>{" "}
  //         {data.strand === "-" ? "−" : data.strand === "+" ? "+" : "N/A"}
  //       </>
  //     );

  //     handleSelect(name, formattedData, "gene");
  //     return;
  //   }
  // };

  const signalTraces = useMemo(() => {
    return cellTypes.map((celltype, i) => {
      const cellData = signalData[celltype] || [];

      // For WebGL, we can use a single scattergl trace with mode 'lines' and fill 'tozeroy'
      if (useWebGL) {
        // Sort data by position
        const sortedData = [...cellData].sort(
          (a, b) => a.position - b.position,
        );
        const xValues = sortedData.map((d) => d.position);
        const yValues = sortedData.map((d) => d.value);

        return {
          name: celltype,
          x: xValues,
          y: yValues,
          type: "scattergl",
          mode: "lines",
          fill: "tozeroy",
          line: { shape: "hv", width: 0 },
          fillcolor: `hsl(${(i * 360) / cellTypes.length}, 70%, 60%)`,
          xaxis: "x",
          yaxis: `y${i + (hasGwas ? 3 : 2)}`,
          hoverinfo: "x+y+name",
          hovertemplate:
            `<b>${celltype}</b><br>` +
            `Position: %{x}<br>` +
            `Value: %{y:.3f}<br>` +
            `<extra></extra>`,
        };
      } else {
        // TODO
        // For non-WebGL, create bar-like traces
        // Group data into bins for better performance
        const binSize = Math.max(1, Math.floor(cellData.length / 1000));
        const binnedData = [];

        for (let j = 0; j < cellData.length; j += binSize) {
          const chunk = cellData.slice(j, j + binSize);
          if (chunk.length > 0) {
            const avgPosition =
              chunk.reduce((sum, d) => sum + d.position, 0) / chunk.length;
            const avgValue =
              chunk.reduce((sum, d) => sum + d.value, 0) / chunk.length;
            binnedData.push({ position: avgPosition, value: avgValue });
          }
        }

        return {
          name: celltype,
          x: binnedData.map((d) => d.position),
          y: binnedData.map((d) => d.value),
          type: "scatter",
          mode: "markers",
          marker: {
            size: 3,
            color: `hsl(${(i * 360) / cellTypes.length}, 70%, 60%)`,
          },
          xaxis: "x",
          yaxis: `y${i + 1}`,
          hoverinfo: "x+y+name",
          hovertemplate:
            `<b>${celltype}</b><br>` +
            `Position: %{x}<br>` +
            `Value: %{y:.3f}<br>` +
            `<extra></extra>`,
        };
      }
    });
  }, [cellTypes, signalData, useWebGL]);

  // Calculate layout dimensions
  const pixelsPerTrack = getDisplayOption(displayOptions, "trackHeight", 50);
  const pixelsPerGap = getDisplayOption(displayOptions, "gapHeight", 10);
  const marginTop = 80;
  const marginBottom = 80;
  const marginLeft = 80;
  const marginRight = 80;

  const nTracks = cellTypes.length + (hasGwas ? 1 : 0) + 1; // +1 for the gene track
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
        text: `<b>${chromosome}:${range.start}-${range.end}</b>`,
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
        rows: cellTypes.length + (hasGwas ? 1 : 0) + 1, // +1 for the gene track
        columns: 1,
        roworder: "top to bottom",
      },
      xaxis: {
        title: { text: `Genomic Position (${chromosome})` },
        range: initialXRange,
        minallowed: initialXRange[0],
        maxallowed: initialXRange[1],
        // minallowed: Math.min(nearbyGenesRange[0], xMin),
        // maxallowed: Math.max(nearbyGenesRange[1], xMax),
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
        const baseIndex = hasGwas ? i + 2 : i + 1;
        acc[`yaxis${baseIndex + 1}`] = {
          title: { text: `−log10(p)`, font: { size: 10 } },
          domain: calculateDomain(baseIndex),
          autorange: false,
          range: initialYRange,
          fixedrange: true, // Prevent zooming on y-axis
          showgrid: getDisplayOption(displayOptions, "showGrid", true),
          zeroline: false,
          ticks: "outside",
          ticklen: 6,
          tickwidth: 1,
          tickcolor: "black",
          tickfont: { size: 8 },
          showline: true,
          mirror: true,
          linewidth: 1,
          linecolor: "black",
          anchor: "x",
        };
        return acc;
      }, {}),
      ...(hasGwas
        ? {
            [`yaxis2`]: {
              title: { text: `−log10(p)`, font: { size: 10 } },
              domain: calculateDomain(1), // Last track for GWAS
              autorange: false,
              range: initialGwasYRange,
              fixedrange: true,
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
            },
          }
        : {}),
      yaxis: {
        autorange: false,
        domain: calculateDomain(0), // 0th track is for SNP track
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
        // ...(gene && getDisplayOption(displayOptions, "showDashedLine", true)
        //   ? getDisplayOption(displayOptions, "crossGapDashedLine", true)
        //     ? [
        //         // Cross-gap mode (single line spanning all tracks)
        //         {
        //           type: "line",
        //           xref: "x",
        //           yref: "paper",
        //           x0:
        //             gene.strand === "-"
        //               ? gene.position_end
        //               : gene.strand === "+"
        //                 ? gene.position_start
        //                 : (gene.position_start + gene.position_end) / 2,
        //           x1:
        //             gene.strand === "-"
        //               ? gene.position_end
        //               : gene.strand === "+"
        //                 ? gene.position_start
        //                 : (gene.position_start + gene.position_end) / 2,
        //           y0: 0,
        //           y1: 1,
        //           line: {
        //             color: getDisplayOption(
        //               displayOptions,
        //               "dashedLineColor",
        //               "#000000",
        //             ),
        //             width: 1,
        //             dash: "dash",
        //           },
        //           layer: getDisplayOption(
        //             displayOptions,
        //             "dashedLineOnTop",
        //             false,
        //           )
        //             ? "above"
        //             : "below",
        //         },
        //       ]
        //     : [
        //         // Track-only mode (separate lines per track)
        //         // Gene track
        //         {
        //           type: "line",
        //           xref: "x",
        //           yref: "y",
        //           x0:
        //             gene.strand === "-"
        //               ? gene.position_end
        //               : gene.strand === "+"
        //                 ? gene.position_start
        //                 : (gene.position_start + gene.position_end) / 2,
        //           x1:
        //             gene.strand === "-"
        //               ? gene.position_end
        //               : gene.strand === "+"
        //                 ? gene.position_start
        //                 : (gene.position_start + gene.position_end) / 2,
        //           y0: -2,
        //           y1: 2,
        //           line: {
        //             color: getDisplayOption(
        //               displayOptions,
        //               "dashedLineColor",
        //               "#000000",
        //             ),
        //             width: 1,
        //             dash: "dash",
        //           },
        //           layer: getDisplayOption(
        //             displayOptions,
        //             "dashedLineOnTop",
        //             false,
        //           )
        //             ? "above"
        //             : "below",
        //         },
        //         // GWAS track
        //         ...(hasGwas
        //           ? [
        //               {
        //                 type: "line",
        //                 xref: "x",
        //                 yref: "y2",
        //                 x0:
        //                   gene.strand === "-"
        //                     ? gene.position_end
        //                     : gene.strand === "+"
        //                       ? gene.position_start
        //                       : (gene.position_start + gene.position_end) / 2,
        //                 x1:
        //                   gene.strand === "-"
        //                     ? gene.position_end
        //                     : gene.strand === "+"
        //                       ? gene.position_start
        //                       : (gene.position_start + gene.position_end) / 2,
        //                 y0: initialGwasYRange[0],
        //                 y1: initialGwasYRange[1],
        //                 line: {
        //                   color: getDisplayOption(
        //                     displayOptions,
        //                     "dashedLineColor",
        //                     "#000000",
        //                   ),
        //                   width: 1,
        //                   dash: "dash",
        //                 },
        //                 layer: getDisplayOption(
        //                   displayOptions,
        //                   "dashedLineOnTop",
        //                   false,
        //                 )
        //                   ? "above"
        //                   : "below",
        //               },
        //             ]
        //           : []),
        //       // Celltype tracks
        //       ...cellTypes.map((celltype, i) => ({
        //         type: "line",
        //         xref: "x",
        //         yref: `y${i + (hasGwas ? 3 : 2)}`,
        //         x0:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         x1:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         y0: initialYRange[0],
        //         y1: initialYRange[1],
        //         line: {
        //           color: getDisplayOption(
        //             displayOptions,
        //             "dashedLineColor",
        //             "#000000",
        //           ),
        //           width: 1,
        //           dash: "dash",
        //         },
        //         layer: getDisplayOption(
        //           displayOptions,
        //           "dashedLineOnTop",
        //           false,
        //         )
        //           ? "above"
        //           : "below",
        //       })),
        //     ]
        // : []),
        // ...(gene && getDisplayOption(displayOptions, "showDashedLine", true)
        //   ? [
        //       {
        //         type: "line",
        //         xref: "x",
        //         yref: "paper",
        //         x0:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         x1:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         y0: 0,
        //         y1: 1,
        //         line: {
        //           color: "#dcdcdc",
        //           width: 1,
        //           dash: "dash",
        //         },
        //         layer: "below",
        //       },
        //     ]
        //   : []),
        // ...(gene
        //   ? [
        //       {
        //         type: "line",
        //         xref: "x",
        //         yref: "y",
        //         x0:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         x1:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         y0: -2,
        //         y1: 2,
        //         line: {
        //           color: "rgb(220, 220, 220)",
        //           width: 1,
        //           dash: "dash",
        //         },
        //         layer: "below",
        //       },
        //     ]
        //   : []),
        // ...(hasGwas && gene
        //   ? [
        //       {
        //         type: "line",
        //         xref: "x",
        //         yref: "y2",
        //         x0:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         x1:
        //           gene.strand === "-"
        //             ? gene.position_end
        //             : gene.strand === "+"
        //               ? gene.position_start
        //               : (gene.position_start + gene.position_end) / 2,
        //         y0: initialGwasYRange[0],
        //         y1: initialGwasYRange[1],
        //         line: {
        //           color: "rgb(220, 220, 220)",
        //           width: 1,
        //           dash: "dash",
        //         },
        //         layer: "below",
        //       },
        //     ]
        //   : []),
        // ...cellTypes.map((celltype, i) => ({
        //   type: "line",
        //   xref: "x",
        //   yref: `y${i + (hasGwas ? 3 : 2)}`,
        //   x0: gene
        //     ? gene.strand === "-"
        //       ? gene.position_end
        //       : gene.strand === "+"
        //         ? gene.position_start
        //         : (gene.position_start + gene.position_end) / 2
        //     : 0,
        //   x1: gene
        //     ? gene.strand === "-"
        //       ? gene.position_end
        //       : gene.strand === "+"
        //         ? gene.position_start
        //         : (gene.position_start + gene.position_end) / 2
        //     : 0,
        //   y0: initialYRange[0],
        //   y1: initialYRange[1],
        //   line: {
        //     color: "rgb(220, 220, 220)",
        //     width: 1,
        //     dash: "dash",
        //   },
        //   layer: "below",
        // })),
        // ...cellTypes.flatMap((celltype, i) => [
        //   {
        //     type: "rect",
        //     xref: "paper",
        //     yref: `y${i + (hasGwas ? 3 : 2)}`,
        //     x0: 0,
        //     x1: 1,
        //     y0: -2,
        //     y1: 2,
        //     fillcolor: "lightgray",
        //     opacity: 0.3,
        //     // layer: "below",
        //     line: { width: 0 },
        //   },
        // ]),
        // ...(hasGwas
        //   ? [
        //       {
        //         type: "rect",
        //         xref: "paper",
        //         yref: "y2",
        //         x0: 0,
        //         x1: 1,
        //         y0: Math.log10(5e-8),
        //         y1: -Math.log10(5e-8),
        //         fillcolor: "lightgray",
        //         opacity: 0.3,
        //         // layer: "below",
        //         line: { width: 0 },
        //       },
        //     ]
        //   : []),
      ],
      annotations: [
        ...cellTypes.map((celltype, i) => {
          const domain = calculateDomain(i + (hasGwas ? 2 : 1));

          return {
            text: celltype,
            font: {
              size: 13,
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
                font: {
                  size: 13,
                },
                xref: "paper",
                yref: "paper",
                x: 0.001,
                y: calculateDomain(1)[1],
                showarrow: false,
                xanchor: "left",
                yanchor: "top",
              },
            ]
          : []),
      ],
    }),
    [
      chromosome,
      range.start,
      range.end,
      totalHeight,
      cellTypes,
      hasGwas,
      initialXRange,
      displayOptions,
      calculateDomain,
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
        /* onClick={onClick} */
        data={[...geneTraces, ...signalTraces]}
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
            filename: `${dataset}.${chromosome}.${range.start}-${range.end}`,
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
                      filename: `${dataset}.${chromosome}.${range.start}-${range.end}`,
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
                      filename: `${dataset}.${chromosome}.${range.start}-${range.end}`,
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

RegionViewPlotlyPlot.propTypes = {
  dataset: PropTypes.string.isRequired,
  geneName: PropTypes.string.isRequired,
  genes: PropTypes.arrayOf(
    PropTypes.shape({
      gene_id: PropTypes.string.isRequired,
      position_start: PropTypes.number.isRequired,
      position_end: PropTypes.number.isRequired,
      strand: PropTypes.oneOf(["+", "-", "x"]).isRequired,
    }),
  ).isRequired,
  gwasData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      snp_id: PropTypes.string.isRequired,
      position: PropTypes.number.isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      beta: PropTypes.number.isRequired,
    }),
  ).isRequired,
  hasGwas: PropTypes.bool.isRequired,
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
  useWebGL: PropTypes.bool,
  displayOptions: PropTypes.shape({
    showDashedLine: PropTypes.bool,
    crossGapDashedLine: PropTypes.bool,
    dashedLineColor: PropTypes.string,
    showGrid: PropTypes.bool,
    trackHeight: PropTypes.number,
    gapHeight: PropTypes.number,
  }),
};

// RegionViewPlotlyPlot.propTypes = {
//   dataset: PropTypes.string.isRequired,
//   geneName: PropTypes.string.isRequired,
//   genes: PropTypes.arrayOf(
//     PropTypes.shape({
//       gene_id: PropTypes.string.isRequired,
//       position_start: PropTypes.number.isRequired,
//       position_end: PropTypes.number.isRequired,
//       strand: PropTypes.oneOf(["+", "-", "x"]).isRequired,
//     }),
//   ).isRequired,
//   gwasData: PropTypes.arrayOf(
//     PropTypes.shape({
//       id: PropTypes.string.isRequired,
//       snp_id: PropTypes.string.isRequired,
//       position: PropTypes.number.isRequired,
//       x: PropTypes.number.isRequired,
//       y: PropTypes.number.isRequired,
//       beta: PropTypes.number.isRequired,
//     }),
//   ).isRequired,
//   hasGwas: PropTypes.bool.isRequired,
//   snpData: PropTypes.objectOf(
//     PropTypes.arrayOf(
//       PropTypes.shape({
//         snp_id: PropTypes.string.isRequired,
//         p_value: PropTypes.number.isRequired,
//         beta_value: PropTypes.number.isRequired,
//         position: PropTypes.number.isRequired,
//       }),
//     ),
//   ).isRequired,
//   chromosome: PropTypes.string.isRequired,
//   cellTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
//   handleSelect: PropTypes.func.isRequired,
//   useWebGL: PropTypes.bool,
//   displayOptions: PropTypes.shape({
//     showDashedLine: PropTypes.bool,
//     crossGapDashedLine: PropTypes.bool,
//     dashedLineColor: PropTypes.string,
//     showGrid: PropTypes.bool,
//     trackHeight: PropTypes.number,
//     gapHeight: PropTypes.number,
//   }),
// };

export default RegionViewPlotlyPlot;
