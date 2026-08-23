import React, { useMemo, useCallback, useState, useEffect } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";
import PropTypes from "prop-types";
import { getGencodeVersion } from "../../api/qtl.js";

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

const SNPViewPlotlyPlot = React.memo(function SNPViewPlotlyPlot({
    dataset,
    snpName,
    snps,
    gwasDatasets,
    gwasData,
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
                    gene_name,
                    p_value,
                    beta_value,
                    position_start,
                    position_end,
                    strand,
                    biotype,
                    ...rest
                }) => ({
                    ...rest,
                    id: gene_id, // Ensembl ID
                    name: gene_name, // Symbol
                    y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
                    beta: beta_value,
                    x: strand === "-" ? position_end : position_start,
                    position_start,
                    position_end,
                    p_value,
                    strand,
                    celltype,
                    biotype,
                }),
            ),
    );

    const snp = snps.find((s) => s.snp_id === snpName);
    const snpPosition = snp ? snp.position : 0;

    const allGenePositions = combinedGeneList.flatMap((g) => [
        g.position_start,
        g.position_end,
    ]);
    const allGwasPositions = Object.values(gwasData)
        .flat()
        .map((s) => s.position);
    const allDataPositions = [
        ...allGenePositions,
        ...allGwasPositions,
        snpPosition,
    ];
    const dataMin = Math.min(...allDataPositions);
    const dataMax = Math.max(...allDataPositions);

    const yValues = combinedGeneList.map((g) => g.y);
    const betaValues = combinedGeneList.map((g) => g.beta);
    const maxBetaMagnitude = betaValues.length
        ? Math.max(...betaValues.map(Math.abs))
        : 0;
    const minBetaMagnitude = betaValues.length
        ? Math.min(...betaValues.map(Math.abs))
        : Infinity;

    const gwasYValues = Object.values(gwasData)
        .flat()
        .map((s) => -Math.log10(Math.max(s.p_value, 1e-20)));
    const hasGwas = gwasDatasets.length > 0 && gwasYValues.length > 0;
    const gwasYMin = hasGwas ? Math.min(...gwasYValues, 0) : 0;
    const gwasYMax = hasGwas ? Math.max(...gwasYValues, 2) + 1 : 3;
    const initialGwasYRange = useMemo(
        () => [gwasYMin, gwasYMax],
        [gwasYMin, gwasYMax],
    );

    const yPadding = 1;
    const yHeight = getDisplayOption(displayOptions, "yHeight", "");
    const yMax =
        yHeight !== "" ? Number(yHeight) : Math.max(...yValues, 2) + yPadding;
    const yMin = Math.min(...yValues, 0);
    const initialYRange = useMemo(() => [yMin, yMax], [yMin, yMax]);

    const radius = 1_500_000;
    const paddingFactor = 0.05; // 5% padding
    const targetPos = snpPosition;

    const leftBoundary = targetPos - radius;
    const rightBoundary = targetPos + radius;

    let neededLeft = (targetPos - dataMin) * (1 + paddingFactor);
    let neededRight = (dataMax - targetPos) * (1 + paddingFactor);

    const availLeft = targetPos - leftBoundary;
    const availRight = rightBoundary - targetPos;

    neededLeft = Math.min(neededLeft, availLeft);
    neededRight = Math.min(neededRight, availRight);

    let L, R;
    const lower = Math.max(neededLeft, neededRight);
    const upper = Math.min(availLeft, availRight);
    if (lower <= upper) {
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

    const xMin = targetPos - L;
    const xMax = targetPos + R;

    const gwasMin = hasGwas ? Math.min(...gwasYValues, 0) : 0;
    const gwasMax = hasGwas ? Math.max(...gwasYValues, 2) + 1 : 3;

    const initialXRange = useMemo(() => [xMin, xMax], [xMin, xMax]);

    const formatNumber = (num, precision) => {
        const rounded = round(num, precision);
        return rounded < 0 // Just in case there's a hyphen in there somehow
            ? rounded.toString().replace("-", "−")
            : rounded.toString();
    };

    const getGwasDisplayName = useCallback((ds) => {
        if (ds.trait && ds.citation) {
            return `GWAS for ${ds.trait} (${ds.citation})`;
        }
        return ds.name || ds.id;
    }, []);

    const gwasTraces = useMemo(() => {
        return gwasDatasets.flatMap((ds, idx) => {
            const data = gwasData[ds.id] || [];
            const points = data
                .filter((d) => d.snp_id !== snpName)
                .map((d) => ({
                    x: d.position,
                    y: -Math.log10(Math.max(d.p_value, 1e-20)),
                    beta: d.beta,
                    id: d.snp_id,
                }));
            if (points.length === 0) return [];
            return [
                {
                    name: getGwasDisplayName(ds),
                    x: points.map((p) => p.x),
                    y: points.map((p) => p.y),
                    xaxis: "x",
                    yaxis: `y${idx + 2}`,
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
    }, [gwasDatasets, gwasData, useWebGL, snpName]);

    const targetSnpTraces = useMemo(() => {
        return gwasDatasets.flatMap((ds, idx) => {
            const found = (gwasData[ds.id] || []).find(
                (d) => d.snp_id === snpName,
            );
            if (!found) return [];
            const y = -Math.log10(Math.max(found.p_value, 1e-20));
            const targetHasGwas = hasGwas && snp?.y != null;

            return [
                {
                    x: [found.position],
                    y: [y],
                    xaxis: "x",
                    yaxis: `y${idx + 2}`,
                    type: useWebGL ? "scattergl" : "scatter",
                    mode: "markers",
                    marker: {
                        color: "black",
                        size: 10,
                        line: { width: 0 },
                    },
                    customdata: [found.snp_id],
                    name: `Target SNP`,
                    pointType: targetHasGwas ? "gwas" : "snp",
                    showlegend: false,
                    hoverinfo: "text",
                    hovertext:
                        `<b>SNP:</b> ${found.snp_id}<br>` +
                        `<b>Dataset:</b> ${getGwasDisplayName(ds)}<br>` +
                        `<b>Position:</b> ${found.position}<br>` +
                        `<b>β (GWAS):</b> ${formatNumber(found.beta, 6)}<br>` +
                        `<b>−log10(p):</b> ${formatNumber(y, 6)}`,
                },
            ];
        });
    }, [
        gwasDatasets,
        gwasData,
        snpName,
        useWebGL,
        getGwasDisplayName,
        formatNumber,
        hasGwas,
        snp,
    ]);

    const targetAnnotations = useMemo(() => {
        const ann = [];
        gwasDatasets.forEach((ds, idx) => {
            const found = (gwasData[ds.id] || []).find(
                (d) => d.snp_id === snpName,
            );
            if (!found) return;
            const y = -Math.log10(Math.max(found.p_value, 1e-20));

            const frac = (y - gwasMin) / (gwasMax - gwasMin || 1);
            const isTop = frac < 0.2;
            const distance = (gwasMax - gwasMin) * 0.04;
            const annotationY = isTop ? y + distance : y - distance;

            ann.push({
                x: found.position,
                y: annotationY,
                xref: "x",
                yref: `y${idx + 2}`,
                text: snpName,
                showarrow: false,
                font: { color: "black", size: 12 },
                xanchor: "center",
                yanchor: isTop ? "bottom" : "top",
            });
        });
        return ann;
    }, [gwasDatasets, gwasData, snpName, gwasMin, gwasMax]);

    const geneTraces = useMemo(
        () =>
            cellTypes.flatMap((celltype, i) => {
                const cellGenes = geneData[celltype] || [];
                const geneList = cellGenes.map(
                    ({
                        gene_id,
                        gene_name,
                        p_value,
                        beta_value,
                        position_start,
                        position_end,
                        strand,
                        biotype,
                        ...rest
                    }) => ({
                        ...rest,
                        id: gene_id,
                        name: gene_name,
                        y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
                        beta: beta_value,
                        x: strand === "-" ? position_end : position_start,
                        position_start,
                        position_end,
                        strand,
                        biotype,
                        p_value,
                    }),
                );

                return geneList.map((gene) => {
                    const x0 =
                        gene.strand === "-"
                            ? gene.position_end
                            : gene.position_start;
                    const x1 =
                        gene.strand === "-"
                            ? gene.position_start
                            : gene.position_end;
                    const y0 = gene.y;
                    const y1 = y0;

                    const isPeak = gene.strand === "x";

                    return {
                        name: gene.id,
                        x: [x0, x1],
                        y: [y0, y1],
                        xaxis: "x",
                        yaxis: `y${gwasDatasets.length + 2 + i}`,
                        type: useWebGL ? "scattergl" : "scatter",
                        mode: "lines+markers",
                        line: {
                            color: dataToRGB(
                                gene,
                                minBetaMagnitude,
                                maxBetaMagnitude,
                            ),
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
                                dataToRGB(
                                    gene,
                                    minBetaMagnitude,
                                    maxBetaMagnitude,
                                ),
                                dataToRGB(
                                    gene,
                                    minBetaMagnitude,
                                    maxBetaMagnitude,
                                ),
                            ],
                            opacity: [isPeak ? 1 : 0, 1],
                            line: { width: isPeak ? 3 : 1 },
                        },
                        customdata: [gene.id],
                        hoverinfo: "text",
                        hovertext:
                            `<b>${isPeak ? "Peak" : "Gene"}:</b> ${gene.name}<br>` +
                            (gene.id && !isPeak
                                ? `<b>Gene ID:</b> ${gene.id}<br>`
                                : "") +
                            `<b>Start:</b> ${gene.position_start}<br>` +
                            `<b>End:</b> ${gene.position_end}<br>` +
                            (gene.strand && !isPeak
                                ? `<b>Strand:</b> ${gene.strand === "-" ? "−" : gene.strand === "+" ? "+" : "N/A"}<br>`
                                : "") +
                            (gene.biotype && !isPeak
                                ? `<b>Biotype:</b> ${gene.biotype}<br>`
                                : "") +
                            `<b>β:</b> ${formatNumber(gene.beta, 3)}<br>` +
                            `<b>−log10(p):</b> ${formatNumber(gene.y, 3)}`,
                        pointType: "gene",
                    };
                });
            }),
        [
            cellTypes,
            geneData,
            gwasDatasets.length,
            useWebGL,
            minBetaMagnitude,
            maxBetaMagnitude,
            formatNumber,
        ],
    );

    // Calculate layout dimensions
    const pixelsPerTrack = getDisplayOption(displayOptions, "trackHeight", 150);
    const pixelsPerGap = getDisplayOption(displayOptions, "gapHeight", 20);
    const marginTop = 80,
        marginBottom = 80,
        marginLeft = 80,
        marginRight = 80;

    const nGwas = gwasDatasets.length;
    const nCell = cellTypes.length;

    const totalInnerHeight =
        nGwas * pixelsPerTrack +
        nCell * pixelsPerTrack +
        (nGwas + nCell - 1) * pixelsPerGap;
    const totalHeight = marginTop + marginBottom + totalInnerHeight;

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

    const [xAxisRange, setXAxisRange] = useState(initialXRange);

    const yAxes = useMemo(() => {
        const axes = {};
        // GWAS tracks
        for (let i = 0; i < nGwas; i++) {
            axes[`yaxis${i + 2}`] = {
                title: { text: `−log10(p)`, font: { size: 12 } },
                domain: calculateDomain(i),
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
                domain: calculateDomain(nGwas + i),
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
        nGwas,
        nCell,
        initialGwasYRange,
        initialYRange,
        displayOptions,
    ]);

    const backgroundShapes = useMemo(() => {
        const shapes = [];
        // GWAS tracks
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
        // Cell type tracks
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
    }, [nGwas, nCell, initialGwasYRange, initialYRange]);

    const dashedLineShapes = useMemo(() => {
        if (!getDisplayOption(displayOptions, "showDashedLine", true))
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
        const x0 = snpPosition;
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
        displayOptions,
        snpPosition,
        nGwas,
        nCell,
        initialGwasYRange,
        initialYRange,
    ]);

    const [gencodeVersion, setGencodeVersion] = useState("");
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const v = await getGencodeVersion(dataset);
                if (!cancelled) setGencodeVersion(v);
            } catch (e) {
                console.error("Error loading GENCODE version:", e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [dataset]);

    const trackAnnotations = useMemo(() => {
        const ann = [];
        // GWAS track labels
        gwasDatasets.forEach((ds, i) => {
            const domain = calculateDomain(i);
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
            const domain = calculateDomain(nGwas + i);
            ann.push({
                text:
                    ct + (gencodeVersion ? ` (GENCODE ${gencodeVersion})` : ""),
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
    }, [
        gwasDatasets,
        cellTypes,
        calculateDomain,
        nGwas,
        gencodeVersion,
        getGwasDisplayName,
    ]);

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
            title: { text: `<b>${snpName}</b>`, font: { size: 20 } },
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
                minallowed: leftBoundary,
                maxallowed: rightBoundary,
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
            annotations: [...trackAnnotations, ...targetAnnotations],
        }),
        [
            snpName,
            totalHeight,
            xAxisTitle,
            xAxisRange,
            initialXRange,
            leftBoundary,
            rightBoundary,
            displayOptions,
            yAxes,
            backgroundShapes,
            dashedLineShapes,
            trackAnnotations,
        ],
    );

    const onClick = (data) => {
        if (!data.points || data.points.length === 0) return;

        const point = data.points[0];
        const pointData = point.data;
        const pointType = pointData.pointType;
        const name = point.customdata || pointData.name;

        if (pointType === "gwas") {
            // Collect rows from all GWAS datasets
            const gwasRows = Object.entries(gwasData).flatMap(([dsId, snps]) =>
                snps
                    .filter((s) => s.snp_id === name)
                    .map((s) => ({ ...s, dataset: dsId })),
            );
            if (gwasRows.length === 0) return;

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
                    <strong>Position:</strong> {gwasRows[0].position}
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
                                <th style={{ textAlign: "left" }}>Dataset</th>
                                <th style={{ textAlign: "right" }}>β</th>
                                <th style={{ textAlign: "right" }}>
                                    −log10(p)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {gwasRows.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{row.dataset}</td>
                                    <td style={{ textAlign: "right" }}>
                                        {round(row.beta, 3)}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {round(
                                            -Math.log10(
                                                Math.max(row.p_value, 1e-20),
                                            ),
                                            3,
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );
            handleSelect(name, formattedData, "snp");
        } else if (pointType === "gene") {
            // Collect rows from all cell types
            const geneRows = combinedGeneList.filter((g) => g.id === name);
            if (geneRows.length === 0) return;
            const formattedData = (
                <>
                    <strong>
                        {geneRows[0].strand === "x" ? "Peak" : "Gene"}:
                    </strong>{" "}
                    {geneRows[0].name}
                    <br />
                    {geneRows[0].id && geneRows[0].strand !== "x" ? (
                        <>
                            <strong>Gene ID:</strong> {geneRows[0].id}
                            <br />
                        </>
                    ) : null}
                    <strong>Chromosome:</strong> {chromosome}
                    <br />
                    <strong>Start:</strong> {geneRows[0].position_start}
                    <br />
                    <strong>End:</strong> {geneRows[0].position_end}
                    <br />
                    {geneRows[0].biotype ? (
                        <>
                            <strong>Biotype:</strong> {geneRows[0].biotype}
                            <br />
                        </>
                    ) : null}
                    {geneRows[0].strand !== "x" ? (
                        <>
                            <strong>Strand:</strong>{" "}
                            {geneRows[0].strand === "-" ? "−" : "+"}
                            <br />
                        </>
                    ) : null}
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
                                <th style={{ textAlign: "right" }}>
                                    −log10(p)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {geneRows.map((row, idx) => (
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
            handleSelect(name, formattedData, "gene");
        }
    };

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
                data={[...geneTraces, ...gwasTraces, ...targetSnpTraces]}
                style={{ width: "100%", height: "100%" }}
                layout={layout}
                useResizeHandler
                config={{
                    doubleClick: "reset",
                    responsive: true,
                    displaylogo: false,
                    scrollZoom: true,
                    toImageButtonOptions: {
                        name: "Save as PNG",
                        format: "png",
                        filename: `${dataset}.${snpName}`,
                        scale: 1,
                    },
                    modeBarButtonsToRemove: ["autoScale2d"],
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

                                    const exportData = gd.data.map((trace) =>
                                        trace.type === "scattergl"
                                            ? { ...trace, type: "scatter" }
                                            : trace,
                                    );

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
                                        { responsive: false },
                                    ).then(() => {
                                        Plotly.downloadImage(exportDiv, {
                                            format: "svg",
                                            filename: `${dataset}.${snpName}`,
                                        }).then(() => {
                                            document.body.removeChild(
                                                exportDiv,
                                            );
                                            Plotly.purge(exportDiv);
                                        });
                                    });
                                },
                            },
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
            beta: PropTypes.number,
            y: PropTypes.number,
            p_value: PropTypes.number,
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
