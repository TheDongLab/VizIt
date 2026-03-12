import React, { useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";

function getTranscriptColor(biotype) {
    switch (biotype) {
        case "protein_coding":
        case "protein_coding_gene":
            return {
                exonFill: "rgb(200,230,255)",
                exonBorder: "rgb(40,90,160)",
                intron: "rgb(80,120,200)",
            };
        case "lncRNA":
        case "lincRNA":
            return {
                exonFill: "rgb(230,200,255)",
                exonBorder: "rgb(120,60,180)",
                intron: "rgb(150,100,200)",
            };
        case "miRNA":
            return {
                exonFill: "rgb(255,220,200)",
                exonBorder: "rgb(200,90,60)",
                intron: "rgb(200,120,80)",
            };
        default:
            return {
                exonFill: "rgb(220,220,220)",
                exonBorder: "rgb(80,80,80)",
                intron: "rgb(140,140,140)",
            };
    }
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

function getTrackRange(
    trackName,
    allSignalList,
    visibleRange,
    displayOptions,
    trackTypes,
    globalHalfRangeSym,
    globalMaxPosRange,
) {
    const yPadding = 1;
    const perTrackY = displayOptions?.perTrackY ?? false;
    const trackYHeights = displayOptions?.trackYHeights ?? {};
    const yHeightGlobal = displayOptions?.yHeightGlobal ?? "";
    const trackType = trackTypes.get(trackName) || "single";

    const rangeFromHeight = (H) => (trackType === "pm" ? [-H, H] : [0, H]);

    // Per-track manual override
    if (
        perTrackY &&
        trackYHeights[trackName] !== "" &&
        trackYHeights[trackName] != null
    ) {
        const H = Number(trackYHeights[trackName]);
        return rangeFromHeight(H);
    }

    if (perTrackY) {
        // Global override
        if (yHeightGlobal !== "" && yHeightGlobal != null) {
            const H = Number(yHeightGlobal);
            return rangeFromHeight(H);
        }

        const yVals = allSignalList
            .filter((s) => s.celltype === trackName)
            .filter((s) => s.x >= visibleRange.start && s.x <= visibleRange.end)
            .map((s) => s.y)
            .filter((y) => Number.isFinite(y));

        if (yVals.length > 0) {
            if (trackType === "pm") {
                const dataMaxAbs = yVals.reduce(
                    (max, y) => Math.max(max, Math.abs(y)),
                    0,
                );
                const H = dataMaxAbs + yPadding;
                return [-H, H];
            } else {
                const maxPos = yVals.reduce((max, y) => Math.max(max, y), 0);
                const H = maxPos + yPadding;
                return [0, H];
            }
        }

        // Fallback to global
        return trackType === "pm"
            ? [-globalHalfRangeSym, globalHalfRangeSym]
            : [0, globalMaxPosRange];
    }

    // Fallback to global
    return trackType === "pm"
        ? [-globalHalfRangeSym, globalHalfRangeSym]
        : [0, globalMaxPosRange];
}

const RegionViewPlotlyPlot = React.memo(function RegionViewPlotlyPlot({
    dataset,
    chromosome,
    selectedRange,
    visibleRange,
    cellTypes,
    signalData,
    nearbyGenes,
    gwasData,
    hasGwas,
    handleSelect,
    useWebGL,
    displayOptions,
    handlePlotUpdate,
    binSize,
    exonStructure,
    exonStructureTruncated,
}) {
    const range = visibleRange || selectedRange;
    const signalList = Object.entries(signalData).flatMap(
        ([celltype, signals]) => {
            if (
                signals &&
                !Array.isArray(signals) &&
                signals.plus &&
                signals.minus
            ) {
                const plusPoints = (signals.plus || []).map(
                    ({ position, value, ...rest }) => ({
                        ...rest,
                        x: position,
                        y: value,
                        celltype,
                        strand: "plus",
                    }),
                );

                const minusPoints = (signals.minus || []).map(
                    ({ position, value, ...rest }) => ({
                        ...rest,
                        x: position,
                        y: value,
                        celltype,
                        strand: "minus",
                    }),
                );

                return [...plusPoints, ...minusPoints];
            }

            if (Array.isArray(signals)) {
                return signals.map(({ position, value, ...rest }) => ({
                    ...rest,
                    x: position,
                    y: value,
                    celltype,
                }));
            }

            return [];
        },
    );
    const trackTypes = useMemo(() => {
        const types = new Map();
        cellTypes.forEach((celltype) => {
            const entry = signalData[celltype];
            if (entry && !Array.isArray(entry) && (entry.plus || entry.minus)) {
                types.set(celltype, "pm"); // plus/minus
            } else {
                types.set(celltype, "single");
            }
        });
        return types;
    }, [cellTypes, signalData]);

    const yValuesAll = signalList
        .filter(
            (snp) => snp.x >= visibleRange.start && snp.x <= visibleRange.end,
        )
        .map((snp) => snp.y)
        .filter((y) => Number.isFinite(y));

    const yPadding = 1;
    const yHeightGlobalOpt = displayOptions?.yHeightGlobal ?? "";

    // Global symmetric range for plus/minus tracks ([-H, H])
    const globalDataMaxAbs =
        yValuesAll.length > 0
            ? yValuesAll.reduce((max, y) => Math.max(max, Math.abs(y)), 0)
            : 0;

    const globalHalfRangeSym =
        yHeightGlobalOpt !== "" && yHeightGlobalOpt != null
            ? Number(yHeightGlobalOpt)
            : globalDataMaxAbs + yPadding;

    // Global positive-only range for single-track tracks ([0, H])
    const yValuesPos = yValuesAll.filter((y) => y >= 0);
    const globalMaxPos =
        yValuesPos.length > 0
            ? yValuesPos.reduce((max, y) => Math.max(max, y), 0)
            : 0;

    const globalMaxPosRange =
        yHeightGlobalOpt !== "" && yHeightGlobalOpt != null
            ? Number(yHeightGlobalOpt)
            : globalMaxPos + yPadding;

    // GWAS ranges
    const gwasMin = gwasData.reduce((min, s) => Math.min(min, s.y), 0);
    const gwasMax =
        gwasData.reduce((max, s) => Math.max(max, s.y), 2) + yPadding;

    // X range for all tracks
    const initialXRange = useMemo(
        () => [range.start, range.end],
        [range.start, range.end],
    );

    // Y range for GWAS track
    const initialGwasYRange = useMemo(
        () => [gwasMin, gwasMax],
        [gwasMin, gwasMax],
    );

    const formatNumber = (num, precision) => {
        const rounded = round(num, precision);
        return rounded < 0 // Just in case there's a hyphen in there somehow
            ? rounded.toString().replace("-", "−")
            : rounded.toString();
    };

    const gwasTrace = useMemo(() => {
        return [
            {
                x: gwasData.map((s) => s.x),
                y: gwasData.map((s) => s.y),
                xaxis: "x",
                yaxis: "y2", // Second track for GWAS
                type: useWebGL ? "scattergl" : "scatter",
                mode: "markers",
                marker: {
                    color: gwasData.map((s) =>
                        s.beta > 0 ? "rgb(230, 80, 80)" : "rgb(80, 80, 230)",
                    ),
                    // color: gwasData.map((s) =>
                    //   dataToRGB(s, minBetaMagnitude, maxBetaMagnitude),
                    // ),
                    opacity: 1,
                    size: 6,
                    line: {
                        width: 0,
                    },
                },
                customdata: gwasData.map((s) => s.id),
                pointType: "gwas",
                hoverinfo: "text",
                hovertext: gwasData.flatMap(
                    (s) =>
                        `<b>SNP:</b> ${s.snp_id}<br>` +
                        `<b>Position:</b> ${s.position}<br>` +
                        `<b>β (GWAS):</b> ${formatNumber(s.beta, 6)}<br>` +
                        `<b>−log10(p) (GWAS):</b> ${formatNumber(s.y, 6)}`,
                ),
            },
        ];
    }, [gwasData, useWebGL]);

    const GENE_TRACK_GAP_PIXELS = 20;
    const GENE_LABEL_OFFSET_PIXELS = 7;

    const jitterMap = useMemo(() => {
        const map = new Map();

        const maxAmplitude = 1.5;
        const regionWidth = range.end - range.start || 1; // avoid 0
        const maxXSpacing = regionWidth * 0.02; // 2% of current region
        const minYSpacing = 0.3;
        const maxAttempts = 100;

        // array of { pos: number, jitter: number }
        const assigned = [];

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
            `Assigned ${assigned.length} nearbyGenes with ${numFallbacks} fallbacks`,
        );

        return map;
    }, [nearbyGenes, range.start, range.end]);

    const isExonMode =
        !exonStructureTruncated && exonStructure && exonStructure.length > 0;

    let geneTrackYMin, geneTrackYMax;
    let exonTrackPixels;
    const exonTrackPixelsBase = 60;
    const pixelsPerTranscript = 16;

    if (isExonMode) {
        const nTxLanes = exonStructure.length;
        exonTrackPixels = exonTrackPixelsBase + nTxLanes * pixelsPerTranscript;
        const laneMin = 0;
        const laneMax = nTxLanes - 1;
        const span = laneMax - laneMin; // nTxLanes - 1
        const denominator = exonTrackPixels - 2 * GENE_TRACK_GAP_PIXELS;
        if (denominator <= 0) {
            // Fallback (should not happen with reasonable values)
            geneTrackYMin = -1;
            geneTrackYMax = nTxLanes;
        } else {
            const pad = (GENE_TRACK_GAP_PIXELS * span) / denominator;
            geneTrackYMin = laneMin - pad;
            geneTrackYMax = laneMax + pad;
        }
    } else {
        const nGenes = nearbyGenes.length;
        const baseLanes = 3;
        const lanesPerNGenes = 15;
        const effectiveLanes = baseLanes + Math.ceil(nGenes / lanesPerNGenes);
        exonTrackPixels =
            exonTrackPixelsBase + effectiveLanes * pixelsPerTranscript;
        const jitterMin = -1.5;
        const jitterMax = 1.5;
        const span = jitterMax - jitterMin;
        const denominator = exonTrackPixels - 2 * GENE_TRACK_GAP_PIXELS;
        if (denominator <= 0) {
            geneTrackYMin = -2;
            geneTrackYMax = 2;
        } else {
            const pad = (GENE_TRACK_GAP_PIXELS * span) / denominator;
            geneTrackYMin = jitterMin - pad;
            geneTrackYMax = jitterMax + pad;
        }
    }

    const geneTraces = useMemo(() => {
        const getStart = (gene) =>
            gene.strand === "-" ? gene.position_end : gene.position_start;
        const getEnd = (gene) =>
            gene.strand === "-" ? gene.position_start : gene.position_end;

        const dataRangeHeight = geneTrackYMax - geneTrackYMin;
        const labelDataOffset =
            (GENE_LABEL_OFFSET_PIXELS * dataRangeHeight) / exonTrackPixels;

        // We need null values to create breaks in the line
        const others = {
            x: nearbyGenes.flatMap((gene) => [
                getStart(gene),
                getEnd(gene),
                null,
            ]),
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
                        gene.strand === "-"
                            ? "−"
                            : gene.strand === "+"
                              ? "+"
                              : "N/A"
                    }`;
                return [text, text, null];
            }),
            name: "Nearby Genes",
            pointType: "gene",
            showlegend: false,
        };

        // Gene labels trace
        const geneLabels = {
            x: nearbyGenes.map((gene) => (getEnd(gene) + getStart(gene)) / 2), // 在基因终点显示名称
            y: nearbyGenes.map((gene) => {
                const jitter = jitterMap.get(gene.gene_id);
                return jitter - labelDataOffset;
            }),
            xaxis: "x",
            yaxis: "y",
            type: "scatter",
            mode: "text", // 只显示文本
            text: nearbyGenes.map((gene) => gene.gene_id),
            textposition: "bottom center",
            textfont: {
                family: "Arial",
                size: 11,
                color: "rgb(60,60,60)",
            },
            marker: { opacity: 0 }, // 隐藏标记点
            hoverinfo: "none", // 禁用悬停（避免与主trace冲突）
            name: "Gene Names",
            showlegend: false,
        };

        return [others, geneLabels];
    }, [jitterMap, nearbyGenes]);

    const exonTraces = useMemo(() => {
        if (!exonStructure || exonStructure.length === 0) return [];

        const plots = [];

        const transcripts = exonStructure;
        const txToLane = new Map(
            transcripts.map((tx, idx) => [tx.transcript_id, idx]),
        );

        const exonHalfHeight = 0.2;

        for (const tx of transcripts) {
            const laneY = txToLane.get(tx.transcript_id);
            const exons = (tx.exons || [])
                .slice()
                .sort((a, b) => a.exon_start - b.exon_start);
            if (exons.length === 0) continue;

            const exonCount =
                exons[0].exon_count != null ? exons[0].exon_count : null;

            const colors = getTranscriptColor(tx.biotype);
            const exonFill = colors.exonFill;
            const exonBorder = colors.exonBorder;
            const intronColor = colors.intron;

            // Exons
            for (const e of exons) {
                const x0 = e.exon_start;
                const x1 = e.exon_end;
                const y0 = laneY - exonHalfHeight;
                const y1 = laneY + exonHalfHeight;

                plots.push({
                    x: [x0, x1, x1, x0, x0],
                    y: [y0, y0, y1, y1, y0],
                    type: "scatter",
                    mode: "lines",
                    fill: "toself",
                    line: { color: exonBorder, width: 1 },
                    fillcolor: exonFill,
                    xaxis: "x",
                    yaxis: "y",
                    hoverinfo: "text",
                    hovertext:
                        `<b>${tx.gene_symbol}</b> (${tx.transcript_id})<br>` +
                        `Exon: ${e.exon_start}-${e.exon_end}<br>` +
                        `Strand: ${tx.strand}<br>` +
                        (e.exon_index != null && exonCount != null
                            ? `Exon #${e.exon_index + 1} / ${exonCount}<br>`
                            : "") +
                        (tx.biotype ? `Biotype: ${tx.biotype}<br>` : ""),
                    pointType: "gene",
                    showlegend: false,
                });
            }

            // Introns
            for (let i = 0; i < exons.length - 1; i++) {
                const a = exons[i];
                const b = exons[i + 1];
                const x0 = a.exon_end;
                const x1 = b.exon_start;
                const y = laneY;

                plots.push({
                    x: [x0, x1],
                    y: [y, y],
                    type: "scatter",
                    mode: "lines",
                    line: { color: intronColor, width: 1 },
                    xaxis: "x",
                    yaxis: "y",
                    hoverinfo: "skip",
                    pointType: "gene",
                    showlegend: false,
                });
            }

            // Partial introns if first/last exon is not at transcript boundary
            const firstExon = exons[0];
            const lastExon = exons[exons.length - 1];

            if (
                exonCount != null &&
                firstExon.exon_index != null &&
                firstExon.exon_index > 0
            ) {
                const x0 = Math.max(range.start, tx.tx_start ?? range.start);
                const x1 = firstExon.exon_start;
                const y = laneY;

                if (x1 > x0) {
                    plots.push({
                        x: [x0, x1],
                        y: [y, y],
                        type: "scatter",
                        mode: "lines",
                        line: {
                            color: intronColor,
                            width: 1,
                        },
                        xaxis: "x",
                        yaxis: "y",
                        hoverinfo: "skip",
                        pointType: "gene",
                        showlegend: false,
                    });
                }
            }

            if (
                exonCount != null &&
                lastExon.exon_index != null &&
                lastExon.exon_index < exonCount - 1
            ) {
                const x0 = lastExon.exon_end;
                const x1 = Math.min(range.end, tx.tx_end ?? range.end);
                const y = laneY;

                if (x1 > x0) {
                    plots.push({
                        x: [x0, x1],
                        y: [y, y],
                        type: "scatter",
                        mode: "lines",
                        line: {
                            color: intronColor,
                            width: 1,
                        },
                        xaxis: "x",
                        yaxis: "y",
                        hoverinfo: "skip",
                        pointType: "gene",
                        showlegend: false,
                    });
                }
            }

            // Gene label only if TSS is inside view
            const txLeft = tx.tx_start ?? firstExon.exon_start;
            const tssInside = txLeft >= range.start && txLeft <= range.end;

            if (tssInside) {
                const labelX =
                    firstExon.exon_start - (range.end - range.start) * 0.005;
                const labelY = laneY - exonHalfHeight / 6;

                plots.push({
                    x: [labelX],
                    y: [labelY],
                    type: "scatter",
                    mode: "text",
                    text: [tx.gene_symbol],
                    textposition: "middle left",
                    xaxis: "x",
                    yaxis: "y",
                    hoverinfo: "skip",
                    textfont: { size: 10, color: exonBorder },
                    showlegend: false,
                });
            }
        }

        return plots;
    }, [exonStructure, range.start, range.end]);

    const geneTrackTraces = exonStructureTruncated ? geneTraces : exonTraces;

    // Handle clicking points
    const onClick = (data) => {
        console.log("onClick data:", data);
        if (!data.points || data.points.length === 0) return;

        const point = data.points[0];
        const pointData = point.data;
        const pointType = pointData.pointType;
        const name = point.customdata || pointData.name;

        if (pointType === "signal") {
            // let data = combinedSnpList.filter((s) => s.id === name);
            let data = signalList.filter((s) => s.x === point.x);
            // if (hasGwas) {
            //   data = data.concat(
            //     gwasData
            //       .filter((s) => s.id === name)
            //       .map((s) => ({
            //         ...s,
            //         celltype: "GWAS",
            //       })),
            //   );
            // }

            if (!data || data.length === 0) return;

            const binStart = data[0].x;
            const binEnd = binStart + binSize - 1;

            // const gwasUrl = `https:www.ebi.ac.uk/gwas/search?query=${encodeURIComponent(data[0].id)}`;

            const formattedData = (
                <>
                    <strong>Bin Range:</strong> {binStart}–{binEnd}
                    <br />
                    <strong>Bin Size:</strong> {binSize} bp
                    <br />
                    <strong>Chromosome:</strong> {chromosome}
                    <br />
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
                                <th style={{ textAlign: "right" }}>
                                    Signal Strength
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d, idx) => (
                                <tr key={idx}>
                                    <td>{d.celltype}</td>
                                    <td style={{ textAlign: "right" }}>
                                        {formatNumber(d.y, 3)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );

            handleSelect(name, formattedData, "signal");
            return;
        } else if (pointType === "gene") {
            const data = nearbyGenes.find((g) => g.gene_id === name);
            if (!data) return;

            // TODO
            const formattedData = (
                <>
                    <strong>{data.strand === "x" ? "Peak" : "Gene"}:</strong>{" "}
                    {data.gene_id}
                    <br />
                    <strong>Start:</strong> {data.position_start}
                    <br />
                    <strong>End:</strong> {data.position_end}
                    <br />
                    <strong>Strand:</strong>{" "}
                    {data.strand === "-"
                        ? "−"
                        : data.strand === "+"
                          ? "+"
                          : "N/A"}
                </>
            );

            handleSelect(name, formattedData, "gene");
            return;
        } else if (pointType === "gwas") {
            let data = gwasData.find((s) => s.id === name);
            if (!data) return;

            const gwasUrl = `https://www.ebi.ac.uk/gwas/search?query=${encodeURIComponent(data.id)}`;

            const formattedData = (
                <>
                    <strong>SNP:</strong> {data.id}{" "}
                    <a href={gwasUrl} target="_blank" rel="noopener noreferrer">
                        (View in GWAS Catalog)
                    </a>
                    <br />
                    <strong>Chromosome:</strong> {chromosome}
                    <br />
                    <strong>Position:</strong> {data.x}
                    <br />
                    <strong>β:</strong> {formatNumber(data.beta, 6)}
                    <br />
                    <strong>−log10(p):</strong>{" "}
                    {formatNumber(data.y * Math.sign(data.beta), 6)}
                </>
            );

            handleSelect(name, formattedData, "snp");
            return;
        }
    };

    const signalTraces = useMemo(() => {
        const traces = [];

        cellTypes.forEach((celltype, i) => {
            const entry = signalData[celltype];
            const baseHue = (i * 360) / cellTypes.length;
            const plusColor = `hsl(${baseHue}, 70%, 45%)`;
            const minusColor = `hsla(${baseHue}, 70%, 75%, 0.7)`; // lighter and semi-transparent for minus strand
            const yaxisId = `y${i + (hasGwas ? 3 : 2)}`;

            // Plus/minus case
            if (entry && !Array.isArray(entry) && (entry.plus || entry.minus)) {
                const plus = entry.plus || [];
                const minus = entry.minus || [];

                const xPlus = plus.map((d) => d.position);
                const yPlus = plus.map((d) => d.value);

                const xMinus = minus.map((d) => d.position);
                const yMinus = minus.map((d) => -d.value); // flip below 0

                const plusBinRanges = xPlus.map((binStart) => {
                    const binEnd = binStart + binSize - 1;
                    return `${binStart}–${binEnd} (${binSize} bp)`;
                });
                const minusBinRanges = xMinus.map((binStart) => {
                    const binEnd = binStart + binSize - 1;
                    return `${binStart}–${binEnd} (${binSize} bp)`;
                });

                // Plus trace
                traces.push({
                    name: `${celltype} (+)`,
                    x: xPlus,
                    y: yPlus,
                    type: useWebGL ? "scattergl" : "scatter",
                    mode: "lines",
                    fill: "tozeroy",
                    line: { shape: "hv", width: 0 },
                    fillcolor: plusColor,
                    xaxis: "x",
                    yaxis: yaxisId,
                    hoverinfo: "x+y+name",
                    hovertemplate:
                        `<b>${celltype} (+)</b><br>` +
                        `Bin Range: %{customdata}<br>` +
                        `Value: %{y:.3f}<br>` +
                        `<extra></extra>`,
                    hoverlabel: {
                        bgcolor: plusColor,
                    },
                    pointType: "signal",
                    customdata: plusBinRanges,
                    showlegend: false,
                });

                // Minus trace
                traces.push({
                    name: `${celltype} (−)`,
                    x: xMinus,
                    y: yMinus,
                    type: useWebGL ? "scattergl" : "scatter",
                    mode: "lines",
                    fill: "tozeroy",
                    line: { shape: "hv", width: 0 },
                    fillcolor: minusColor,
                    xaxis: "x",
                    yaxis: yaxisId,
                    hoverinfo: "x+y+name",
                    hovertemplate:
                        `<b>${celltype} (−)</b><br>` +
                        `Bin Range: %{customdata}<br>` +
                        `Value: %{y:.3f}<br>` +
                        `<extra></extra>`,
                    hoverlabel: {
                        bgcolor: minusColor,
                    },
                    pointType: "signal",
                    customdata: minusBinRanges,
                    showlegend: false,
                });

                return;
            }

            // Single-track case
            const cellData = Array.isArray(entry) ? entry : [];
            const xValues = cellData.map((d) => d.position);
            const yValues = cellData.map((d) => d.value);

            const binRanges = xValues.map((binStart) => {
                const binEnd = binStart + binSize - 1;
                return `${binStart}–${binEnd} (${binSize} bp)`;
            });

            traces.push({
                name: celltype,
                x: xValues,
                y: yValues,
                type: useWebGL ? "scattergl" : "scatter",
                mode: "lines",
                fill: "tozeroy",
                line: { shape: "hv", width: 0 },
                fillcolor: plusColor, // reuse plus color for single track
                xaxis: "x",
                yaxis: yaxisId,
                hoverinfo: "x+y+name",
                hovertemplate:
                    `<b>${celltype}</b><br>` +
                    `Bin Range: %{customdata}<br>` +
                    `Value: %{y:.3f}<br>` +
                    `<extra></extra>`,
                hoverlabel: {
                    bgcolor: plusColor,
                },
                pointType: "signal",
                customdata: binRanges,
                showlegend: false,
            });
        });

        return traces;
    }, [binSize, cellTypes, hasGwas, signalData, useWebGL]);

    // Calculate layout dimensions
    const pixelsPerTrack = getDisplayOption(displayOptions, "trackHeight", 120);
    const pixelsPerGap = getDisplayOption(displayOptions, "gapHeight", 10);
    const marginTop = 80;
    const marginBottom = 80;
    const marginLeft = 80;
    const marginRight = 80;

    const nSignalTracks = cellTypes.length;
    const nGwasTracks = hasGwas ? 1 : 0;

    const totalInnerHeight =
        exonTrackPixels + // special for exon track
        nGwasTracks * pixelsPerTrack +
        nSignalTracks * pixelsPerTrack +
        (1 + nGwasTracks + nSignalTracks - 1) * pixelsPerGap;

    const totalHeight = marginTop + marginBottom + totalInnerHeight;

    // Normalized heights
    const exonTrackDomainHeight =
        exonTrackPixels / (totalHeight - marginTop - marginBottom);
    const normalTrackDomainHeight =
        pixelsPerTrack / (totalHeight - marginTop - marginBottom);
    const gapDomainHeight =
        pixelsPerGap / (totalHeight - marginTop - marginBottom);

    const calculateDomain = useCallback(
        (trackIndex) => {
            let offset = 0;

            if (trackIndex === 0) {
                const start = 0;
                const end = start + exonTrackDomainHeight;
                return [start, Math.min(end, 1.0)];
            }

            offset += exonTrackDomainHeight + gapDomainHeight;

            if (hasGwas && trackIndex === 1) {
                const start = offset;
                const end = start + normalTrackDomainHeight;
                return [start, Math.min(end, 1.0)];
            }

            if (hasGwas) {
                offset += normalTrackDomainHeight + gapDomainHeight;
            }

            const signalIndex = trackIndex - (hasGwas ? 2 : 1);
            offset += signalIndex * (normalTrackDomainHeight + gapDomainHeight);

            const start = offset;
            const end = start + normalTrackDomainHeight;
            return [start, Math.min(end, 1.0)];
        },
        [
            exonTrackDomainHeight,
            normalTrackDomainHeight,
            gapDomainHeight,
            hasGwas,
        ],
    );

    // Plotly layout
    const layout = useMemo(
        () => ({
            title: {
                text: `<b>${chromosome}:${selectedRange.start}-${selectedRange.end}</b>`,
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
                title: {
                    text: `Genomic Position (${chromosome}:${Math.max(0, visibleRange.start)}-${visibleRange.end})`,
                },
                range: initialXRange,
                // range: [range.start, range.end],
                // minallowed: 0,
                // maxallowed: initialXRange[1],
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
                const [yMin, yMax] = getTrackRange(
                    celltype,
                    signalList,
                    visibleRange,
                    displayOptions,
                    trackTypes,
                    globalHalfRangeSym,
                    globalMaxPosRange,
                );

                acc[`yaxis${baseIndex + 1}`] = {
                    title: { text: `Signal`, font: { size: 10 } },
                    domain: calculateDomain(baseIndex),
                    autorange: false,
                    range: [yMin, yMax],
                    fixedrange: true,
                    showgrid: getDisplayOption(
                        displayOptions,
                        "showGrid",
                        true,
                    ),
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
                          showgrid: getDisplayOption(
                              displayOptions,
                              "showGrid",
                              true,
                          ),
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
                      },
                  }
                : {}),
            yaxis: {
                autorange: false,
                domain: calculateDomain(0), // 0th track is for SNP track
                range: [geneTrackYMin, geneTrackYMax],
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
                    y0: geneTrackYMin,
                    y1: geneTrackYMax,
                    fillcolor: "lightgray",
                    opacity: 0.3,
                    layer: "below",
                    line: { width: 0 },
                },

                ...(hasGwas
                    ? [
                          {
                              type: "rect",
                              xref: "paper",
                              yref: "y2",
                              x0: 0,
                              x1: 1,
                              y0: Math.log10(5e-8),
                              y1: -Math.log10(5e-8),
                              fillcolor: "lightgray",
                              opacity: 0.3,
                              layer: "below",
                              line: { width: 0 },
                          },
                      ]
                    : []),
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
            selectedRange.start,
            selectedRange.end,
            totalHeight,
            cellTypes,
            hasGwas,
            visibleRange,
            initialXRange,
            displayOptions,
            calculateDomain,
            initialGwasYRange,
            geneTrackYMin,
            geneTrackYMax,
            signalList,
            trackTypes,
            globalHalfRangeSym,
            globalMaxPosRange,
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
                onUpdate={handlePlotUpdate}
                onInitialized={handlePlotUpdate}
                onClick={onClick}
                data={[...geneTrackTraces, ...gwasTrace, ...signalTraces]}
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
                        filename: `${dataset}.${chromosome}.${Math.max(range.start, 0)}-${range.end}`,
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
                                    const exportDiv =
                                        document.createElement("div");
                                    exportDiv.style.position = "fixed";
                                    exportDiv.hidden = true;
                                    exportDiv.style.left = "-1000px";
                                    exportDiv.style.width =
                                        gd.offsetWidth + "px";
                                    exportDiv.style.height =
                                        gd.offsetHeight + "px";
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

                                    Plotly.newPlot(
                                        exportDiv,
                                        exportData,
                                        exportLayout,
                                        {
                                            responsive: false,
                                        },
                                    ).then(() => {
                                        Plotly.downloadImage(exportDiv, {
                                            format: "svg",
                                            filename: `${dataset}.${chromosome}.${range.start}-${range.end}`,
                                        }).then(() => {
                                            document.body.removeChild(
                                                exportDiv,
                                            );
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
    selectedRange: PropTypes.shape({
        start: PropTypes.number.isRequired,
        end: PropTypes.number.isRequired,
    }).isRequired,
    visibleRange: PropTypes.shape({
        start: PropTypes.number,
        end: PropTypes.number,
    }).isRequired,
    binSize: PropTypes.number.isRequired,
    exonStructure: PropTypes.arrayOf(
        PropTypes.shape({
            chrom: PropTypes.string,
            transcript_id: PropTypes.string,
            gene_id: PropTypes.string,
            gene_symbol: PropTypes.string,
            strand: PropTypes.string,
            biotype: PropTypes.string,
            tx_start: PropTypes.number,
            tx_end: PropTypes.number,
            exons: PropTypes.arrayOf(
                PropTypes.shape({
                    exon_start: PropTypes.number,
                    exon_end: PropTypes.number,
                }),
            ),
            _truncated: PropTypes.bool,
        }),
    ),
    exonStructureTruncated: PropTypes.bool,
    nearbyGenes: PropTypes.arrayOf(
        PropTypes.shape({
            gene_id: PropTypes.string,
            position_start: PropTypes.number,
            position_end: PropTypes.number,
            strand: PropTypes.oneOf(["+", "-", "x"]),
        }),
    ).isRequired,
    signalData: PropTypes.objectOf(
        PropTypes.oneOfType([
            PropTypes.arrayOf(
                PropTypes.shape({
                    position: PropTypes.number,
                    value: PropTypes.number,
                    celltype: PropTypes.string,
                }),
            ),
            PropTypes.shape({
                plus: PropTypes.arrayOf(
                    PropTypes.shape({
                        position: PropTypes.number,
                        value: PropTypes.number,
                    }),
                ),
                minus: PropTypes.arrayOf(
                    PropTypes.shape({
                        position: PropTypes.number,
                        value: PropTypes.number,
                    }),
                ),
            }),
            PropTypes.oneOf([null]),
        ]),
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
        yHeightGlobal: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string,
        ]),
    }),
    handlePlotUpdate: PropTypes.func.isRequired,
};

export default RegionViewPlotlyPlot;
