"use client"

import {useEffect, useState} from "react"
import {
    Typography,
    Box,
    Divider,
    Chip,
    IconButton,
    Paper,
    TextField,
    CircularProgress,
    Autocomplete,
    Tooltip,
    FormControl,
    Select,
    MenuItem, // Import MenuItem
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import RefreshIcon from "@mui/icons-material/Refresh"
import {useSearchParams} from "react-router-dom"

import useSampleGeneMetaStore from "../../store/SampleGeneMetaStore.js"
import useDataStore from "../../store/DatatableStore.js"
import {toast} from "react-toastify"
import PlotlyFeaturePlot from "../VisiumView/VisiumPlotlyPlot.jsx"

import "./XDatasets.css"
import EChartScatterPlot from "../GeneView/EChartScatter.jsx"

function getDatasetType(datasetRecords, datasetId) {
    for (const dataset of datasetRecords) {
        if (dataset.dataset_id === datasetId) {
            return dataset.assay.toLowerCase()
        }
    }
    return undefined
}

function XDatasetsView() {
    // Create a state for plotData to ensure it triggers re-renders when updated
    const [plotData, setPlotData] = useState({})
    const [featureOptions, setFeatureOptions] = useState({})

    // Near the top where other state variables are defined
    const [featureSearchLoading, setFeatureSearchLoading] = useState({})

    const [queryParams, setQueryParams] = useSearchParams()

    // State for managing multiple datasets - initialize with TWO empty datasets
    const [datasets, setDatasets] = useState([
        {
            id: queryParams.get("dataset0") || "",
            sample: queryParams.get("sample0") || "",
            features: queryParams.getAll("features0") || [],
            plotType: queryParams.get("plottype0") || "umap", // auto, umap, visium
            isLoading: false, // Track loading state for each dataset
        },
        {
            id: queryParams.get("dataset1") || "",
            sample: queryParams.get("sample1") || "",
            features: queryParams.getAll("features1") || [],
            plotType: queryParams.get("plottype1") || "umap", // auto, umap, visium
            isLoading: false, // Track loading state for each dataset
        },
    ])

    // Store access
    const {datasetRecords, fetchDatasetList} = useDataStore()
    const {
        fetchGeneList, fetchSampleList, fetchMetaList, setDataset, loading, error,
        fetchUMAPData, fetchExprData,fetchAllMetaData, fetchMetaDataOfSample, fetchImageData, metadataLoading
    } = useSampleGeneMetaStore();

    // Load initial data
    useEffect(() => {
        fetchDatasetList()

        // Initialize from URL params if available
        const urlDatasets = []
        let i = 0
        while (queryParams.get(`dataset${i}`) !== null) {
            urlDatasets.push({
                id: queryParams.get(`dataset${i}`) || "",
                sample: queryParams.get(`sample${i}`) || "",
                features: queryParams.getAll(`features${i}`) || [],
                plotType: queryParams.get(`plottype${i}`) || "umap",
                isLoading: false,
            })
            i++
            if (i >= 3) break
        }

        // If we have URL datasets, use them; otherwise keep our default two columns
        if (urlDatasets.length > 0) {
            if (urlDatasets.length === 1) {
                // show at least two datasets
                urlDatasets.push({id: "", sample: "", features: [], plotType: "umap", isLoading: false})
            }
            setDatasets(urlDatasets)
        }
    }, [])

    // Check if a dataset has been loaded
    const isDatasetLoaded = (datasetId) => {
        if (!datasetId) return false

        const data = plotData[datasetId]
        // return !!(data?.genelist && data?.samplelist && data?.metalist && data?.allCellMetaData && data?.umapdata)
        return (
            data &&
            data.genelist &&
            data.samplelist &&
            data.metalist &&
            data.umapdata &&
            data.allCellMetaData
        )
    }

    // Direct data loading function with request deduplication
    const loadDatasetData = async (index) => {
        const datasetId = datasets[index]?.id
        // Skip if no dataset ID
        if (!datasetId) {
            return
        }

        console.log(`Loading data for dataset ${datasetId}`)

        try {
            // Set the current dataset in the store ONLY for this operation
            await setDataset(datasetId)

            // Fetch gene list if not already loaded
            if (!plotData[datasetId]?.genelist) {
                await fetchGeneList(datasetId)

                // Store the actual data from the store
                const storeGeneList = useSampleGeneMetaStore.getState().geneList

                setPlotData((prevData) => ({
                    ...prevData,
                    [datasetId]: {
                        ...prevData[datasetId],
                        genelist: storeGeneList,
                    },
                }))
            }

            // Fetch sample list if not already loaded
            if (!plotData[datasetId]?.samplelist) {
                await fetchSampleList(datasetId)

                // Store the actual data from the store
                const storeSampleList = useSampleGeneMetaStore.getState().sampleList

                setPlotData((prevData) => ({
                    ...prevData,
                    [datasetId]: {
                        ...prevData[datasetId],
                        samplelist: storeSampleList,
                    },
                }))
            }

            // Fetch meta list if not already loaded
            if (!plotData[datasetId]?.metalist) {
                await fetchMetaList(datasetId)

                // Store the actual data from the store
                const storeMetaList = useSampleGeneMetaStore.getState().metaList

                setPlotData((prevData) => ({
                    ...prevData,
                    [datasetId]: {
                        ...prevData[datasetId],
                        metalist: storeMetaList,
                    },
                }))
            }

            // Fetch UMAP data if selected and not already loaded
            if (datasets[index].plotType === "umap") {
                if (!plotData[datasetId]?.umapdata) {
                    await fetchUMAPData(datasetId)

                    // Store the actual data from the store
                    const storeUMAPData = useSampleGeneMetaStore.getState().umapData

                    setPlotData((prevData) => ({
                        ...prevData,
                        [datasetId]: {
                            ...prevData[datasetId],
                            umapdata: storeUMAPData,
                        },
                    }))
                }
            }

            // Only fetch metadata once per dataset
            if (!plotData[datasetId]?.allCellMetaData) {
                await fetchAllMetaData(datasetId, ["all"],["umap"])

                // Store the actual data from the store
                const storeAllCellMetaData = useSampleGeneMetaStore.getState().allCellMetaData;
                const storeCellMetaMap = useSampleGeneMetaStore.getState().CellMetaMap
                const storeAllSampleMetaData = useSampleGeneMetaStore.getState().allSampleMetaData

                await setPlotData((prevData) => ({
                    ...prevData,
                    [datasetId]: {
                        ...prevData[datasetId],
                        allCellMetaData: storeAllCellMetaData,
                        CellMetaMap: storeCellMetaMap,
                        allSampleMetaData: storeAllSampleMetaData,
                    },
                }))
            }
        } catch (error) {
            console.error(`Error loading data for dataset ${datasetId}:`, error)
        }
    }

    // Separate effect for loading sample-specific data
    const loadSampleData = async (index, sample) => {
        const datasetId = datasets[index]?.id
        // Skip if no sample is selected
        if (!sample) return

        try {
            // Get the dataset object
            const dataset = datasets[index]
            if (!dataset) return

            /// Set this dataset as loading
            setDatasets((prevDatasets) => {
                const newDatasets = [...prevDatasets]
                newDatasets[index] = {...newDatasets[index], isLoading: true}
                return newDatasets
            })

            // Ensure meta list is loaded
            let metaList = plotData[datasetId]?.metalist
            if (!metaList || metaList.length === 0) {
                // Set the current dataset in the store ONLY for this operation
                setDataset(datasetId)
                await fetchMetaList(datasetId)
                metaList = useSampleGeneMetaStore.getState().metaList

                // Update plotData with the fetched meta list
                setPlotData((prevData) => ({
                    ...prevData,
                    [datasetId]: {
                        ...prevData[datasetId],
                        metalist: metaList,
                    },
                }))
            }

            // Create a Set for faster lookups
            const metaSet = new Set(metaList)

            // Filter out meta features, keeping only genes
            const geneFeatures = dataset.features.filter((feature) => {
                const isMeta = metaSet.has(feature)
                return !isMeta
            })

            // IMPORTANT: Create a clean store state for this specific dataset operation
            // This is crucial to prevent cross-contamination between datasets
            await setDataset(datasetId)
            useSampleGeneMetaStore.setState({
                selectedSamples: [sample],
                selectedGenes: geneFeatures,
                // Reset any other state that might be shared
                exprDataDict: {},
                sampleMetaDict: {},
                imageDataDict: {},
            })

            // Fetch expression data for this specific dataset
            await fetchExprData(datasetId)
            const currentExprData = {...useSampleGeneMetaStore.getState().exprDataDict}

            // Store the expression data in our plotData state
            setPlotData((prevData) => ({
                ...prevData,
                [datasetId]: {
                    ...prevData[datasetId],
                    exprdict: {...(prevData[datasetId]?.exprdict || {}), ...currentExprData},
                },
            }))

            // Fetch metadata for this specific dataset
            await fetchMetaDataOfSample(datasetId)
            const currentMetaData = {...useSampleGeneMetaStore.getState().sampleMetaDict}

            // Store the metadata in our plotData state
            setPlotData((prevData) => ({
                ...prevData,
                [datasetId]: {
                    ...prevData[datasetId],
                    metadict: {...(prevData[datasetId]?.metadict || {}), ...currentMetaData},
                },
            }))

            // Only fetch image data for Visium datasets
            const effectivePlotType = getEffectivePlotType(datasetId, dataset.plotType)
            if (effectivePlotType === "visium" || effectivePlotType === "both") {
                await fetchImageData(datasetId)
                const currentImageData = {...useSampleGeneMetaStore.getState().imageDataDict}

                // Store the image data in our plotData state
                setPlotData((prevData) => ({
                    ...prevData,
                    [datasetId]: {
                        ...prevData[datasetId],
                        imagedict: {...(prevData[datasetId]?.imagedict || {}), ...currentImageData},
                    },
                }))
            }
            // Set this dataset as not loading
            setDatasets((prevDatasets) => {
                const newDatasets = [...prevDatasets]
                newDatasets[index] = {...newDatasets[index], isLoading: false}
                return newDatasets
            })

        } catch (error) {
            // Set this dataset as not loading even if there's an error
            console.error(`Error loading data for dataset ${datasetId}:`, error)
            setDatasets((prevDatasets) => {
                const newDatasets = [...prevDatasets]
                newDatasets[index] = {...newDatasets[index], isLoading: false}
                return newDatasets
            })
        }
    }


    // Update URL params when state changes
    useEffect(() => {
        const newParams = new URLSearchParams()

        // Add dataset params
        datasets.forEach((d, i) => {
            if (d.id) {
                newParams.set(`dataset${i}`, d.id)
                if (d.sample) {
                    newParams.set(`sample${i}`, d.sample)
                }
                d.features.forEach((f) => {
                    newParams.append(`features${i}`, f)
                })
                newParams.set(`plottype${i}`, d.plotType)
            }
        })

        setQueryParams(newParams)
    }, [datasets])


    // Add this useEffect after the other useEffects
    useEffect(() => {
        // When the component mounts or datasets change significantly, reload all data
        const loadAllData = async () => {
            // First load basic dataset data
            for (const [i, dataset] of datasets.entries()) {
                if (dataset.id && !isDatasetLoaded(dataset.id)) {
                    await loadDatasetData(i)
                }
            }

            // Then load sample-specific data
            for (const [i, dataset] of datasets.entries()) {
                if (dataset.id && dataset.sample) {
                    await loadSampleData(i, dataset.sample)
                }
            }
        }

        loadAllData()
    }, [datasets.map((d) => `${d.id}-${d.sample}-${d.features.join(",")}`).join("|")])

    // Add a new dataset slot (max 3)
    const handleAddDataset = () => {
        if (datasets.length < 3) {
            setDatasets([...datasets, {id: "", sample: "", features: [], plotType: "auto", isLoading: false}])
        } else {
            toast.info("Maximum of 3 datasets allowed.")
        }
    }

    // Remove a dataset
    const handleRemoveDataset = (index) => {
        const newDatasets = [...datasets]
        newDatasets.splice(index, 1)
        setDatasets(newDatasets)
    }

    // Update dataset ID
    const handleDatasetChange = (index, newDatasetId) => {
        // Skip if the dataset ID is the same
        if (datasets[index].id === newDatasetId) {
            return
        }

        const newDatasets = [...datasets]
        newDatasets[index] = {...newDatasets[index], id: newDatasetId, sample: "", features: []}
        setDatasets(newDatasets)

        // Load the dataset data if needed
        if (newDatasetId && !isDatasetLoaded(newDatasetId)) {
            loadDatasetData(newDatasetId)
        }
    }

    // Update sample for a dataset
    const handleSampleChange = (index, newSample) => {
        const newDatasets = [...datasets]
        newDatasets[index] = {...newDatasets[index], sample: newSample}
        setDatasets(newDatasets)
    }

    // Update features for a dataset
    const handleFeaturesChange = (index, newFeatures) => {
        const newDatasets = [...datasets]
        newDatasets[index] = {...newDatasets[index], features: newFeatures}
        setDatasets(newDatasets)
    }

    // Update plot type for a dataset
    const handlePlotTypeChange = (index, newPlotType) => {
        const newDatasets = [...datasets]
        const dataset = newDatasets[index]
        const oldPlotType = dataset.plotType

        // Update the plot type
        newDatasets[index] = {...newDatasets[index], plotType: newPlotType}
        setDatasets(newDatasets)

        // If we're changing to a different plot type, we might need to load additional data
        if (newPlotType !== oldPlotType && dataset.id) {
            const datasetId = dataset.id

            // If changing to UMAP and we haven't loaded UMAP data yet, load it
            if ((newPlotType === "umap" || newPlotType === "both") && !plotData[datasetId]?.umapdata) {
                // Set the current dataset in the store ONLY for this operation
                setDataset(datasetId)

                fetchUMAPData(datasetId).then(() => {
                    // Get the latest data from the store
                    const storeUmapData = useSampleGeneMetaStore.getState().umapData

                    setPlotData((prevData) => ({
                        ...prevData,
                        [datasetId]: {
                            ...prevData[datasetId],
                            umapdata: storeUmapData,
                        },
                    }))

                    // If we have a sample selected, reload the sample data to ensure everything is in sync
                    if (dataset.sample) {
                        loadSampleData(datasetId, dataset.sample)
                    }
                })
            }

            // If changing to Visium and we have a sample selected, we need to load image data
            if ((newPlotType === "visium" || newPlotType === "both") && dataset.sample) {
                loadSampleData(datasetId, dataset.sample)
            }
        }
    }

    // Refresh all plots
    const handleRefreshPlots = () => {
        // Set all datasets with samples to loading state
        setDatasets((prevDatasets) =>
            prevDatasets.map((dataset) => ({
                ...dataset,
                isLoading: dataset.id && dataset.sample ? true : false,
            })),
        )
    }

    // Refresh a specific dataset
    const handleRefreshDataset = (index) => {
        const dataset = datasets[index]
        if (dataset.id && dataset.sample) {
            // Set this specific dataset to loading state
            const newDatasets = [...datasets]
            newDatasets[index] = {...newDatasets[index], isLoading: true}
            setDatasets(newDatasets)
        }
    }

    // Get all available features (genes + meta) for a dataset
    const getAvailableFeaturesForDataset = (datasetId) => {
        if (!datasetId) {
            return []
        }

        // Use our cached data from plotData state
        const datasetData = plotData[datasetId] || {}
        const geneOptions = datasetData.genelist || []
        const metaOptions = datasetData.metalist || []

        const excludedKeys = new Set(["cs_id", "sample_id", "Cell", "Spot", "UMAP_1", "UMAP_2"])

        // Filter out excluded keys from meta options
        const filteredMetaOptions = metaOptions.filter((option) => !excludedKeys.has(option))

        // Combine gene and meta options
        return [...filteredMetaOptions, ...geneOptions]
    }

    // Get available samples for a dataset
    const getAvailableSamplesForDataset = (datasetId) => {
        if (!datasetId) {
            return []
        }

        // Use our cached data from plotData state
        const datasetData = plotData[datasetId] || {}
        const samples = datasetData.samplelist || []


        if (!samples.includes("all")) {
            return ["all", ...samples]
        }
        return samples
    }

    // Determine the appropriate plot type based on dataset type and user selection
    const getEffectivePlotType = (datasetId, userSelectedType) => {
        if (!datasetId) return null

        const datasetType = getDatasetType(datasetRecords, datasetId)

        if (userSelectedType === "auto") {
            // Auto-select based on datast type
            return datasetType === "visiumst" ? "visium" : "umap"
        }

        return userSelectedType
    }

    // Calculate column width based on number of datasets
    const getColumnWidth = () => {
        switch (datasets.length) {
            case 1:
                return "100%"
            case 2:
                return "50%"
            case 3:
                return "33.3333%"
            case 4:
                return "25%"
            default:
                return "50%" // Default to 50% for two columns
        }
    }

    // Get available plot types for a dataset
    const getAvailablePlotTypes = (datasetId) => {
        if (!datasetId) return ["auto"]

        const datasetType = getDatasetType(datasetRecords, datasetId)

        if (datasetType === "visiumst") {
            // return ["auto","umap", "visium", "both"]
            return ["umap", "visium"]
        } else {
            return ["umap"]
        }
    }

    const handleFeatureSearchChange = async (index, newInputValue) => {
        const datasetId = datasets[index].id

        // If input is empty, reset to original feature list
        if (!newInputValue || newInputValue.length < 2) {
            // Reset to original feature list from plotData
            setFeatureOptions((prevFeatureOptions) => ({
                ...prevFeatureOptions,
                [datasetId]: null, // Setting to null will make it fall back to getAvailableFeaturesForDataset
            }))
            return
        }

        // Set loading state for this dataset
        setFeatureSearchLoading((prev) => ({...prev, [datasetId]: true}))

        try {
            // Fetch genes matching the search term
            await fetchGeneList(datasetId, newInputValue)

            // Get the updated gene list from the store
            const storedGenes = useSampleGeneMetaStore.getState().geneList
            // Update feature options for this dataset
            setFeatureOptions((prevFeatureOptions) => ({
                ...prevFeatureOptions,
                [datasetId]: storedGenes,
            }))
        } catch (error) {
            toast.error(`Failed to search for genes: ${error.message}`)
        } finally {
            // Clear loading state
            setFeatureSearchLoading((prev) => ({...prev, [datasetId]: false}))
        }
    }

    // Add this function after handleFeaturesChange
    const handleFeatureSelected = (index) => {
        const datasetId = datasets[index].id
        if (datasetId) {
            // Reset feature options to original list after selection
            setFeatureOptions((prevFeatureOptions) => ({
                ...prevFeatureOptions,
                [datasetId]: null, // Setting to null will make it fall back to getAvailableFeaturesForDataset
            }))
        }
    }


    console.log("===datasets", datasets)
    console.log("===plotData", plotData)

    return (
        <div className="plot-page-container" style={{display: "flex", flexDirection: "column", flex: 1}}>
            {/* Title Row */}
            <Box className="title-row" sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <Typography variant="h6">Cross Dataset Feature Check</Typography>
                <Box>
                    <Tooltip title="Add Dataset (Max 3)">
                        <IconButton color="primary" onClick={handleAddDataset} disabled={datasets.length >= 3}
                                    size="small">
                            <AddIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh All Plots">
                        <IconButton color="primary" onClick={handleRefreshPlots} disabled={loading} size="small">
                            <RefreshIcon/>
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Divider/>

            {/* Table-like Layout */}
            <Box sx={{display: "flex", flex: 1, overflow: "auto", flexDirection: "column"}}>
                {/* Error Message */}
                {error && (<Box sx={{p: 2, width: "100%"}}><Typography color="error">{error}</Typography></Box>)}

                {/* Dataset Columns */}
                {!error && (
                    <Box sx={{display: "flex", width: "100%", height: "100%"}}>
                        {datasets.map((dataset, index) => (
                            <Box
                                className="dataset-column"
                                key={`dataset-column-${index}`}
                                sx={{
                                    width: getColumnWidth(),
                                    display: "flex",
                                    flexDirection: "column",
                                    borderRight: index < datasets.length - 1 ? "1px solid #e0e0e0" : "none",
                                    p: 1,
                                    height: "100%",
                                }}
                            >
                                {/* Dataset Header */}
                                <Paper elevation={1} sx={{pr: 1, pl: 1, pt: 1, mb: 1}}>
                                    <Box sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 1,
                                    }}>
                                        <Typography variant="subtitle1">Dataset {index + 1}: </Typography>
                                        {/* Dataset Selection */}
                                        <Autocomplete
                                            size="small"
                                            options={datasetRecords.filter(d => d.assay && (!d.assay.toLowerCase().endsWith("qtl"))).map(d => d.dataset_id) || []}
                                            value={dataset.id}
                                            onChange={(event, newValue) => handleDatasetChange(index, newValue)}
                                            sx={{
                                                flex: 1, pr: 2, pl: 2,
                                                "& .MuiInputBase-root": {height: "30px"},
                                                "& .MuiAutocomplete-input": {padding: "2px 4px !important"},
                                            }}
                                            renderInput={(params) => (
                                                <TextField {...params} placeholder="Select dataset" variant="standard"/>
                                            )}
                                        />
                                        <Box>
                                            {datasets.length > 2 && (
                                                <IconButton size="small" color="error"
                                                            onClick={() => handleRemoveDataset(index)}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleRefreshDataset(index)}
                                                disabled={!dataset.id || !dataset.sample || dataset.isLoading}
                                            >
                                                <RefreshIcon fontSize="small"/>
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Plot Type Selection Row */}
                                    <Box sx={{display: "flex", alignItems: "center", mb: 1}}>
                                        <Typography variant="subtitle1" sx={{minWidth: "80px"}}>Plot
                                            Type:{" "}</Typography>
                                        <FormControl fullWidth size="small" disabled={!dataset.id} sx={{flex: 1}}>
                                            <Select
                                                value={dataset.plotType}
                                                displayEmpty
                                                variant="standard"
                                                sx={{
                                                    height: "30px",
                                                    "& .MuiSelect-select": {padding: "2px 8px"},
                                                }}
                                                onChange={(e) => handlePlotTypeChange(index, e.target.value)}
                                            >
                                                {getAvailablePlotTypes(dataset.id).map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type === "auto"
                                                            ? "Auto"
                                                            : type === "umap"
                                                                ? "UMAP"
                                                                : type === "visium"
                                                                    ? "Visium"
                                                                    : "Both UMAP & Visium"}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Sample Selection Row */}
                                    <Box sx={{display: "flex", alignItems: "center", mb: 1}}>
                                        <Typography variant="subtitle1"
                                                    sx={{minWidth: "80px"}}>Sample:{" "}</Typography>
                                        <Autocomplete
                                            size="small"
                                            sx={{
                                                flex: 1,
                                                "& .MuiInputBase-root": {height: "30px", marginTop: "0px"},
                                                "& .MuiAutocomplete-input": {padding: "2px 4px !important"},
                                            }}
                                            options={getAvailableSamplesForDataset(dataset.id)}
                                            value={dataset.sample}
                                            onChange={(event, newValue) => handleSampleChange(index, newValue)}
                                            disabled={!dataset.id}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select sample"
                                                    variant="standard"
                                                    InputLabelProps={{shrink: false}}
                                                />
                                            )}
                                        />
                                    </Box>

                                    {/* Feature Selection Row */}
                                    <Box sx={{display: "flex", alignItems: "flex-start", mb: 1}}>
                                        <Typography variant="subtitle1"
                                                    sx={{minWidth: "80px", mt: 0.5}}>Features:{" "}</Typography>
                                        <Autocomplete
                                            multiple
                                            size="small"
                                            sx={{
                                                flex: 1,
                                                "& .MuiInputBase-root": {minHeight: "32px", marginTop: "0px"},
                                                "& .MuiAutocomplete-input": {padding: "2px 4px !important"},
                                            }}
                                            options={featureOptions?.[dataset.id] || getAvailableFeaturesForDataset(dataset.id)}
                                            value={dataset.features}
                                            onChange={(event, newValue) => {
                                                handleFeaturesChange(index, newValue)
                                                handleFeatureSelected(index) // Reset options after selection
                                            }}
                                            disabled={!dataset.id}
                                            onInputChange={(event, newInputValue) => handleFeatureSearchChange(index, newInputValue)}
                                            loading={featureSearchLoading[dataset.id]}
                                            loadingText="Searching genes..."
                                            noOptionsText="Type to search genes"
                                            filterOptions={(x) => x} // Disable client-side filtering since we're doing server-side filtering
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, i) => {
                                                    const {key, ...tagProps} = getTagProps({index: i})
                                                    return (
                                                        <Chip
                                                            key={`${key}-${option}`}
                                                            label={option}
                                                            {...tagProps}
                                                            color="primary"
                                                            size="small"
                                                            onDelete={() => {
                                                                const newFeatures = dataset.features.filter((f) => f !== option)
                                                                handleFeaturesChange(index, newFeatures)
                                                            }}
                                                        />
                                                    )
                                                })
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Type to search features"
                                                    variant="standard"
                                                    InputLabelProps={{shrink: false}}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {featureSearchLoading[dataset.id] ? (
                                                                    <CircularProgress color="inherit"
                                                                                      size={20}/>) : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>
                                </Paper>

                                {/* Feature Plots */}
                                <Box className="feature-plot-container">
                                    {/* Dataset-specific loading indicator */}
                                    {dataset.isLoading && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                zIndex: 10,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                backgroundColor: "rgba(255, 255, 255, 0.7)",
                                            }}
                                        >
                                            <CircularProgress/>
                                            <Typography variant="body2" sx={{mt: 2}}>Loading data...</Typography>
                                        </Box>
                                    )}

                                    {dataset.id && dataset.sample ? (
                                        dataset.features.length > 0 ? (
                                            dataset.features.map((feature) => {
                                                const effectivePlotType = getEffectivePlotType(dataset.id, dataset.plotType)

                                                return (
                                                    <Paper key={`${dataset.id}-${feature}`}
                                                           sx={{p: 1, alignItems: "center", justifyContent: "center"}}>
                                                        <Typography variant="body2" sx={{
                                                            mb: 1,
                                                            fontWeight: "bold",
                                                        }}>{feature}</Typography>

                                                        {/* UMAP Plot */}
                                                        {(effectivePlotType === "umap" || effectivePlotType === "both") && (
                                                            <Box className="feature-plots">
                                                                {plotData &&
                                                                plotData[dataset.id] &&
                                                                plotData[dataset.id]["umapdata"] &&
                                                                plotData[dataset.id]["exprdict"] ? (
                                                                    (() => {
                                                                        // Get the expression data specifically for this dataset
                                                                        const expr_data = plotData[dataset.id]["exprdict"] || {}
                                                                        let gene_name = feature
                                                                        const gene_expr = expr_data[feature]

                                                                        // If we don't have expression data for this feature, show a message
                                                                        if (!gene_expr && feature !== "all") {
                                                                            gene_name = "all"
                                                                        }

                                                                        return (
                                                                            <div className="umap-item">
                                                                                <div className="umap-wrapper">
                                                                                    <EChartScatterPlot
                                                                                        gene={gene_name}
                                                                                        sampleList={[dataset.sample]}
                                                                                        umapData={plotData[dataset.id]["umapdata"]}
                                                                                        exprData={gene_expr || {all: "all"}}
                                                                                        cellMetaData={plotData[dataset.id]["allCellMetaData"] ?? {}}
                                                                                        CellMetaMap={plotData[dataset.id]["CellMetaMap"] ?? {}}
                                                                                        sampleMetaData={plotData[dataset.id]["allSampleMetaData"] ?? {}}
                                                                                        group={feature}
                                                                                        isMetaDataLoading={metadataLoading}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })()
                                                                ) : (
                                                                    <Box sx={{
                                                                        display: "flex",
                                                                        justifyContent: "center",
                                                                        alignItems: "center",
                                                                        height: "100%",
                                                                        borderRadius: 1,
                                                                    }}>
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary">Loading UMAP
                                                                            data...</Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}

                                                        {/* Visium Plot */}
                                                        {(effectivePlotType === "visium" || effectivePlotType === "both") && (
                                                            <Box className="feature-plots">
                                                                {plotData &&
                                                                plotData[dataset.id] &&
                                                                plotData[dataset.id]["imagedict"] &&
                                                                plotData[dataset.id]["metadict"] ? (
                                                                    dataset.sample === "all" ? (
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary">Please select
                                                                            a specific sample for Visium
                                                                            plots.</Typography>
                                                                    ) : (
                                                                        (() => {
                                                                            return (
                                                                                <div className="visium-item">
                                                                                    <div className="visium-wrapper">
                                                                                        <PlotlyFeaturePlot
                                                                                            visiumData={plotData[dataset.id]["imagedict"][dataset.sample]}
                                                                                            geneData={plotData[dataset.id]["exprdict"] || {}}
                                                                                            metaData={plotData[dataset.id]["metadict"][dataset.sample] || {}}
                                                                                            feature={feature}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })()
                                                                    )
                                                                ) : (
                                                                    <Box sx={{
                                                                        display: "flex",
                                                                        justifyContent: "center",
                                                                        alignItems: "center",
                                                                        height: "100%",
                                                                        bgcolor: "#ffffff",
                                                                        borderRadius: 1,
                                                                    }}>
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary" sx={{mb: 1}}>
                                                                            {!plotData[dataset.id]?.imagedict ? "Image datta is loading" : !plotData[dataset.id]?.imagedict[dataset.sample] ? `No image data for sample ${dataset.sample}` : "Loading Visium data..."}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                )
                                            })
                                        ) : (
                                            <Box sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                height: 200,
                                                bgcolor: "#f5f5f5",
                                                borderRadius: 1,
                                            }}>
                                                <Typography variant="body1" color="text.secondary">No features
                                                    selected</Typography>
                                            </Box>
                                        )
                                    ) : (
                                        <Box sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: 200,
                                            bgcolor: "#f5f5f5",
                                            borderRadius: 1,
                                        }}>
                                            <Typography variant="body1"
                                                        color="text.secondary">{dataset.id ? "Select a sample" : "Select a dataset"}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </div>
    )
}

export default XDatasetsView

