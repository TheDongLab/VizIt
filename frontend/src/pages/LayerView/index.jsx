"use client"

import {useEffect, useState} from "react"
import {
    Typography,
    Box,
    Divider,
    CircularProgress,
    Autocomplete,
    Chip,
    TextField,
    Button,
    LinearProgress,
    Grid,
} from "@mui/material"
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot"
import {useSearchParams} from "react-router-dom"

import useCellTypeStore from "../../store/CellTypeStore.js"
import useSampleGeneMetaStore from "../../store/SampleGeneMetaStore.js"
import useDataStore from "../../store/DatatableStore.js"

import UMAPPlot from "./UMAPPlot.jsx"
import DotPlot2 from "./DotPlot2.jsx"
import BarPlot from "./BarPlot.jsx"
import HeatmapPlot2 from "./HeatmapPlot2.jsx"

import "./CellTypesView.css"

function LayerView() {
    // Get all the pre-selected values
    const [queryParams, setQueryParams] = useSearchParams()
    const initialCellTypes = queryParams.getAll("celltype")
    const initialDataset = queryParams.get("dataset") ?? ""

    const [selectedDataset, setSelectedDataset] = useState(initialDataset)

    const {datasetRecords, fetchDatasetList} = useDataStore()

    // Prepare all the data
    const {setDataset, umapData, fetchUMAPData, selectedMetaData, fetchSelectedMetaData} = useSampleGeneMetaStore()

    const {selectedCellTypes, setSelectedCellTypes} = useCellTypeStore()
    const {cellTypeList, fetchCellTypeList, markerGenes, fetchMarkerGenes} = useCellTypeStore()
    const {cellCounts, fetchCellCounts, diffExpGenes, fetchDiffExpGenes} = useCellTypeStore()
    const {fetchMainClusterInfo, mainCluster, getMainCluster} = useCellTypeStore()
    const {loading, error, metadataLoading} = useCellTypeStore()

    const [cellTypeSearchText, setCellTypeSearchText] = useState("")
    const [datasetSearchText, setDatasetSearchText] = useState("")

    useEffect(() => {
        fetchDatasetList()
        fetchMainClusterInfo(selectedDataset);
    }, [])

    useEffect(() => {
        // Main data fetches (control loading state)
        const fetchPrimaryData = async () => {
            await fetchMainClusterInfo(selectedDataset)
            // update the mainCluster
            const mainCluster = await getMainCluster()
            await fetchUMAPData(selectedDataset)
            await fetchSelectedMetaData(selectedDataset, [mainCluster])
            await fetchCellTypeList(selectedDataset)
        }

        fetchPrimaryData()
    }, [selectedDataset])

    const datasetOptions = []
    datasetRecords.map((d) => {
        if (d.assay.toLowerCase() === "visiumst") {
            datasetOptions.push(d.dataset_id)
        }
    })

    useEffect(() => {
        const initialSelectedCellTypes = initialCellTypes.length ? initialCellTypes : []

        setDataset(selectedDataset)

        useCellTypeStore.setState({
            selectedCellTypes: initialSelectedCellTypes,
        })

        fetchMarkerGenes(selectedDataset) // Fetch marker genes for selected cell types
        fetchCellCounts(selectedDataset)
        fetchDiffExpGenes(selectedDataset)
    }, [selectedDataset])

    /** Updates the query parameters in the URL */
    const updateQueryParams = (cellTypes, dataset) => {
        const newParams = new URLSearchParams()
        dataset && newParams.set("dataset", dataset)
        cellTypes.forEach((cellType) => newParams.append("celltype", cellType))
        setQueryParams(newParams)
    }

    /** Handles dataset selection change */
    const handleDatasetChange = (event, newValue) => {
        setDataset(newValue)
        setSelectedDataset(newValue)
        updateQueryParams(selectedCellTypes, newValue)
    }

    /** Handles cell type selection change */
    const handleCellTypeChange = (event, newValue) => {
        setSelectedCellTypes(newValue)
        updateQueryParams(newValue, selectedDataset)
        fetchMarkerGenes(selectedDataset)
        fetchDiffExpGenes(selectedDataset)
    }

    const handleCellTypeDelete = (delCellType) => {
        const newCellTypes = selectedCellTypes.filter((ct) => ct !== delCellType)
        setSelectedCellTypes(newCellTypes)
        updateQueryParams(newCellTypes, selectedDataset)
        fetchMarkerGenes(selectedDataset)
        fetchDiffExpGenes(selectedDataset)
    }

    // click the button to fetch umap data
    const handleLoadPlot = () => {
        setDataset(selectedDataset)
        fetchMarkerGenes(selectedDataset)
        fetchCellCounts(selectedDataset)
        fetchDiffExpGenes(selectedDataset)
    }

    const isAllCellTypesSelected = selectedCellTypes.includes("all")

    return (
        <div className="plot-page-container">
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h6">Brain Cortex Layers</Typography>
            </Box>
            <Divider/>
            <div className="plot-content">
                {/* Left Panel for Dataset & Cell Type Selection (25%) */}
                <div className="plot-panel">
                    <Typography variant="subtitle1">Select Datasets & Layers</Typography>

                    {/* Dataset Selection */}
                    <Autocomplete
                        size="small"
                        options={datasetOptions}
                        value={selectedDataset}
                        onChange={handleDatasetChange}
                        inputValue={datasetSearchText}
                        onInputChange={(event, newInputValue) => setDatasetSearchText(newInputValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Dataset" variant="standard"
                                       style={{margin: "10px 0px"}}/>
                        )}
                    />

                    {/* Cell Type Selection with Fuzzy Search & Chips */}
                    <Autocomplete
                        multiple
                        size="small"
                        options={cellTypeList}
                        value={selectedCellTypes}
                        onChange={handleCellTypeChange}
                        inputValue={cellTypeSearchText}
                        onInputChange={(event, newInputValue) => {
                            setCellTypeSearchText(newInputValue)
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const {key, ...tagProps} = getTagProps({index})
                                return (
                                    <Chip
                                        key={`${key}-${option}`}
                                        label={option}
                                        {...tagProps}
                                        color="primary"
                                        onDelete={() => handleCellTypeDelete(option)}
                                    />
                                )
                            })
                        }
                        renderInput={(params) => <TextField {...params} label="Select a cluster" variant="standard"/>}
                    />

                    {/* a button to fetch data and a loading indicator*/}
                    <Box sx={{display: "flex", justifyContent: "center", margin: "20px 0px"}}>
                        <Button variant="outlined" endIcon={<ScatterPlotIcon/>} disabled={loading}
                                onClick={handleLoadPlot}>
                            {loading ? "Loading plots..." : "Refresh Plots"}
                        </Button>
                    </Box>
                </div>

                {/* Right Plot Area (75%) */}
                <div className="plot-main">
                    {(loading || metadataLoading) && (
                        <>
                            <Box sx={{width: "100%"}}><LinearProgress/></Box>
                            {/*<Box sx={{display: "flex", justifyContent: "center", paddingTop: "100px"}}>*/}
                            {/*    <CircularProgress/>*/}
                            {/*</Box>*/}
                            {/*<Box sx={{display: "flex", justifyContent: "center", paddingTop: "10px"}}>*/}
                            {/*    <Typography sx={{marginLeft: "10px", color: "text.secondary"}} variant="h5">*/}
                            {/*        Loading data...*/}
                            {/*    </Typography>*/}
                            {/*</Box>*/}
                        </>
                    )}

                    {selectedDataset === "" ? (
                        <Typography sx={{color: "text.secondary", paddingTop: "100px"}} variant="h5">
                            No dataset selected for exploration
                        </Typography>
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : (
                        <>
                            <div className="plot-section" id="umap-section">
                                <Typography variant="p" sx={{marginTop: "10px"}}>UMAP Visualization</Typography>
                                <div className="umap-container single-plot">
                                    <div className="umap-item">
                                        <div className="umap-wrapper">
                                            {umapData && (
                                                <UMAPPlot
                                                    umapData={umapData}
                                                    metaData={selectedMetaData}
                                                    selectedCellTypes={selectedCellTypes}
                                                    isAllCellTypesSelected={isAllCellTypesSelected}
                                                    mainCluster={mainCluster}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="plot-section" id="marker-genes-section">
                                <Divider sx={{marginTop: "10px"}} flexItem>Marker Genes</Divider>
                                <div className="dot-container">
                                    {markerGenes && (
                                        <DotPlot2
                                            markerGenes={markerGenes}
                                            selectedCellTypes={selectedCellTypes}
                                            isAllCellTypesSelected={isAllCellTypesSelected}
                                            mainCluster={mainCluster}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="plot-section" id="cell-counts-deg-section">
                                <Divider sx={{marginTop: "10px"}} flexItem>Spot Counts & Differential Expression</Divider>
                                <Grid container spacing={2} className="bottom-plots-container">
                                    <Grid item xs={12} md={6}>
                                        {cellCounts && selectedCellTypes.length > 0 && (
                                            <BarPlot cellCounts={cellCounts} selectedCellTypes={selectedCellTypes}/>)
                                        }
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        {diffExpGenes && selectedCellTypes.length > 0 && (
                                            <HeatmapPlot2 diffExpGenes={diffExpGenes}
                                                          selectedCellTypes={selectedCellTypes}/>
                                        )}
                                    </Grid>
                                </Grid>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LayerView

