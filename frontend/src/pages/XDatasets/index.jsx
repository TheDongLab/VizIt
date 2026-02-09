"use client"

import {useEffect, useState, useCallback, useRef} from "react"
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
    MenuItem,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import RefreshIcon from "@mui/icons-material/Refresh"
import {useSearchParams} from "react-router-dom"

import useSampleGeneMetaStore from "../../store/SampleGeneMetaStore.js"
import useDataStore from "../../store/DatatableStore.js"
import {toast} from "react-toastify"
import FeaturePlot from "../VisiumView/FeaturePlot.jsx"

import "./XDatasets.css"
import EChartScatterPlot from "../GeneView/EChartScatter.jsx"

function getAssayType(datasetRecords, datasetId) {
    if (!datasetRecords || !datasetId) return undefined
    for (const dataset of datasetRecords) {
        if (dataset.dataset_id === datasetId) {
            return dataset.assay ? dataset.assay.toLowerCase() : undefined
        }
    }
    return undefined
}

function XDatasetsView() {
    const [plotData, setPlotData] = useState({})
    const [featureOptions, setFeatureOptions] = useState({})
    const [featureSearchLoading, setFeatureSearchLoading] = useState({})
    const [queryParams, setQueryParams] = useSearchParams()

    // Store access
    const {datasetRecords, fetchDatasetList} = useDataStore()
    const {
        fetchGeneList, fetchSampleList, fetchMetaList, setDataset, loading, error,
        fetchUMAPData, fetchExprData, fetchAllMetaData, fetchMetaDataOfSample, fetchImageData, metadataLoading
    } = useSampleGeneMetaStore();

    const initialLoadRef = useRef(false)

    // State for managing multiple datasets
    const [datasets, setDatasets] = useState(() => {
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
                dataLoaded: false,
            })
            i++
            if (i >= 3) break
        }

        // Ensure at least 2 datasets
        if (urlDatasets.length === 0) {
            return [
                {
                    id: "",
                    sample: "",
                    features: [],
                    plotType: "umap",
                    isLoading: false,
                    dataLoaded: false,
                },
                {
                    id: "",
                    sample: "",
                    features: [],
                    plotType: "umap",
                    isLoading: false,
                    dataLoaded: false,
                }
            ]
        } else if (urlDatasets.length === 1) {
            urlDatasets.push({
                id: "",
                sample: "",
                features: [],
                plotType: "umap",
                isLoading: false,
                dataLoaded: false
            })
        }
        return urlDatasets
    })

    // Load initial data
    useEffect(() => {
        if (!initialLoadRef.current) {
            fetchDatasetList()
            initialLoadRef.current = true
        }
    }, [fetchDatasetList])

    // Check if a dataset has been loaded
    const isDatasetLoaded = useCallback((datasetId) => {
        if (!datasetId) return false

        const data = plotData[datasetId]
        return (
            data &&
            data.genelist &&
            data.samplelist &&
            data.metalist &&
            data.allCellMetaData
        )
    }, [plotData])

    // Direct data loading function
    const loadDatasetData = useCallback(async (index) => {
        const datasetId = datasets[index]?.id
        if (!datasetId) {
            return
        }

        // Skip if already loading or loaded
        if (datasets[index].isLoading || isDatasetLoaded(datasetId)) {
            return
        }

        console.log(`Loading data for dataset ${datasetId}`)

        try {
            // Set loading state
            setDatasets(prev => prev.map((d, i) =>
                i === index ? {...d, isLoading: true} : d
            ))

            // Set the current dataset in the store
            await setDataset(datasetId)

            // Fetch all basic data in parallel where possible
            const [geneList, sampleList, metaList] = await Promise.all([
                !plotData[datasetId]?.genelist ? fetchGeneList(datasetId).then(() => useSampleGeneMetaStore.getState().geneList) : Promise.resolve(plotData[datasetId].genelist),
                !plotData[datasetId]?.samplelist ? fetchSampleList(datasetId).then(() => useSampleGeneMetaStore.getState().sampleList) : Promise.resolve(plotData[datasetId].samplelist),
                !plotData[datasetId]?.metalist ? fetchMetaList(datasetId).then(() => useSampleGeneMetaStore.getState().metaList) : Promise.resolve(plotData[datasetId].metalist),
            ])

            // Fetch UMAP data if needed for UMAP plots
            let umapData = plotData[datasetId]?.umapdata
            const effectivePlotType = getEffectivePlotType(datasetId, datasets[index].plotType)
            if ((effectivePlotType === "umap" || effectivePlotType === "both") && !umapData) {
                await fetchUMAPData(datasetId)
                umapData = useSampleGeneMetaStore.getState().umapData
            }

            // Fetch metadata if needed
            let allCellMetaData = plotData[datasetId]?.allCellMetaData
            let CellMetaMap = plotData[datasetId]?.CellMetaMap
            let allSampleMetaData = plotData[datasetId]?.allSampleMetaData

            if (!allCellMetaData) {
                await fetchAllMetaData(datasetId, ["all"], ["umap"])
                const storeState = useSampleGeneMetaStore.getState()
                allCellMetaData = storeState.allCellMetaData
                CellMetaMap = storeState.CellMetaMap
                allSampleMetaData = storeState.allSampleMetaData
            }

            // Update plot data
            setPlotData(prevData => ({
                ...prevData,
                [datasetId]: {
                    ...prevData[datasetId],
                    genelist: geneList,
                    samplelist: sampleList,
                    metalist: metaList,
                    umapdata: umapData,
                    allCellMetaData,
                    CellMetaMap,
                    allSampleMetaData,
                },
            }))

            // Mark dataset as loaded
            setDatasets(prev => prev.map((d, i) =>
                i === index ? {...d, isLoading: false, dataLoaded: true} : d
            ))

        } catch (error) {
            console.error(`Error loading data for dataset ${datasetId}:`, error)
            toast.error(`Failed to load dataset ${datasetId}: ${error.message}`)

            setDatasets(prev => prev.map((d, i) =>
                i === index ? {...d, isLoading: false} : d
            ))
        }
    }, [datasets, plotData, isDatasetLoaded, setDataset, fetchGeneList, fetchSampleList, fetchMetaList, fetchUMAPData, fetchAllMetaData])

    // Separate effect for loading sample-specific data
    const loadSampleData = useCallback(async (index, sample, features) => {
        const datasetId = datasets[index]?.id
        if (!sample || !datasetId) return

        try {
            // Set loading state
            setDatasets(prev => prev.map((d, i) =>
                i === index ? {...d, isLoading: true} : d
            ))

            const dataset = datasets[index]
            if (!dataset) return

            // Ensure meta list is loaded
            let metaList = plotData[datasetId]?.metalist
            if (!metaList || metaList.length === 0) {
                await setDataset(datasetId)
                await fetchMetaList(datasetId)
                metaList = useSampleGeneMetaStore.getState().metaList

                setPlotData(prevData => ({
                    ...prevData,
                    [datasetId]: {
                        ...prevData[datasetId],
                        metalist: metaList,
                    },
                }))
            }

            const metaSet = new Set(metaList)
            const geneFeatures = (features || dataset.features).filter(feature => !metaSet.has(feature))

            // Set dataset and reset store state for this operation
            await setDataset(datasetId)

            // Use a clean state for this dataset operation
            useSampleGeneMetaStore.setState({
                selectedSamples: [sample],
                selectedGenes: geneFeatures,
                exprDataDict: {},
                sampleMetaDict: {},
                imageDataDict: {},
            })

            // Fetch data in parallel where possible
            const [exprData, metaData] = await Promise.all([
                fetchExprData(datasetId,geneFeatures).then(() => useSampleGeneMetaStore.getState().exprDataDict),
                fetchMetaDataOfSample(datasetId, [sample]).then(() => useSampleGeneMetaStore.getState().sampleMetaDict),
            ])

            // Only fetch image data for Visium datasets if needed
            const effectivePlotType = getEffectivePlotType(datasetId, dataset.plotType)
            let imageData = {}
            if ((effectivePlotType === "visium" || effectivePlotType === "both" || effectivePlotType === "merfish") && sample !== "all") {
                await fetchImageData(datasetId, [sample])
                imageData = useSampleGeneMetaStore.getState().imageDataDict
            }

            // Update plot data
            setPlotData(prevData => ({
                ...prevData,
                [datasetId]: {
                    ...prevData[datasetId],
                    exprdict: {...(prevData[datasetId]?.exprdict || {}), ...exprData},
                    metadict: {...(prevData[datasetId]?.metadict || {}), ...metaData},
                    imagedict: {...(prevData[datasetId]?.imagedict || {}), ...imageData},
                },
            }))

            // Clear loading state
            setDatasets(prev => prev.map((d, i) =>
                i === index ? {...d, isLoading: false} : d
            ))

        } catch (error) {
            console.error(`Error loading sample data for dataset ${datasetId}:`, error)
            toast.error(`Failed to load sample data: ${error.message}`)

            setDatasets(prev => prev.map((d, i) =>
                i === index ? {...d, isLoading: false} : d
            ))
        }
    }, [datasets, plotData, setDataset, fetchMetaList, fetchExprData, fetchMetaDataOfSample, fetchImageData])

    // Update URL params when state changes
    useEffect(() => {
        const newParams = new URLSearchParams()

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

        setQueryParams(newParams, {replace: true})
    }, [datasets, setQueryParams])

    // Load dataset data when dataset IDs change
    useEffect(() => {
        const datasetIds = datasets.map(d => d.id).join(",")
        const loadAllDatasetData = async () => {
            const loadPromises = datasets.map(async (dataset, i) => {
                if (dataset.id && !isDatasetLoaded(dataset.id)) {
                    await loadDatasetData(i)
                }
            })
            await Promise.all(loadPromises)
        }

        if (datasetIds) {
            loadAllDatasetData()
        }
    }, [datasets.map(d => d.id).join(",")]) // Only depend on the joined string of IDs

    // Load sample data when sample or features change
    useEffect(() => {
        const sampleFeatureKey = datasets.map(d => `${d.id}-${d.sample}-${d.features.join(",")}`).join("|")
        const loadSampleSpecificData = async () => {
            const loadPromises = datasets.map(async (dataset, i) => {
                if (dataset.id && dataset.sample && dataset.features.length > 0) {
                    await loadSampleData(i, dataset.sample, dataset.features)
                }
            })
            await Promise.all(loadPromises)
        }

        if (sampleFeatureKey && !sampleFeatureKey.includes("--")) {
            loadSampleSpecificData()
        }
    }, [datasets.map(d => `${d.id}-${d.sample}-${d.features.join(",")}`).join("|")]) // Only depend on the joined string

    const handleAddDataset = () => {
        if (datasets.length < 3) {
            setDatasets(prev => [...prev, {
                id: "",
                sample: "",
                features: [],
                plotType: "umap",
                isLoading: false,
                dataLoaded: false
            }])
        } else {
            toast.info("Maximum of 3 datasets allowed.")
        }
    }

    const handleRemoveDataset = (index) => {
        const datasetId = datasets[index].id

        // Clean up plot data for removed dataset
        if (datasetId) {
            setPlotData(prev => {
                const newData = {...prev}
                delete newData[datasetId]
                return newData
            })

            setFeatureOptions(prev => {
                const newOptions = {...prev}
                delete newOptions[datasetId]
                return newOptions
            })
        }

        setDatasets(prev => prev.filter((_, i) => i !== index))
    }

    const handleDatasetChange = async (index, newDatasetId) => {
        if (datasets[index].id === newDatasetId) {
            return
        }

        const oldDatasetId = datasets[index].id

        // Clean up old dataset data
        if (oldDatasetId) {
            setPlotData(prev => {
                const newData = {...prev}
                delete newData[oldDatasetId]
                return newData
            })

            setFeatureOptions(prev => {
                const newOptions = {...prev}
                delete newOptions[oldDatasetId]
                return newOptions
            })
        }

        const newDatasets = [...datasets]
        newDatasets[index] = {
            ...newDatasets[index],
            id: newDatasetId,
            sample: "",
            features: [],
            isLoading: false,
            dataLoaded: false
        }
        setDatasets(newDatasets)

        if (newDatasetId) {
            loadDatasetData(index)
        }
    }

    const handleSampleChange = (index, newSample) => {
        setDatasets(prev => prev.map((d, i) =>
            i === index ? {...d, sample: newSample} : d
        ))
    }

    const handleFeaturesChange = (index, newFeatures) => {
        setDatasets(prev => prev.map((d, i) =>
            i === index ? {...d, features: newFeatures} : d
        ))
    }

    const handlePlotTypeChange = async (index, newPlotType) => {
        const dataset = datasets[index]
        const oldPlotType = dataset.plotType

        setDatasets(prev => prev.map((d, i) =>
            i === index ? {...d, plotType: newPlotType} : d
        ))

        if (newPlotType !== oldPlotType && dataset.id) {
            const datasetId = dataset.id

            if ((newPlotType === "umap" || newPlotType === "both") && !plotData[datasetId]?.umapdata) {
                try {
                    await setDataset(datasetId)
                    await fetchUMAPData(datasetId)
                    const storeUmapData = useSampleGeneMetaStore.getState().umapData

                    setPlotData(prevData => ({
                        ...prevData,
                        [datasetId]: {
                            ...prevData[datasetId],
                            umapdata: storeUmapData,
                        },
                    }))

                    if (dataset.sample && dataset.features.length > 0) {
                        loadSampleData(index, dataset.sample, dataset.features)
                    }
                } catch (error) {
                    console.error(`Error loading UMAP data for ${datasetId}:`, error)
                }
            }

            if ((newPlotType === "visium" || newPlotType === "both") && dataset.sample && dataset.features.length > 0) {
                loadSampleData(index, dataset.sample, dataset.features)
            }
        }
    }

    const handleRefreshPlots = () => {
        // Reload data for all datasets that have IDs and samples
        datasets.forEach((dataset, index) => {
            if (dataset.id && dataset.sample && dataset.features.length > 0) {
                loadSampleData(index, dataset.sample, dataset.features)
            }
        })
    }

    const handleRefreshDataset = (index) => {
        const dataset = datasets[index]
        if (dataset.id && dataset.sample && dataset.features.length > 0) {
            loadSampleData(index, dataset.sample, dataset.features)
        }
    }

    const getAvailableFeaturesForDataset = useCallback((datasetId) => {
        if (!datasetId) {
            return []
        }

        const datasetData = plotData[datasetId] || {}
        const geneOptions = datasetData.genelist || []
        const metaOptions = datasetData.metalist || []

        const excludedKeys = new Set(["cs_id", "sample_id", "Cell", "Spot", "UMAP_1", "UMAP_2"])

        const filteredMetaOptions = metaOptions.filter((option) => !excludedKeys.has(option))

        return [...filteredMetaOptions, ...geneOptions]
    }, [plotData])

    const getAvailableSamplesForDataset = useCallback((datasetId) => {
        if (!datasetId) {
            return []
        }

        const datasetData = plotData[datasetId] || {}
        const samples = datasetData.samplelist || []

        if (!samples.includes("all")) {
            return ["all", ...samples]
        }
        return samples
    }, [plotData])

    const getEffectivePlotType = (datasetId, userSelectedType) => {
        if (!datasetId) return null

        const datasetType = getAssayType(datasetRecords, datasetId)

        if (userSelectedType === "auto") {
            return datasetType === "visiumst" ? "visium" : "umap"
        }

        return userSelectedType
    }

    const getColumnWidth = () => {
        switch (datasets.length) {
            case 1:
                return "100%"
            case 2:
                return "50%"
            case 3:
                return "33.3333%"
            default:
                return "50%"
        }
    }

    const getAvailablePlotTypes = (datasetId) => {
        if (!datasetId) return ["auto"]

        const datasetType = getAssayType(datasetRecords, datasetId)

        // Default options when datasetRecords is not loaded yet
        if (!datasetRecords || datasetRecords.length === 0) {
            return ["umap"]
        }

        if (datasetType === "visiumst") {
            return ["umap", "visium"]
        } else if (datasetType === "merfish") {
            return ["umap", "merfish"]
        } else {
            return ["umap"]
        }
    }

    const handleFeatureSearchChange = async (index, newInputValue) => {
        const datasetId = datasets[index].id

        if (!newInputValue || newInputValue.length < 2) {
            setFeatureOptions(prev => ({
                ...prev,
                [datasetId]: null,
            }))
            return
        }

        setFeatureSearchLoading(prev => ({...prev, [datasetId]: true}))

        try {
            await setDataset(datasetId)
            await fetchGeneList(datasetId, newInputValue)

            const storedGenes = useSampleGeneMetaStore.getState().geneList
            setFeatureOptions(prev => ({
                ...prev,
                [datasetId]: storedGenes,
            }))
        } catch (error) {
            toast.error(`Failed to search for genes: ${error.message}`)
        } finally {
            setFeatureSearchLoading(prev => ({...prev, [datasetId]: false}))
        }
    }

    const handleFeatureSelected = (index) => {
        const datasetId = datasets[index].id
        if (datasetId) {
            setFeatureOptions(prev => ({
                ...prev,
                [datasetId]: null,
            }))
        }
    }

    // Check if Visium data is available and valid for a specific dataset and sample
    const isVisiumDataAvailable = useCallback((datasetId, sample) => {
        if (!datasetId || !sample || sample === "all") return false

        const datasetData = plotData[datasetId]
        if (!datasetData || !datasetData.imagedict) return false

        const sampleImageData = datasetData.imagedict[sample]
        return sampleImageData && sampleImageData.coordinates
    }, [plotData])

    // Check if UMAP data is available
    const isUMAPDataAvailable = useCallback((datasetId) => {
        if (!datasetId) return false
        const datasetData = plotData[datasetId]
        return datasetData && datasetData.umapdata
    }, [plotData])

    // Safe function to get assay type for FeaturePlot
    const getSafeAssayType = useCallback((datasetId) => {
        if (!datasetId || !datasetRecords || datasetRecords.length === 0) {
            return undefined
        }
        return getAssayType(datasetRecords, datasetId)
    }, [datasetRecords])

    console.log("plotData", plotData)

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
                                    position: "relative",
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
                                            options={datasetRecords && datasetRecords.length > 0
                                                ? datasetRecords.filter(d => d.assay && (!d.assay.toLowerCase().endsWith("qtl"))).map(d => d.dataset_id)
                                                : []}
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
                                                disabled={!dataset.id || !dataset.sample || dataset.features.length === 0 || dataset.isLoading}
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
                                                        {type === "umap" ? "UMAP"
                                                            : type === "visium" ? "Visium"
                                                                : type === "merfish" ? "MERFISH" : "UMAP"}
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
                                                handleFeatureSelected(index)
                                            }}
                                            disabled={!dataset.id}
                                            onInputChange={(event, newInputValue) => handleFeatureSearchChange(index, newInputValue)}
                                            loading={featureSearchLoading[dataset.id]}
                                            loadingText="Searching genes..."
                                            noOptionsText="Type to search genes"
                                            filterOptions={(x) => x}
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
                                <Box className="feature-plot-container" sx={{position: "relative", flex: 1}}>
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
                                                           sx={{
                                                               p: 1,
                                                               mb: 1,
                                                               alignItems: "center",
                                                               justifyContent: "center"
                                                           }}>
                                                        <Typography variant="body2" sx={{
                                                            mb: 1,
                                                            fontWeight: "bold",
                                                        }}>{feature}</Typography>

                                                        {/* UMAP Plot */}
                                                        {(effectivePlotType === "umap" || effectivePlotType === "both") && (
                                                            <Box className="feature-plots">
                                                                {isUMAPDataAvailable(dataset.id) ? (
                                                                    <div className="umap-item">
                                                                        <div className="umap-wrapper">
                                                                            <EChartScatterPlot
                                                                                gene={feature}
                                                                                sampleList={[dataset.sample]}
                                                                                umapData={plotData[dataset.id].umapdata}
                                                                                exprData={plotData[dataset.id]?.exprdict?.[feature] || {}}
                                                                                cellMetaData={plotData[dataset.id]?.allCellMetaData ?? {}}
                                                                                CellMetaMap={plotData[dataset.id]?.CellMetaMap ?? {}}
                                                                                sampleMetaData={plotData[dataset.id]?.allSampleMetaData ?? {}}
                                                                                group={feature}
                                                                                isMetaDataLoading={metadataLoading}
                                                                            />
                                                                        </div>
                                                                    </div>
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
                                                        {(effectivePlotType === "visium" || effectivePlotType === "both" || effectivePlotType === "merfish") && (
                                                            <Box className="feature-plots">
                                                                {isVisiumDataAvailable(dataset.id, dataset.sample) ? (
                                                                    <div className="visium-item">
                                                                        <div className="visium-wrapper">
                                                                            <FeaturePlot
                                                                                assayType={getSafeAssayType(dataset.id)}
                                                                                visiumData={plotData[dataset.id].imagedict[dataset.sample]}
                                                                                geneData={plotData[dataset.id]?.exprdict || {}}
                                                                                metaData={plotData[dataset.id]?.metadict?.[dataset.sample] || {}}
                                                                                feature={feature}
                                                                                showImage={false}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Box sx={{
                                                                        display: "flex",
                                                                        justifyContent: "center",
                                                                        alignItems: "center",
                                                                        height: "100%",
                                                                        bgcolor: "#ffffff",
                                                                        borderRadius: 1,
                                                                    }}>
                                                                        <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                                                                            {!plotData[dataset.id]?.imagedict ? "Image data is loading"
                                                                                : dataset.sample === "all" ? "Please select a specific sample for Visium plots"
                                                                                    : !plotData[dataset.id]?.imagedict[dataset.sample] ? `No image data for sample ${dataset.sample}`
                                                                                        : "Loading spatial data..."}
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

export default XDatasetsView;
