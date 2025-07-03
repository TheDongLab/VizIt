"use client"

import {useEffect, useState} from "react"
import {
    Typography,
    Box,
    Divider,
    Autocomplete,
    Chip,
    TextField,
    Button,
    LinearProgress,
    InputLabel,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material"
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot"
import {useSearchParams} from "react-router-dom"

import useSampleGeneMetaStore from "../../store/SampleGeneMetaStore.js"

import EChartScatterPlot from "./EChartScatter.jsx"
import GeneMetaPlots from "./GenePlots.jsx"

import "./GeneView.css"
import useDataStore from "../../store/DatatableStore.js"

function GeneView() {
    // Get all the pre-selected values
    const [queryParams, setQueryParams] = useSearchParams()
    const initialGenes = queryParams.getAll("gene")
    const initialSamples = queryParams.getAll("sample") ?? ["all"]
    const initialColoring = queryParams.get("color") ?? ""
    const initialGrouping = queryParams.get("group") ?? ""
    const initialDataset = queryParams.get("dataset") ?? ""

    const {datasetRecords, fetchDatasetList} = useDataStore()
    useEffect(() => {
        fetchDatasetList()
    }, [])

    const datasetOptions = datasetRecords.map((d) => d.dataset_id)

    const [datasetId, setDatasetId] = useState(initialDataset)
    const [datasetSearchText, setDatasetSearchText] = useState("")

    // Prepare all the  data
    const {
        setDataset,
        geneList,
        fetchGeneList,
        sampleList,
        fetchSampleList,
        metaList,
        fetchMetaList,
        umapData,
        fetchUMAPData,
    } = useSampleGeneMetaStore()

    const {selectedSamples, setSelectedSamples, selectedGenes, setSelectedGenes} = useSampleGeneMetaStore()
    const {allCellMetaData, fetchAllMetaData, exprDataDict, fetchExprData} = useSampleGeneMetaStore()
    const {allSampleMetaData, CellMetaMap} = useSampleGeneMetaStore()
    const {metadataLoading, loading, error} = useSampleGeneMetaStore()
    const [coloring, setColoring] = useState(initialColoring)
    const [grouping, setGrouping] = useState(initialGrouping)

    const [exprValueType, setExprValueType] = useState("celllevel")

    useEffect(() => {
        // Load these in parallel immediately
        const fetchPrimaryData = async () => {
            await fetchUMAPData(datasetId);
            await fetchGeneList(datasetId)
            await fetchSampleList(datasetId)
            await fetchMetaList(datasetId)
            await fetchExprData(datasetId);
            await fetchAllMetaData(datasetId);
        }
        fetchPrimaryData()
    }, [datasetId])

    const sampleOptions = sampleList.map((sample) => sample)
    sampleOptions.unshift("all")

    const [geneSearchText, setGeneSearchText] = useState("")
    const [sampleSearchText, setSampleSearchText] = useState("")

    useEffect(() => {
        const initialSelectedSamples = initialSamples.length ? initialSamples : []
        const initialSelectedGenes = initialGenes.length ? initialGenes : []

        setDataset(datasetId)

        useSampleGeneMetaStore.setState({
            selectedSamples: initialSelectedSamples,
            selectedGenes: initialSelectedGenes,
        })
    }, [])

    // useEffect(() => {
    //     fetchExprData(datasetId);
    //     fetchAllMetaData(datasetId);
    // }, [datasetId])

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (geneSearchText.length >= 3) {
                fetchGeneList(datasetId, geneSearchText)
            }
        }, 300) // adjust debounce delay if needed

        return () => clearTimeout(delayDebounce)
    }, [geneSearchText, datasetId])

    /** Updates the query parameters in the URL */
    const updateQueryParams = (dataset, genes, samples, color = null, group = null) => {
        const newParams = new URLSearchParams()
        dataset && newParams.set("dataset", dataset)
        genes.forEach((gene) => newParams.append("gene", gene))
        samples.forEach((sample) => newParams.append("sample", sample))
        if (color) newParams.append("color", color)
        if (group) newParams.append("group", group)
        setQueryParams(newParams)
    }

    const handleDatasetChange = (event, newValue) => {
        setDataset(newValue)
        setDatasetId(newValue)
        updateQueryParams(newValue, selectedGenes, selectedSamples)
    }

    /** Handles sample selection change */
    const handleSampleChange = (event, newValue) => {
        setSelectedSamples(newValue)
        updateQueryParams(datasetId, selectedGenes, newValue) // Pass the new value instead of old state
    }

    /** Handles gene selection change */
    const handleGeneChange = (event, newValue) => {
        setSelectedGenes(newValue)
        updateQueryParams(datasetId, newValue, selectedSamples) // Pass the new value instead of old state
        fetchExprData()
    }

    const handleGeneDelete = (delGene) => {
        const newGenes = selectedGenes.filter((g) => g !== delGene)
        setSelectedGenes(newGenes)
        updateQueryParams(datasetId, newGenes, selectedSamples)
        fetchExprData(datasetId)
    }

    // click the button to fetch umap data
    const handleLoadPlot = () => {
        setDataset(datasetId)
        fetchAllMetaData(datasetId)
        fetchExprData(datasetId)
    }

    const handleGroupingChange = (event) => {
        setGrouping(event.target.value)
        updateQueryParams(datasetId, selectedGenes, selectedSamples, coloring, event.target.value)
    }

    const handleColoringChange = (event) => {
        setColoring(event.target.value)
        updateQueryParams(datasetId, selectedGenes, selectedSamples, event.target.value, grouping)
    }

    const handleExprValueTypeChange = (event) => {
        setExprValueType(event.target.value)
    }

    const plotClass =
        selectedGenes.length <= 1
            ? "single-plot"
            : selectedGenes.length === 2
                ? "two-plots"
                : selectedGenes.length === 3
                    ? "three-plots"
                    : "four-plots"

    const excludedKeys = new Set(["cs_id", "sample_id", "Cell", "Spot", "UMAP_1", "UMAP_2"])

    // console.log("selectedGenes", selectedGenes, CellMetaMap, allCellMetaData, allSampleMetaData);

    return (
        <div className="plot-page-container" style={{display: "flex", flexDirection: "column", flex: 1}}>
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h6">Exploration of Gene Expression</Typography>
            </Box>
            <Divider/>
            <div className="plot-content">
                {/* Right Panel for Sample & Gene Selection (20%) */}
                <div className="plot-panel">
                    <Typography variant="subtitle1">Select a Dataset </Typography>
                    {/* Dataset Selection */}
                    <Autocomplete
                        size="small"
                        options={datasetOptions}
                        value={datasetId}
                        onChange={handleDatasetChange}
                        inputValue={datasetSearchText}
                        onInputChange={(event, newInputValue) => setDatasetSearchText(newInputValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Dataset" variant="standard" style={{marginBottom: "30px"}}/>
                        )}
                    />
                    <Typography variant="subtitle1">Select Samples & Genes</Typography>

                    {/* Gene Selection with Fuzzy Search & Chips */}
                    <Autocomplete
                        multiple
                        size="small"
                        options={geneList}
                        value={selectedGenes}
                        onChange={handleGeneChange}
                        inputValue={geneSearchText}
                        onInputChange={(event, newInputValue) => {
                            setGeneSearchText(newInputValue)
                        }}
                        noOptionsText={"Input 3 letters to search"}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const {key, ...tagProps} = getTagProps({index})
                                return (
                                    <Chip
                                        key={`${key}-${option}`}
                                        label={option}
                                        {...tagProps}
                                        color="primary"
                                        onDelete={() => handleGeneDelete(option)}
                                    />
                                )
                            })
                        }
                        renderInput={(params) => <TextField {...params} label="Search Gene" variant="standard"/>}
                    />

                    {/* Sample Selection */}
                    <Autocomplete
                        multiple
                        size="small"
                        options={sampleOptions}
                        value={selectedSamples}
                        onChange={handleSampleChange}
                        inputValue={sampleSearchText}
                        onInputChange={(event, newInputValue) => setSampleSearchText(newInputValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const {key, ...tagProps} = getTagProps({index})
                                return (
                                    <Chip
                                        key={`${key}-${option}`}
                                        label={option}
                                        {...tagProps}
                                        color="primary"
                                        onDelete={() => {
                                            const newSamples = selectedSamples.filter((s) => s !== option)
                                            setSelectedSamples(newSamples)
                                            updateQueryParams(datasetId, selectedGenes, newSamples)
                                        }}
                                    />
                                )
                            })
                        }
                        renderInput={(params) => (
                            <TextField {...params} label="Search Sample" variant="standard"
                                       style={{margin: "10px 0px"}}/>
                        )}
                    />

                    <Typography sx={{marginTop: "10px", marginLeft: "20px"}} variant="subtitle1">Change plotting
                        options:</Typography>
                    {selectedGenes.length === 0 ? (
                        // *a dropdown to select the options on how to color the plot*/
                        <Box sx={{display: "flex", justifyContent: "start", marginBottom: "10px", marginLeft: "20px"}}>
                            <FormControl variant="standard" sx={{width: "100%"}}>
                                <InputLabel id="coloring-label">UMAP coloring</InputLabel>
                                <Select
                                    labelId="coloring-label"
                                    id="coloring-select"
                                    value={coloring}
                                    onChange={handleColoringChange}
                                    size="small"
                                    variant="standard"
                                >
                                    {metaList && metaList.length > 0 ? (
                                        metaList
                                        .filter((option) => !excludedKeys.has(option)) // Remove excluded keys first
                                        .map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))
                                    ) : (<MenuItem
                                        disabled>{loading ? "Loading metadata..." : "No metadata available"}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    ) : (
                        /*a dropdown to select the options on how to group the data*/
                        <>
                            <Box sx={{
                                display: "flex",
                                justifyContent: "start",
                                marginBottom: "10px",
                                marginLeft: "20px",
                            }}>
                                <FormControl variant="standard" sx={{width: "100%"}}>
                                    <InputLabel id="grouping-label">Gene grouping</InputLabel>
                                    <Select
                                        labelId="grouping-label"
                                        id="grouping-select"
                                        value={grouping}
                                        onChange={handleGroupingChange}
                                        size="small"
                                        variant="standard">
                                        {metaList && metaList.length > 0 ? (
                                            metaList.map((option) => {
                                                if (excludedKeys.has(option)) return null
                                                return (<MenuItem key={option} value={option}>{option}</MenuItem>)
                                            })
                                        ) : (<MenuItem
                                            disabled>{loading ? "Loading metadata..." : "No metadata available"}</MenuItem>)
                                        }
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{
                                display: "flex",
                                justifyContent: "start",
                                marginBottom: "10px",
                                marginLeft: "20px"
                            }}>
                                <FormControl variant="standard" sx={{width: "100%"}}>
                                    <InputLabel id="valuetype-select-label">Value type</InputLabel>
                                    <Select labelId="valuetype-select-label" id="valuetype-select" value={exprValueType}
                                            label="Value type" onChange={handleExprValueTypeChange}>
                                        <MenuItem value={"celllevel"}>Cell level values</MenuItem>
                                        <MenuItem value={"pseudobulk"}>Sample level pseudobulks</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </>
                    )}

                    {/* a button to fetch data and a loading indicator*/}
                    <Box sx={{display: "flex", justifyContent: "center", margin: "20px 0px"}}>
                        <Button variant="outlined" endIcon={<ScatterPlotIcon/>} disabled={loading}
                                onClick={handleLoadPlot}>
                            {loading ? "Loading plots..." : "Load Metadata / Refresh Plots"}
                        </Button>
                    </Box>
                </div>

                {/* Left UMAP Plot Area (80%) */}
                <div className="plot-main">
                    {(metadataLoading || loading) && (<Box sx={{width: "100%"}}><LinearProgress/></Box>)}

                    {datasetId === "" || datasetId === null || datasetId === undefined ? (
                        <Typography sx={{color: "text.secondary", paddingTop: "100px"}} variant="h5">
                            Please select a dataset to view
                        </Typography>
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : Object.keys(exprDataDict).length > 0 ? (
                        <>
                            <Divider sx={{marginTop: "10px"}}>UMAP Plots</Divider>
                            <div className={`umap-container ${plotClass}`}>
                                {Object.entries(exprDataDict).map(([gene, expr_data]) => (
                                    <div key={gene} className="umap-item">
                                        <div className="umap-wrapper">
                                            {(umapData && allCellMetaData) && (
                                                <EChartScatterPlot
                                                    gene={gene}
                                                    sampleList={selectedSamples}
                                                    umapData={umapData}
                                                    exprData={expr_data}
                                                    cellMetaData={allCellMetaData ?? {}}
                                                    CellMetaMap={CellMetaMap ?? {}}
                                                    sampleMetaData={allSampleMetaData ?? {}}
                                                    group={coloring}
                                                    isMetaDataLoading={metadataLoading}
                                                />
                                            )}
                                            {/*{umapData && <PlotlyScatterPlot gene={gene} sampleList={selectedSamples} umapData={umapData} exprData={expr_data} cellMetaData={allCellMetaData} group={coloring}/>}*/}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {Object.keys(exprDataDict).length >= 1 && (
                                <Divider sx={{marginTop: "10px"}} flexItem>Gene Expression Plots</Divider>
                            )}

                            {/*gene expression/meta plot*/}
                            {allCellMetaData && (
                                <GeneMetaPlots
                                    geneList={selectedGenes}
                                    sampleList={selectedSamples}
                                    exprData={exprDataDict}
                                    cellMetaData={allCellMetaData}
                                    sampleMetaData={allSampleMetaData}
                                    CellMetaMap={CellMetaMap}
                                    group={grouping}
                                    exprValueType={exprValueType}
                                />
                            )}
                        </>
                    ) : (
                        <div className={`umap-container single-plot`}>
                            <div key={"all_gene"} className="umap-item">
                                <div className="umap-wrapper">
                                    {umapData && (
                                        <EChartScatterPlot
                                            gene={"all"}
                                            sampleList={selectedSamples}
                                            umapData={umapData}
                                            exprData={{all: "all"}}
                                            cellMetaData={allCellMetaData ?? {}}
                                            CellMetaMap={CellMetaMap ?? {}}
                                            sampleMetaData={allSampleMetaData ?? {}}
                                            group={coloring}
                                            isMetaDataLoading={metadataLoading}
                                        />
                                    )}

                                    {/*{umapData && <PlotlyScatterPlot gene={"all"}*/}
                                    {/*                                sampleList={selectedSamples}*/}
                                    {/*                                umapData={umapData} exprData={{"all": "all"}}*/}
                                    {/*                                cellMetaData={allCellMetaData ?? {}}*/}
                                    {/*                                group={coloring}/>}*/}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GeneView
