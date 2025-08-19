import PlotlyStackedViolin from "./PlotlyStackedViolin.jsx";
import EChartMetaScatter from "./EChartMetaScatter.jsx";
import {useEffect, useMemo, useState} from "react";
import "./GeneView.css";
import {isCategorical} from "../../utils/funcs.js";
import PropTypes from "prop-types";
import useSampleGeneMetaStore from "../../store/SampleGeneMetaStore.js";
import {toast} from "react-toastify";
import Plotly from 'plotly.js-dist-min';

import {Switch, Typography, Stack} from "@mui/material";
import {saveAs} from "file-saver";
import Papa from "papaparse";

function filterBySampleId(obj, sampleList) {
    const sampleSet = new Set(sampleList);
    return Object.fromEntries(
        Object.entries(obj).filter(([key, entry]) => {
            const sample_id = key.split(/_[cs]\d+$/)[0];
            return sampleSet.has(sample_id)
        })
    );
}

function filterExprBySampleId(exprObj, sampleList) {
    const filteredExpr = {};
    for (const [gene, values] of Object.entries(exprObj)) {
        const filteredValues = Object.fromEntries(
            Object.entries(values).filter(([sc, val]) => {
                const sample = sc.split(/_[cs]\d+$/)[0];
                return sampleList.includes(sample);
            })
        );
        filteredExpr[gene] = filteredValues;
    }
    return filteredExpr;
}

