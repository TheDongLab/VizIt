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
    Grid,
} from "@mui/material"
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot"
import {useSearchParams} from "react-router-dom"

import useClusterStore from "../../store/ClusterStore.js"
import useSampleGeneMetaStore from "../../store/SampleGeneMetaStore.js"
import useDataStore from "../../store/DatatableStore.js"

import UMAPPlot from "./UMAPPlot.jsx"
import DotPlot2 from "./DotPlot2.jsx"
import BarPlot from "./BarPlot.jsx"
import HeatmapPlot2 from "./HeatmapPlot2.jsx"

import "./ClustersView.css"

function ClustersView() {
    // Get all the pre-selected values
    const [queryParams, setQueryParams] = useSearchParams()
    const initialClusters = queryParams.getAll("cluster") || []
    const initialDataset = queryParams.get("dataset") ?? ""

    const [selectedDataset, setSelectedDataset] = useState(initialDataset)

    const {datasetRecords, fetchDatasetList} = useDataStore()

    // Prepare all the data
    const {setDataset, umapData, fetchUMAPData, selectedMetaData, fetchSelectedMetaData} = useSampleGeneMetaStore()

    const {selectedClusters, setSelectedClusters} = useClusterStore()
    const {clusterList, fetchClusterList, markerGenes, fetchMarkerGenes} = useClusterStore()
    const {cellCounts, fetchCellCounts, diffExpGenes, fetchDiffExpGenes} = useClusterStore()
    const {fetchMainClusterInfo, mainCluster, getMainCluster} = useClusterStore()
    const {loading, error, metadataLoading} = useClusterStore()

    const [clusterSearchText, setClusterSearchText] = useState("")
    const [datasetSearchText, setDatasetSearchText] = useState("")

    useEffect(() => {
        fetchDatasetList()
        fetchMainClusterInfo(selectedDataset);

        // Set initial clusters from URL only once on first load
        if (initialClusters.length) {
            setSelectedClusters(initialClusters)
        }
    }, [])

    // Main data fetches (control loading state)
    const fetchPrimaryData = async () => {
        await fetchMainClusterInfo(selectedDataset)
        const mainCluster = await getMainCluster() // update the mainCluster

        useClusterStore.setState({clusterList: []}) // clear the clusterList

        await fetchUMAPData(selectedDataset)
        await fetchSelectedMetaData(selectedDataset, [mainCluster])
        await fetchClusterList(selectedDataset)
    }
    useEffect(() => {
        fetchPrimaryData(initialClusters)
    }, [selectedDataset])

    // Filter qtl datasets
    const datasetOptions = datasetRecords
    .filter((d) => !d.assay.toLowerCase().endsWith("qtl"))
    .map((d) => d.dataset_id);

    useEffect(() => {
        setDataset(selectedDataset)
        fetchMarkerGenes(selectedDataset) // Fetch marker genes for selected clusters
        fetchCellCounts(selectedDataset)
        fetchDiffExpGenes(selectedDataset)
    }, [selectedDataset])

    /** Updates the query parameters in the URL */
    const updateQueryParams = (clusters, dataset) => {
        const newParams = new URLSearchParams()
        dataset && newParams.set("dataset", dataset)
        clusters.forEach((cluster) => newParams.append("cluster", cluster))
        setQueryParams(newParams)
    }

    /** Handles dataset selection change */
    const handleDatasetChange = (event, newValue) => {
        // Clear selected clusters
        setSelectedClusters([])
        setDataset(newValue)
        setSelectedDataset(newValue)
        updateQueryParams([], newValue)
    }

    /** Handles cluster selection change */
    const handleClusterChange = (event, newValue) => {
        setSelectedClusters(newValue)
        updateQueryParams(newValue, selectedDataset)
        fetchMarkerGenes(selectedDataset)
        fetchDiffExpGenes(selectedDataset)
    }

    const handleClusterDelete = (delCluster) => {
        const newClusters = selectedClusters.filter((ct) => ct !== delCluster)
        setSelectedClusters(newClusters)
        updateQueryParams(newClusters, selectedDataset)
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

    const isAllClustersSelected = selectedClusters.includes("all")

    return (
        <div className="plot-page-container">
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h6">Cluster Analysis</Typography>
            </Box>
            <Divider/>
            <div className="plot-content">
                {/* Left Panel for Dataset & Cell Type Selection (25%) */}
                <div className="plot-panel">
                    <Typography variant="subtitle1">Select Datasets & Clusters</Typography>

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
                        options={clusterList}
                        value={selectedClusters}
                        onChange={handleClusterChange}
                        inputValue={clusterSearchText}
                        onInputChange={(event, newInputValue) => {
                            setClusterSearchText(newInputValue)
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
                                        onDelete={() => handleClusterDelete(option)}
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

                    {selectedDataset === "" || selectedDataset === null ? (
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
                                                    selectedClusters={selectedClusters}
                                                    isAllClustersSelected={isAllClustersSelected}
                                                    mainCluster={mainCluster}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedClusters.length > 0 && <div className="plot-section" id="marker-genes-section">
                                <Divider sx={{marginTop: "10px"}} flexItem>Marker Genes</Divider>
                                <div className="dot-container">
                                    {markerGenes && (
                                        <DotPlot2
                                            markerGenes={markerGenes}
                                            selectedClusters={selectedClusters}
                                            isAllClustersSelected={isAllClustersSelected}
                                            mainCluster={mainCluster}
                                            datasetId={selectedDataset}
                                        />
                                    )}
                                </div>
                            </div>}

                            {selectedClusters.length > 0 && <div className="plot-section" id="cell-counts-deg-section">
                                <Divider sx={{marginTop: "10px"}} flexItem>Cell Counts & Differential
                                    Expression</Divider>
                                <Grid container spacing={2} className="bottom-plots-container">
                                    <Grid item xs={12} md={6}>
                                        {cellCounts && selectedClusters.length > 0 && (
                                            <BarPlot cellCounts={cellCounts} selectedClusters={selectedClusters}/>)
                                        }
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        {diffExpGenes && selectedClusters.length > 0 && (
                                            <HeatmapPlot2 diffExpGenes={diffExpGenes}
                                                          selectedClusters={selectedClusters}/>
                                        )}
                                    </Grid>
                                </Grid>
                            </div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ClustersView

