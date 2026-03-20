import React, { useMemo, useCallback, useState, useEffect } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import PropTypes from "prop-types";

function dataToRGB({ beta, y }, min = 2, max = 3) {
    const maxLevel = 230;

    if (Math.abs(y) < 2)
        return beta > 0 ? `rgb(200, 161, 161)` : `rgb(161, 161, 200)`;

    const absBeta = Math.abs(beta);
    let intensity;

    // Calculated intensity based on absBeta within [min, max]
    //这部分将 beta 的绝对值映射到 [0, 1] 区间的强度值：
    // absBeta < min → intensity = 0（最浅色）
    // absBeta > max → intensity = 1（最深色）
    // 在 min 和 max 之间 → 线性插值

    if (min >= max) {
        intensity = absBeta >= max ? 1 : 0; // Treat min/max as single threshold
    } else {
        if (absBeta < min) intensity = 0;
        else if (absBeta > max) intensity = 1;
        else intensity = (absBeta - min) / (max - min); // Normalize to [0,1]
    }

    // const channelValue = Math.round(maxLevel * (1 - intensity));
    const channelValue = 80;

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

const GeneViewPlotlyPlot = React.memo(function GeneViewPlotlyPlot({
    dataset,
    geneId,
    genes,
    gwasDatasets,
    gwasData,
    snpData,
    chromosome,
    cellTypes,
    handleSelect,
    useWebGL,
    displayOptions,
}) {
    const combinedSnpList = Object.entries(snpData).flatMap(
        ([celltype, snps]) =>
            snps.map(({ snp_id, p_value, beta_value, position, ...rest }) => ({
                ...rest,
                id: snp_id,
                y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
                beta: beta_value,
                x: position,
                p_value,
                celltype,
            })),
    );

    const gene = genes.find((g) => g.gene_id === geneId);
    const geneStart = gene ? gene.position_start : 0;
    const geneEnd = gene ? gene.position_end : 0;
    const geneLabel = gene ? gene.gene_name || gene.gene_id || geneId : geneId;

    // Calculate X and Y ranges
    const radius = 1_500_000;
    const xValues = combinedSnpList.map((snp) => snp.x);
    const yValues = combinedSnpList.map((snp) => snp.y);
    const betaValues = combinedSnpList.map((snp) => snp.beta);
    const maxBetaMagnitude = betaValues.reduce(
        (max, b) => Math.max(max, Math.abs(b)),
        0,
    );
    const minBetaMagnitude = betaValues.reduce(
        (min, b) => Math.min(min, Math.abs(b)),
        Infinity,
    );

    const dataMin = Math.min(...xValues, geneStart, geneEnd);
    const dataMax = Math.max(...xValues, geneStart, geneEnd);
    const paddingFactor = 0.05; // 5% padding

    const tss =
        gene?.strand === "+"
            ? geneStart
            : gene?.strand === "-"
              ? geneEnd
              : (geneStart + geneEnd) / 2; // fallback for peaks

    const leftBoundary = geneStart - radius;
    const rightBoundary = geneEnd + radius;

    let neededLeft = (tss - dataMin) * (1 + paddingFactor);
    let neededRight = (dataMax - tss) * (1 + paddingFactor);

    const availLeft = tss - leftBoundary;
    const availRight = rightBoundary - tss;

    neededLeft = Math.min(neededLeft, availLeft);
    neededRight = Math.min(neededRight, availRight);

    let L, R;
    const lower = Math.max(neededLeft, neededRight);
    const upper = Math.min(availLeft, availRight);
    if (lower <= upper) {
        // Perfectly symmetric
        L = lower;
        R = lower;
    } else {
        if (availLeft < neededRight) {
            L = availLeft;
            R = neededRight;
        } else {
            L = neededLeft;
            R = availRight;
        }
    }

    const xMin = tss - L;
    const xMax = tss + R;

    const visibleGenes = useMemo(
        () =>
            genes.filter(
                (g) => g.position_end >= xMin && g.position_start <= xMax,
            ),
        [genes, xMin, xMax],
    );

    const yPadding = 1;
    const yHeight = getDisplayOption(displayOptions, "yHeight", "");
    const yMax =
        yHeight !== ""
            ? Number(yHeight)
            : yValues.reduce((max, y) => Math.max(max, y), 2) + yPadding;
    const yMin = yValues.reduce((min, y) => Math.min(min, y), 0);

    const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);
    const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);

    const nearbyXValues = useMemo(
        () => genes.flatMap((gene) => [gene.position_start, gene.position_end]),
        [genes],
    );

    const nearbyGenesRange = useMemo(() => {
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

    const getGwasDisplayName = useCallback((ds) => {
        console.log(ds);
        if (ds.trait && ds.citation) {
            return `GWAS for ${ds.trait} (${ds.citation})`;
        }
        return ds.name || ds.id;
    }, []);

    const allGwasSnps = useMemo(() => {
        return Object.values(gwasData).flat();
    }, [gwasData]);
    const gwasYValues = allGwasSnps.map((s) => s.y);
    const gwasYMin = gwasYValues.length ? Math.min(...gwasYValues, 0) : 0;
    const gwasYMax = gwasYValues.length ? Math.max(...gwasYValues, 2) + 1 : 3;
    const initialGwasYRange = useMemo(
        () => [gwasYMin, gwasYMax],
        [gwasYMin, gwasYMax],
    );

    const formatNumber = (num, precision) => {
        const rounded = round(num, precision);
        return rounded < 0 // Just in case there's a hyphen in there somehow
            ? rounded.toString().replace("-", "−")
            : rounded.toString();
    };

    const GENE_TRACK_GAP_PIXELS = 20;
    const GENE_LABEL_OFFSET_PIXELS = 7;

    let geneTrackYMin, geneTrackYMax;
    let geneTrackPixels;
    const geneTrackPixelsBase = 60;
    const pixelsPerJitterLane = 16;

    {
        const nGenes = visibleGenes.length;
        const baseLanes = 3;
        const lanesPerNGenes = 15;
        const effectiveLanes = baseLanes + Math.ceil(nGenes / lanesPerNGenes);
        geneTrackPixels =
            geneTrackPixelsBase + effectiveLanes * pixelsPerJitterLane;
        const jitterMin = -1.5;
        const jitterMax = 1.5;
        const span = jitterMax - jitterMin;
        const denominator = geneTrackPixels - 2 * GENE_TRACK_GAP_PIXELS;
        if (denominator <= 0) {
            geneTrackYMin = -2;
            geneTrackYMax = 2;
        } else {
            const pad = (GENE_TRACK_GAP_PIXELS * span) / denominator;
            geneTrackYMin = jitterMin - pad;
            geneTrackYMax = jitterMax + pad;
        }
    }

    // Calculate layout dimensions
    const pixelsPerTrack = getDisplayOption(displayOptions, "trackHeight", 150);
    const pixelsPerGap = getDisplayOption(displayOptions, "gapHeight", 20);
    const marginTop = 80;
    const marginBottom = 80;
    const marginLeft = 80;
    const marginRight = 80;

    const nGwas = gwasDatasets.length;
    const nCell = cellTypes.length;
    const totalInnerHeight =
        geneTrackPixels +
        nGwas * pixelsPerTrack +
        nCell * pixelsPerTrack +
        (1 + nGwas + nCell - 1) * pixelsPerGap;
    const totalHeight = marginTop + marginBottom + totalInnerHeight;

    // Normalized heights
    const geneTrackDomainHeight =
        geneTrackPixels / (totalHeight - marginTop - marginBottom);
    const trackDomainHeight =
        pixelsPerTrack / (totalHeight - marginTop - marginBottom);
    const gapDomainHeight =
        pixelsPerGap / (totalHeight - marginTop - marginBottom);

    const calculateDomain = useCallback(
        (trackIndex) => {
            if (trackIndex === 0) {
                return [0, geneTrackDomainHeight];
            }
            let offset = geneTrackDomainHeight + gapDomainHeight;
            if (trackIndex <= nGwas) {
                const start =
                    offset +
                    (trackIndex - 1) * (trackDomainHeight + gapDomainHeight);
                return [start, start + trackDomainHeight];
            }
            offset += nGwas * (trackDomainHeight + gapDomainHeight);
            const cellIndex = trackIndex - nGwas - 1;
            const start =
                offset + cellIndex * (trackDomainHeight + gapDomainHeight);
            return [start, start + trackDomainHeight];
        },
        [geneTrackDomainHeight, trackDomainHeight, gapDomainHeight, nGwas],
    );

    const snpTraces = useMemo(() => {
        return cellTypes.flatMap((celltype, i) => {
            const cellSnps = snpData[celltype] || [];
            const snpList = cellSnps.map(
                ({ snp_id, p_value, beta_value, position, ...rest }) => ({
                    ...rest,
                    id: snp_id,
                    y: -Math.log10(Math.max(p_value, 1e-20)),
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
                    yaxis: `y${nGwas + 2 + i}`,
                    type: useWebGL ? "scattergl" : "scatter",
                    mode: "markers",
                    marker: {
                        color: snpList.map((snp) =>
                            dataToRGB(snp, minBetaMagnitude, maxBetaMagnitude),
                        ),
                        opacity: 1,
                        size: snpList.map((snp) =>
                            Math.abs(snp.y) < 2 ? 6 : 8,
                        ),
                        line: { width: 0 },
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
    }, [
        cellTypes,
        snpData,
        nGwas,
        useWebGL,
        minBetaMagnitude,
        maxBetaMagnitude,
    ]);

    const gwasTraces = useMemo(() => {
        return gwasDatasets.flatMap((ds, idx) => {
            const data = gwasData[ds.id] || [];
            const points = data.map((d) => ({
                x: d.position,
                y: -Math.log10(Math.max(d.p_value, 1e-20)),
                beta: d.beta,
                id: d.snp_id,
            }));
            return [
                {
                    name: getGwasDisplayName(ds),
                    x: points.map((p) => p.x),
                    y: points.map((p) => p.y),
                    xaxis: "x",
                    yaxis: `y${idx + 2}`, // first GWAS track uses y2
                    type: useWebGL ? "scattergl" : "scatter",
                    mode: "markers",
                    marker: {
                        color: points.map((p) =>
                            p.beta > 0
                                ? "rgb(230,120,120)"
                                : "rgb(120,120,230)",
                        ),
                        size: 6,
                        line: { width: 0 },
                    },
                    customdata: points.map((p) => p.id),
                    hoverinfo: "text",
                    hovertext: points.map(
                        (p) =>
                            `<b>SNP:</b> ${p.id}<br>` +
                            `<b>Position:</b> ${p.x}<br>` +
                            `<b>β (GWAS):</b> ${round(p.beta, 6)}<br>` +
                            `<b>−log10(p):</b> ${round(p.y, 6)}`,
                    ),
                    pointType: "gwas",
                },
            ];
        });
    }, [gwasDatasets, gwasData, useWebGL]);

    // Advanced jitter to avoid overlapping gene labels
    const jitterMap = useMemo(() => {
        const map = new Map();
        const maxAmplitude = 1.5;
        const maxXSpacing = (xMax - xMin || 1) * 0.02;
        const minYSpacing = 0.3;
        const maxAttempts = 100;

        const assigned = []; // array of { pos: number, jitter: number }

        const sortedGenes = [...visibleGenes].sort(
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
    }, [xMin, xMax, visibleGenes]);

    const geneTraces = useMemo(() => {
        const getStart = (gene) =>
            gene.strand === "-" ? gene.position_end : gene.position_start;
        const getEnd = (gene) =>
            gene.strand === "-" ? gene.position_start : gene.position_end;
        const isTargetGene = (gene) => gene.gene_id === geneId;

        const otherGenes = genes.filter((g) => !isTargetGene(g));
        const targetGene = gene;
        if (!targetGene) return [];

        // We need null values to create breaks in the line
        const others = {
            x: otherGenes.flatMap((gene) => [
                getStart(gene),
                getEnd(gene),
                null,
            ]),
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
                    `<b>${gene.strand === "x" ? "Peak" : "Gene"}:</b> ${gene.gene_name}<br>` +
                    (gene.gene_id && gene.strand !== "x"
                        ? `<b>Gene ID:</b> ${gene.gene_id}<br>`
                        : "") +
                    `<b>Start:</b> ${gene.position_start}<br>` +
                    `<b>End:</b> ${gene.position_end}<br>` +
                    (gene.biotype && gene.strand !== "x"
                        ? `<b>Biotype:</b> ${gene.biotype}<br>`
                        : "") +
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

        const x0 = getStart(gene);
        const x1 = getEnd(gene);

        const targetIsPeak = targetGene.strand === "x";

        const target = {
            x: [x0, x1],
            y: [0, 0],
            xaxis: "x",
            yaxis: "y",
            type: "scatter",
            mode: "lines+markers",
            line: {
                color: "black",
                width: targetIsPeak ? 5 : 3,
            },
            marker: {
                symbol: [
                    targetIsPeak ? "line-ew" : "circle",
                    targetGene.strand === "-"
                        ? "triangle-left"
                        : targetGene.strand === "+"
                          ? "triangle-right"
                          : "line-ew",
                ],
                size: [targetIsPeak ? 8 : 0, targetIsPeak ? 8 : 12],
                color: ["black", "black"],
                opacity: [targetIsPeak ? 1 : 0, 1],
                line: { width: targetIsPeak ? 5 : 1 },
            },
            customdata: [targetGene.gene_id],
            hoverinfo: "text",
            hovertext:
                `<b>${targetIsPeak ? "Peak" : "Gene"}:</b> ${targetGene.gene_name}<br>` +
                (targetGene.gene_id && !targetIsPeak
                    ? `<b>Gene ID:</b> ${targetGene.gene_id}<br>`
                    : "") +
                `<b>Start:</b> ${targetGene.position_start}<br>` +
                `<b>End:</b> ${targetGene.position_end}<br>` +
                (targetGene.biotype && !targetIsPeak
                    ? `<b>Biotype:</b> ${targetGene.biotype}<br>`
                    : "") +
                (!targetIsPeak
                    ? `<b>Strand:</b> ${targetGene.strand === "-" ? "−" : targetGene.strand === "+" ? "+" : "N/A"}<br>`
                    : ""),
            name: targetGene.gene_id,
            pointType: "gene",
            showlegend: false,
        };

        const dataRangeHeight = geneTrackYMax - geneTrackYMin;
        const labelDataOffset =
            (GENE_LABEL_OFFSET_PIXELS * dataRangeHeight) / geneTrackPixels;

        const targetLabel = {
            x: [(x0 + x1) / 2],
            y: [-labelDataOffset],
            type: "scatter",
            mode: "text",
            text: [geneLabel],
            textposition: "bottom center",
            showlegend: false,
            hoverinfo: "skip",
            textfont: {
                color: "black",
            },
        };

        const otherLabels = {
            x: otherGenes.flatMap((gene) => [
                (getStart(gene) + getEnd(gene)) / 2,
            ]),
            y: otherGenes.flatMap((gene) => [
                jitterMap.get(gene.gene_id) - labelDataOffset,
            ]),
            type: "scatter",
            mode: "text",
            text: otherGenes.map((gene) => gene.gene_name),
            textposition: "bottom center",
            showlegend: false,
            hoverinfo: "skip",
            textfont: {
                size: 10,
                color: "rgb(161,161,161)",
            },
        };

        return [others, otherLabels, target, targetLabel];
    }, [gene, geneId, genes, jitterMap]);

    // Handle clicking points
    const onClick = (data) => {
        console.log("onClick data:", data);
        if (!data.points || data.points.length === 0) return;

        const point = data.points[0];
        const pointData = point.data;
        const pointType = pointData.pointType;
        const name = point.customdata || pointData.name;

        if (pointType === "snp" || pointType === "gwas") {
            // Collect data from all sources (cell types and GWAS datasets)
            const snpRows = combinedSnpList.filter((s) => s.id === name);
            const gwasRows = Object.entries(gwasData).flatMap(([dsId, snps]) =>
                snps
                    .filter((s) => s.snp_id === name)
                    .map((s) => ({ ...s, celltype: dsId })),
            );
            const allRows = [...snpRows, ...gwasRows];
            if (allRows.length === 0) return;

            const gwasUrl = `https://www.ebi.ac.uk/gwas/search?query=${encodeURIComponent(name)}`;
            const formattedData = (
                <>
                    <strong>SNP:</strong> {name}{" "}
                    <a href={gwasUrl} target="_blank" rel="noopener noreferrer">
                        (View in GWAS Catalog)
                    </a>
                    <br />
                    <strong>Chromosome:</strong> {chromosome}
                    <br />
                    <strong>Position:</strong> {allRows[0].x}
                    <br />
                    <table
                        style={{
                            marginTop: "0.75em",
                            borderCollapse: "collapse",
                            width: "100%",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left" }}>
                                    Dataset/Cell Type
                                </th>
                                <th style={{ textAlign: "right" }}>β</th>
                                <th style={{ textAlign: "right" }}>
                                    −log10(p)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {allRows.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{row.celltype}</td>
                                    <td style={{ textAlign: "right" }}>
                                        {round(row.beta, 3)}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {round(row.y, 3)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );
            handleSelect(name, formattedData, "snp");
        } else if (pointType === "gene") {
            const data = genes.find((g) => g.gene_id === name);
            if (!data) return;

            const formattedData = (
                <>
                    <strong>{data.strand === "x" ? "Peak" : "Gene"}:</strong>{" "}
                    {data.gene_name || data.gene_id || name}
                    <br />
                    {data.gene_id && data.strand !== "x" ? (
                        <>
                            <strong>Gene ID:</strong> {data.gene_id}
                            <br />
                        </>
                    ) : null}
                    <strong>Chromosome:</strong> {chromosome}
                    <br />
                    <strong>Start:</strong> {data.position_start}
                    <br />
                    <strong>End:</strong> {data.position_end}
                    <br />
                    {data.biotype && data.strand !== "x" ? (
                        <>
                            <strong>Biotype:</strong> {data.biotype}
                            <br />
                        </>
                    ) : null}
                    {data.strand !== "x" ? (
                        <>
                            <strong>Strand:</strong>{" "}
                            {data.strand === "-"
                                ? "−"
                                : data.strand === "+"
                                  ? "+"
                                  : "N/A"}
                        </>
                    ) : null}
                </>
            );

            // TODO if they select a gene, it goes to an error because its not a region
            handleSelect(name, formattedData, "gene");
            return;
        }
    };

    // Generate y‑axis definitions
    const yAxes = useMemo(() => {
        const axes = {};
        // Gene track
        axes.yaxis = {
            domain: calculateDomain(0),
            range: [geneTrackYMin, geneTrackYMax],
            fixedrange: true,
            showgrid: false,
            zeroline: false,
            ticks: "",
            showticklabels: false,
            showline: true,
            mirror: true,
            linewidth: 1,
            linecolor: "black",
            anchor: "x",
        };
        // GWAS tracks
        for (let i = 0; i < nGwas; i++) {
            axes[`yaxis${i + 2}`] = {
                title: { text: `−log10(p)`, font: { size: 12 } },
                domain: calculateDomain(i + 1),
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
            };
        }
        // Cell type tracks
        for (let i = 0; i < nCell; i++) {
            axes[`yaxis${nGwas + 2 + i}`] = {
                title: { text: `−log10(p)`, font: { size: 12 } },
                domain: calculateDomain(nGwas + 1 + i),
                range: initialYRange,
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
            };
        }
        return axes;
    }, [
        calculateDomain,
        geneTrackYMin,
        geneTrackYMax,
        nGwas,
        nCell,
        initialGwasYRange,
        initialYRange,
        displayOptions,
    ]);

    // Background shapes for each track
    const backgroundShapes = useMemo(() => {
        const shapes = [];
        // Gray rectangle for gene track
        shapes.push({
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
        });
        // Gray rectangles for GWAS tracks
        for (let i = 0; i < nGwas; i++) {
            shapes.push({
                type: "rect",
                xref: "paper",
                yref: `y${i + 2}`,
                x0: 0,
                x1: 1,
                y0: Math.log10(5e-8),
                y1: -Math.log10(5e-8),
                fillcolor: "lightgray",
                opacity: 0.3,
                layer: "below",
                line: { width: 0 },
            });
        }
        // Gray rectangles for cell type tracks
        for (let i = 0; i < nCell; i++) {
            shapes.push({
                type: "rect",
                xref: "paper",
                yref: `y${nGwas + 2 + i}`,
                x0: 0,
                x1: 1,
                y0: -2,
                y1: 2,
                fillcolor: "lightgray",
                opacity: 0.3,
                layer: "below",
                line: { width: 0 },
            });
        }
        return shapes;
    }, [
        geneTrackYMin,
        geneTrackYMax,
        nGwas,
        nCell,
        initialGwasYRange,
        initialYRange,
    ]);

    const dashedLineShapes = useMemo(() => {
        if (!gene || !getDisplayOption(displayOptions, "showDashedLine", true))
            return [];
        const lineColor = getDisplayOption(
            displayOptions,
            "dashedLineColor",
            "#000000",
        );
        const lineOnTop = getDisplayOption(
            displayOptions,
            "dashedLineOnTop",
            false,
        );
        const crossGap = getDisplayOption(
            displayOptions,
            "crossGapDashedLine",
            true,
        );
        const x0 =
            gene.strand === "-"
                ? gene.position_end
                : gene.strand === "+"
                  ? gene.position_start
                  : (gene.position_start + gene.position_end) / 2;
        const x1 = x0;
        if (crossGap) {
            return [
                {
                    type: "line",
                    xref: "x",
                    yref: "paper",
                    x0,
                    x1,
                    y0: 0,
                    y1: 1,
                    line: { color: lineColor, width: 1, dash: "dash" },
                    layer: lineOnTop ? "above" : "below",
                },
            ];
        } else {
            const lines = [];
            // Gene track
            lines.push({
                type: "line",
                xref: "x",
                yref: "y",
                x0,
                x1,
                y0: geneTrackYMin,
                y1: geneTrackYMax,
                line: { color: lineColor, width: 1, dash: "dash" },
                layer: lineOnTop ? "above" : "below",
            });
            // GWAS tracks
            for (let i = 0; i < nGwas; i++) {
                lines.push({
                    type: "line",
                    xref: "x",
                    yref: `y${i + 2}`,
                    x0,
                    x1,
                    y0: initialGwasYRange[0],
                    y1: initialGwasYRange[1],
                    line: { color: lineColor, width: 1, dash: "dash" },
                    layer: lineOnTop ? "above" : "below",
                });
            }
            // Cell type tracks
            for (let i = 0; i < nCell; i++) {
                lines.push({
                    type: "line",
                    xref: "x",
                    yref: `y${nGwas + 2 + i}`,
                    x0,
                    x1,
                    y0: initialYRange[0],
                    y1: initialYRange[1],
                    line: { color: lineColor, width: 1, dash: "dash" },
                    layer: lineOnTop ? "above" : "below",
                });
            }
            return lines;
        }
    }, [
        gene,
        displayOptions,
        geneTrackYMin,
        geneTrackYMax,
        nGwas,
        nCell,
        initialGwasYRange,
        initialYRange,
    ]);

    // Track labels (annotations)
    const trackAnnotations = useMemo(() => {
        const ann = [];
        // GWAS track labels
        gwasDatasets.forEach((ds, i) => {
            const domain = calculateDomain(i + 1);
            ann.push({
                text: getGwasDisplayName(ds),
                font: { size: 14 },
                xref: "paper",
                yref: "paper",
                x: 0.001,
                y: domain[1],
                showarrow: false,
                xanchor: "left",
                yanchor: "top",
            });
        });
        // Cell type labels
        cellTypes.forEach((ct, i) => {
            const domain = calculateDomain(nGwas + 1 + i);
            ann.push({
                text: ct,
                font: { size: 14 },
                xref: "paper",
                yref: "paper",
                x: 0.001,
                y: domain[1],
                showarrow: false,
                xanchor: "left",
                yanchor: "top",
            });
        });
        return ann;
    }, [gwasDatasets, cellTypes, calculateDomain, nGwas]);

    const [xAxisRange, setXAxisRange] = useState(initialXRange);

    useEffect(() => {
        setXAxisRange(initialXRange);
    }, [initialXRange]);

    const xAxisTitle = useMemo(() => {
        const range = xAxisRange || initialXRange;
        const start = Math.round(Math.max(range[0], 0));
        const end = Math.round(range[1]);
        return `Genomic Position (${chromosome}:${start}–${end})`;
    }, [chromosome, xAxisRange, initialXRange]);

    const handleRelayout = useCallback(
        (evt) => {
            if (evt["xaxis.autorange"] === true) {
                setXAxisRange(initialXRange);
                return;
            }

            const x0 =
                evt["xaxis.range[0]"] ??
                (Array.isArray(evt["xaxis.range"])
                    ? evt["xaxis.range"][0]
                    : undefined);
            const x1 =
                evt["xaxis.range[1]"] ??
                (Array.isArray(evt["xaxis.range"])
                    ? evt["xaxis.range"][1]
                    : undefined);

            if (typeof x0 === "number" && typeof x1 === "number") {
                setXAxisRange([x0, x1]);
            }
        },
        [initialXRange],
    );

    // Plotly layout
    const layout = useMemo(
        () => ({
            title: { text: `<b>${geneLabel}</b>`, font: { size: 20 } },
            paper_bgcolor: "rgba(0,0,0,0)",
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
            xaxis: {
                title: { text: xAxisTitle },
                range: xAxisRange || initialXRange,
                minallowed: geneStart - radius,
                maxallowed: geneEnd + radius,
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
            ...yAxes,
            shapes: [...backgroundShapes, ...dashedLineShapes],
            annotations: trackAnnotations,
        }),
        [
            geneLabel,
            totalHeight,
            xAxisTitle,
            xAxisRange,
            initialXRange,
            nearbyGenesRange,
            xMin,
            xMax,
            displayOptions,
            yAxes,
            backgroundShapes,
            dashedLineShapes,
            trackAnnotations,
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
                onRelayout={handleRelayout}
                data={[...geneTraces, ...snpTraces, ...gwasTraces]}
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
                        filename: `${dataset}.${geneId}`,
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
                                            filename: `${dataset}.${geneId}`,
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
                                            filename: `${dataset}.${geneId}`,
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

GeneViewPlotlyPlot.propTypes = {
    dataset: PropTypes.string.isRequired,
    geneId: PropTypes.string.isRequired,
    genes: PropTypes.arrayOf(
        PropTypes.shape({
            gene_id: PropTypes.string.isRequired,
            position_start: PropTypes.number.isRequired,
            position_end: PropTypes.number.isRequired,
            strand: PropTypes.oneOf(["+", "-", "x"]).isRequired,
        }),
    ).isRequired,
    gwasDatasets: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string,
            trait: PropTypes.string,
            citation: PropTypes.string,
        }),
    ).isRequired,
    gwasData: PropTypes.objectOf(
        PropTypes.arrayOf(
            PropTypes.shape({
                snp_id: PropTypes.string.isRequired,
                position: PropTypes.number.isRequired,
                beta: PropTypes.number.isRequired,
                p_value: PropTypes.number.isRequired,
            }),
        ),
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

export default GeneViewPlotlyPlot;