const GeneMetaPlots = ({
                           geneList, sampleList, exprData, cellMetaData, sampleMetaData, CellMetaMap,
                           group, exprValueType,mainCluster,datasetId
                       }) => {

    console.log("geneMetaPlots: mainCluster",mainCluster,"datasetId",datasetId)
    const {pseudoExprDict, fetchPseudoExprData} = useSampleGeneMetaStore();
    const cell_level_meta = Object.keys(CellMetaMap ?? {});
    const [includeZeros, setIncludeZeros] = useState(false);

    const {processedExprData, processedMetaData} = useMemo(() => {

        let newExprData = {...exprData};
        let newMetaData = {};
        if (cell_level_meta.includes(group)) {
            newMetaData = Object.fromEntries(
                Object.entries(cellMetaData).map(([cs_id, csObj]) => {
                    const newSubObj = {...csObj};
                    const targetValue = csObj[group];
                    newSubObj[group] = CellMetaMap[group][targetValue][0];
                    return [cs_id, newSubObj];
                })
            );
        } else {
            newMetaData = Object.fromEntries(
                Object.entries(cellMetaData).map(([cs_id, csObj]) => {
                    const sample_id = cs_id.split(/_[cs]\d+$/)[0];
                    ;
                    const newSubObj = {...csObj};
                    newSubObj[group] = sampleMetaData[sample_id][group];
                    return [cs_id, newSubObj];
                })
            );
        }

        let isValidPseudobulk = false;

        if (exprValueType === "pseudobulk") {
            const firstSampleMeta = Object.values(sampleMetaData)[0] || {};
            const keys = Object.keys(firstSampleMeta);
            isValidPseudobulk = keys.includes(group);

            if (!isValidPseudobulk) {
                toast.error(`${group} is not valid for pseudobulk plots.`);
            } else {
                newExprData = {...pseudoExprDict};
                newMetaData = {...sampleMetaData};
            }
        }

        if (!isValidPseudobulk && sampleList.length > 0 && !sampleList.includes("all")) {
            newMetaData = filterBySampleId(newMetaData, sampleList);
            newExprData = filterExprBySampleId(newExprData, sampleList);
        }

        return {processedExprData: newExprData, processedMetaData: newMetaData};
    }, [exprValueType, geneList, group, sampleMetaData, pseudoExprDict, sampleList, cellMetaData, exprData, includeZeros]);

    useEffect(() => {
        fetchPseudoExprData();
    }, []);

    const metaValues = Object.values(processedMetaData).map((meta) => meta[group]);
    const isCat = isCategorical(metaValues);
    const isUsingPseudobulk = exprValueType === "pseudobulk" && processedExprData === pseudoExprDict;

    const plotClass = Object.keys(processedExprData).length <= 1
        ? "single-plot" : Object.keys(processedExprData).length === 2
            ? "two-plots" : Object.keys(processedExprData).length === 3
                ? "three-plots" : "four-plots";

    const handleDownload = () => {
        const result = [];
        let x = 0;
        Object.entries(processedExprData).forEach(([gene, values]) => {
            Object.entries(values).forEach(([cellId, exprVal]) => {
                if (includeZeros || exprVal !== 0) {
                    const meta = processedMetaData[cellId] || {};
                    // convert meta values to its original value based on CellMetaMap
                    for (const [key, value] of Object.entries(meta)) {
                        if (cell_level_meta.includes(key)) {
                            let value_str = value.toString();
                            if (CellMetaMap[key][value_str] === undefined) {
                                continue
                            }
                            meta[key] = CellMetaMap[key][value_str][0];
                        } else {
                            meta[key] = value;
                        }
                    }
                    result.push({
                        gene,
                        cell_id: cellId,
                        expr: exprVal,
                        ...meta
                    });
                }
            });
        });

        const csv = Papa.unparse(result);
        const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
        saveAs(blob, "gene_meta_export.csv");
    };

    const handleDownloadPDF = (isViolins, format) => {
        if (isViolins) {
            const plotId = 'geneview-gene-plot'; // this should match the id of your plot container
            const plotElement = document.getElementById(plotId);

            if (!plotElement) {
                toast.error("Plot element not found");
                return;
            }

            Plotly.downloadImage(plotElement, {
                format: format,
                filename: `StackedViolin.${group}.Zeros_${includeZeros}`,
            });
        }else {
            const plotId = 'stacked_violin_div'; // this should match the id of your plot container
        }
    };

    return (
        <>
            <div className="gene-meta-controls">
                <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                    <Typography>Without Zeros</Typography>
                    <Switch
                        checked={includeZeros}
                        onChange={() => setIncludeZeros(prev => !prev)}
                        color="primary"
                    />
                    <Typography>With Zeros</Typography>
                    <div>&nbsp;&nbsp;</div>
                    <button onClick={handleDownload} className="download-button">
                        Download CSV
                    </button>
                    <div>&nbsp;&nbsp;</div>
                    { isCat && (<button onClick={() => handleDownloadPDF(isCat,"svg")} className="download-button">Export SVG</button>)}
                    <div>&nbsp;&nbsp;</div>
                    { isCat && (<button onClick={() => handleDownloadPDF(isCat,"png")} className="download-button">Export PNG</button>)}

                </Stack>
            </div>

            {isCat ? (
                isUsingPseudobulk ? (
                    <div id="stacked_violin_div" className={`violin-container`}>
                        <div key="stacked_violin" className="violin-item">
                            <div className="violin-wrapper">
                                {processedMetaData && (
                                    <PlotlyStackedViolin
                                        gene={"stackedviolin"}
                                        exprData={processedExprData}
                                        metaData={processedMetaData}
                                        group={group}
                                        includeZeros={includeZeros}
                                        mainCluster = {mainCluster}
                                        datasetId = {datasetId}
                                        type="boxplot"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div id="stacked_violin_div" className={`violin-container`}>
                        <div key="stacked_violin" className="violin-item">
                            <div className="violin-wrapper">
                                {processedMetaData && (
                                    <PlotlyStackedViolin
                                        gene={"stackedviolin"}
                                        exprData={processedExprData}
                                        metaData={processedMetaData}
                                        group={group}
                                        includeZeros={includeZeros}
                                        mainCluster = {mainCluster}
                                        datasetId = {datasetId}
                                        type="violin"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <div id="meta_scatter_div" className={`umap-container ${plotClass}`}>
                    {Object.entries(processedExprData).map(([gene, expr_data]) => (
                        <div key={gene} className="umap-item">
                            <div className="umap-wrapper">
                                {processedMetaData && (
                                    <EChartMetaScatter
                                        gene={gene}
                                        exprData={expr_data}
                                        metaData={processedMetaData}
                                        group={group}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

GeneMetaPlots.propTypes = {
    geneList: PropTypes.array.isRequired,
    sampleList: PropTypes.array.isRequired,
    exprData: PropTypes.object.isRequired,
    cellMetaData: PropTypes.object.isRequired,
    sampleMetaData: PropTypes.object.isRequired,
    CellMetaMap: PropTypes.object.isRequired,
    group: PropTypes.string.isRequired,
    exprValueType: PropTypes.string.isRequired,
    mainCluster: PropTypes.string.isRequired,
    datasetId: PropTypes.string.isRequired
};

export default GeneMetaPlots;
