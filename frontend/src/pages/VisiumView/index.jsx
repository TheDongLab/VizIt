import {useEffect, useState} from "react";
import {
    Typography,
    Box,
    Divider,
    Chip,
    Button,
    TextField,
    LinearProgress,
    CircularProgress,
    Autocomplete, Link, Switch, FormControlLabel, Menu, MenuItem,
} from "@mui/material";
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import {useSearchParams} from "react-router-dom";

import "./VisiumView.css";

import useSampleGeneMetaStore from "../../store/SampleGeneMetaStore.js";
import useDataStore from "../../store/DatatableStore.js";

import useVisiumStore from "../../store/VisiumStore.jsx";
import FeaturePlot from "./FeaturePlot.jsx";

function VisiumView() {

    // Get all the pre-selected values
    const [queryParams, setQueryParams] = useSearchParams();
    const urlGenes = queryParams.getAll("gene") ?? [];
    const urlSamples = queryParams.getAll("sample") ?? [];
    const urlMetas = queryParams.getAll("meta") ?? [];
    const urlDataset = queryParams.get("dataset") ?? "";

    const [settingOptions, setSettingOptions] = useState({
        showImage: true,
    });

    const {datasetRecords, fetchDatasetList} = useDataStore()
    useEffect(() => {
        fetchDatasetList()
        setDatasetId(urlDataset)
    }, [])

    const datasetOptions = []
    datasetRecords.map((d) => {
        if (d.assay.toLowerCase() === "visiumst" || d.assay.toLowerCase() === "merfish") {
            datasetOptions.push(d.dataset_id)
        }
    })

    //function to get assay type
    const getAssayType = (dataset) => {
        const record = datasetRecords.find(d => d.dataset_id === dataset);
        return record ? record.assay : "";
    }


    const [datasetId, setDatasetId] = useState(urlDataset)
    const [datasetSearchText, setDatasetSearchText] = useState("")

    // Prepare all the  data
    const {
        setDataset,
        geneList, fetchGeneList,
        sampleList, fetchSampleList,
        metaList, fetchMetaList,
    } = useSampleGeneMetaStore();
    const {selectedSamples, setSelectedSamples, selectedGenes, setSelectedGenes} = useSampleGeneMetaStore();

    const {
        exprDataDict, fetchExprData,
        sampleMetaDict, fetchMetaDataOfSample,
        imageDataDict, fetchImageData
    } = useSampleGeneMetaStore();
    const {loading, error} = useSampleGeneMetaStore();
    const {fetchVisiumDefaults} = useVisiumStore()

    const [selectedMetaFeatures, setSelectedMetaFeatures] = useState(urlMetas);

    const fetchPrimaryData = async () => {
        if (!datasetId) {
            setSelectedSamples([]);
            setSelectedGenes([]);
            setSelectedMetaFeatures([]);
            useSampleGeneMetaStore.setState({
                exprDataDict: {},
                sampleMetaDict: {},
                imageDataDict: {}
            });
            updateQueryParams("", [], [], []);
            return;
        }

        setDataset(datasetId);

        await fetchSampleList(datasetId);
        await fetchGeneList(datasetId);
        await fetchMetaList(datasetId, "cell_level");
        await fetchVisiumDefaults(datasetId);

        const {defaultSamples, defaultGenes, defaultFeatures} = useVisiumStore.getState();

        const initialSelectedSamples = urlSamples.length ? urlSamples : defaultSamples;
        const initialSelectedGenes = urlGenes.length ? urlGenes : defaultGenes;
        const initialMetas = urlMetas.length ? urlMetas : defaultFeatures;

        // 使用 setState 确保状态同步更新
        useSampleGeneMetaStore.setState({
            selectedSamples: initialSelectedSamples,
            selectedGenes: initialSelectedGenes,
        });
        setSelectedMetaFeatures(initialMetas);

        await fetchExprData(datasetId);
        await fetchImageData();
        await fetchMetaDataOfSample();

        updateQueryParams(datasetId, initialSelectedGenes, initialSelectedSamples, initialMetas);
    }

    useEffect(() => {
        fetchPrimaryData();
    }, []);

    const excludedKeys = new Set(["cs_id", "sample_id", "Cell", "Spot", "UMAP_1", "UMAP_2"]);
    const metaOptions = metaList ? metaList.filter(option => !excludedKeys.has(option)) : [];

    const [geneSearchText, setGeneSearchText] = useState("");
    const [sampleSearchText, setSampleSearchText] = useState("");
    const [metaSearchText, setMetaSearchText] = useState("");


    /** Updates the query parameters in the URL */
    const updateQueryParams = (dataset, genes, samples, metas = []) => {
        const newParams = new URLSearchParams();
        dataset && newParams.set("dataset", dataset)
        genes.forEach((gene) => newParams.append("gene", gene));
        samples.forEach((sample) => newParams.append("sample", sample));
        metas.forEach((meta) => newParams.append("meta", meta));

        setQueryParams(newParams);
    };

    const handleDatasetChange = async (event, newValue) => {
        if (newValue === datasetId) return;

        // 先完全重置 store 状态
        useSampleGeneMetaStore.setState({
            dataSet: null,
            geneList: [],
            sampleList: [],
            metaList: [],
            selectedSamples: [],
            selectedGenes: [],
            exprDataDict: {},
            sampleMetaDict: {},
            imageDataDict: {},
            loading: false,
            error: null
        });

        // 清理本地状态
        setSelectedMetaFeatures([]);

        // 设置新的 dataset
        setDatasetId(newValue);

        // 立即更新URL参数（清空状态）
        updateQueryParams(newValue, [], [], []);

        // 如果选择了新 dataset，则获取数据
        if (newValue) {
            // 设置 dataset
            useSampleGeneMetaStore.getState().setDataset(newValue);

            // 先获取基础列表数据
            await useSampleGeneMetaStore.getState().fetchSampleList(newValue);
            await useSampleGeneMetaStore.getState().fetchGeneList(newValue);
            await useSampleGeneMetaStore.getState().fetchMetaList(newValue, "cell_level");
            await fetchVisiumDefaults(newValue);

            // 获取新 dataset 的默认值
            const {defaultSamples, defaultGenes, defaultFeatures} = useVisiumStore.getState();

            // 直接设置 store 状态
            useSampleGeneMetaStore.setState({
                selectedSamples: defaultSamples,
                selectedGenes: defaultGenes,
            });

            // 更新本地状态
            setSelectedMetaFeatures(defaultFeatures);

            // 使用显式参数调用数据获取函数
            await useSampleGeneMetaStore.getState().fetchExprData(newValue, defaultGenes);
            await useSampleGeneMetaStore.getState().fetchImageData(newValue, defaultSamples);
            await useSampleGeneMetaStore.getState().fetchMetaDataOfSample(newValue, defaultSamples);

            // 更新URL参数包含新 dataset 的默认值
            updateQueryParams(newValue, defaultGenes, defaultSamples, defaultFeatures);
        }
    }


    // 修改 handleSampleChange 和 handleGeneChange，确保同时更新 store
    const handleSampleChange = (event, newValue) => {
        // 更新 store 状态
        setSelectedSamples(newValue);
        // 更新 URL 参数
        updateQueryParams(datasetId, selectedGenes, newValue, selectedMetaFeatures);
        fetchImageData(datasetId, newValue);
        fetchMetaDataOfSample(datasetId, newValue);
    };

    const handleGeneChange = (event, newValue) => {
        // 更新 store 状态
        setSelectedGenes(newValue);
        // 更新 URL 参数
        updateQueryParams(datasetId, newValue, selectedSamples, selectedMetaFeatures);
        fetchExprData(datasetId, newValue);
    };

    const handleGeneDelete = (delGene) => {
        const newGenes = selectedGenes.filter(g => g !== delGene);
        // 更新 store 状态
        setSelectedGenes(newGenes);
        updateQueryParams(datasetId, newGenes, selectedSamples, selectedMetaFeatures);
        fetchExprData(datasetId, newGenes);
    }

    const handleMetaFeatureChange = (event, newValue) => {
        setSelectedMetaFeatures(newValue);
        updateQueryParams(datasetId, selectedGenes, selectedSamples, newValue);
    }

    const handleMetaDelete = (delMeta) => {
        const newMetas = selectedMetaFeatures.filter(m => m !== delMeta);
        setSelectedMetaFeatures(newMetas);
        updateQueryParams(datasetId, selectedGenes, selectedSamples, newMetas);
    }

    // click the button to fetch umap data
    // 修改 fetch 函数的调用，传递显式参数
    const handleLoadPlot = () => {
        setDataset(datasetId)
        fetchExprData(datasetId, selectedGenes);
        fetchImageData(datasetId, selectedSamples);
        fetchMetaDataOfSample(datasetId, selectedSamples);
    }

    const handleOptionChange = (option) => (event) => {
        // Update immediately for switches
        setSettingOptions({
            ...settingOptions,
            [option]: event.target.checked,
        });
    };

    const selectedFeatures = [...new Set([...selectedGenes, ...selectedMetaFeatures])];

    const plotClass = Object.keys(selectedFeatures).length <= 1
        ? "single-plot" : Object.keys(selectedFeatures).length === 2
            ? "two-plots" : Object.keys(selectedFeatures).length === 3
                ? "three-plots" : "four-plots";

    return (
        <div className="plot-page-container" style={{display: 'flex', flexDirection: 'column', flex: 1}}>
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h6">Exploration of Spatial Tx Data Features</Typography>
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

                    <Typography variant="subtitle1">Select Samples</Typography>
                    {/* Sample Selection */}
                    <Autocomplete
                        multiple
                        size="small"
                        options={sampleList || []}
                        value={selectedSamples}
                        onChange={handleSampleChange}
                        inputValue={sampleSearchText}
                        onInputChange={(event, newInputValue) => setSampleSearchText(newInputValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const {key, ...tagProps} = getTagProps({index});
                                return (
                                    <Chip
                                        key={`${key}-${option}`}
                                        label={option}
                                        {...tagProps}
                                        color="primary"
                                        onDelete={() => {
                                            const newSamples = selectedSamples.filter(s => s !== option);
                                            setSelectedSamples(newSamples);
                                            updateQueryParams(datasetId, selectedGenes, newSamples, selectedMetaFeatures);
                                            fetchImageData();
                                            fetchMetaDataOfSample();
                                        }}
                                    />
                                );
                            })
                        }
                        renderInput={(params) => <TextField {...params} label="Select sample" variant="standard"
                                                            style={{margin: "10px 0px"}}/>}
                    />

                    <Typography sx={{marginTop: "10px"}} variant="subtitle1">Select features:</Typography>

                    {/* Gene Selection with Fuzzy Search & Chips */}
                    <Autocomplete
                        sx={{marginLeft: "20px"}}
                        multiple
                        size="small"
                        options={geneList}
                        value={selectedGenes}
                        onChange={handleGeneChange}
                        inputValue={geneSearchText}
                        onInputChange={(event, newInputValue) => {
                            fetchGeneList(datasetId, newInputValue);
                            setGeneSearchText(newInputValue)
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const {key, ...tagProps} = getTagProps({index});
                                return (
                                    <Chip
                                        key={`${key}-${option}`}
                                        label={option}
                                        {...tagProps}
                                        color="primary"
                                        onDelete={() => handleGeneDelete(option)}
                                    />
                                );
                            })
                        }
                        renderInput={(params) => <TextField {...params} label="Search gene" variant="standard"/>}
                    />

                    {/* meta selection with Fuzzy Search & Chips */}
                    <Autocomplete
                        sx={{marginLeft: "20px"}}
                        multiple
                        size="small"
                        options={metaOptions || []}
                        value={selectedMetaFeatures}
                        onChange={handleMetaFeatureChange}
                        inputValue={metaSearchText}
                        onInputChange={(event, newInputValue) => setMetaSearchText(newInputValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const {key, ...tagProps} = getTagProps({index});
                                return (
                                    <Chip
                                        key={`${key}-${option}`}
                                        label={option}
                                        {...tagProps}
                                        color="primary"
                                        onDelete={() => handleMetaDelete(option)}
                                    />
                                );
                            })
                        }
                        renderInput={(params) => <TextField {...params} label="Select meta feature"
                                                            variant="standard"/>}
                    />

                    {/*<Divider sx={{marginTop: "50px"}}/>*/}
                    <Typography sx={{marginTop: "30px"}} variant="subtitle1">Settings:</Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settingOptions.showImage}
                                onChange={handleOptionChange("showImage")}
                            />
                        }
                        label="Show H&E image"
                    />
                    <Divider />

                    {/* a button to fetch data and a loading indicator*/}
                    <Box sx={{display: "flex", justifyContent: "center", margin: "50px 0px"}}>
                        <Button variant="outlined" endIcon={<ScatterPlotIcon/>} disabled={loading}
                                onClick={handleLoadPlot}>
                            {loading ? "Loading plots..." : "Refresh Plots"}
                        </Button>
                    </Box>

                </div>
                {/* Left UMAP Plot Area (80%) */}
                <div className="plot-main">
                    {loading && datasetId ? (
                        <>
                            <Box sx={{width: '100%'}}><LinearProgress/></Box>
                            <Box sx={{
                                display: "flex",
                                justifyContent: "center",
                                paddingTop: "100px"
                            }}><CircularProgress/></Box>
                            <Box sx={{display: "flex", justifyContent: "center", paddingTop: "10px"}}>
                                <Typography sx={{marginLeft: "10px", color: "text.secondary"}} variant="h5">Loading
                                    sample list and metadata...</Typography>
                            </Box>
                        </>
                    ) : !datasetId ? (
                        <Typography sx={{color: "text.secondary", paddingTop: "100px"}} variant="h5">
                            Please select a dataset to explore
                        </Typography>
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : (
                        <div className="visium-container">
                            {Object.keys(imageDataDict).length < 1 ? (
                                <Box className="no-sample">
                                    <Typography sx={{color: "text.secondary"}} variant="h5">
                                        No sample selected for visualization
                                    </Typography>
                                </Box>
                            ) : Object.entries(imageDataDict).map(([sample_i, visiumData_i]) => (
                                <div key={sample_i} className="sample-row">
                                    {/* Sample Label */}
                                    <div key={`${sample_i}-label`} className="sample-label">
                                        <Box display="flex" alignItems="center" justifyContent="center" sx={{mb: 1}}>
                                            <Typography variant="subtitle1">Sample: {sample_i}</Typography>
                                            <div>&nbsp;&nbsp;</div>
                                            (<Link href={`/gsMAP/${sample_i}_PD_gsMap_Report.html`} target="_blank"
                                                   rel="noopener" underline="hover">View gsMAP</Link>)
                                        </Box>
                                    </div>

                                    {/* Features Container */}
                                    <div key={`${sample_i}-features`} className={`features-container ${plotClass}`}>
                                        {selectedFeatures.length > 0 ? (
                                            selectedFeatures.map(feature => (
                                                <div key={`${sample_i}-${feature}-div`} className="feature-plot-div">
                                                    {sampleMetaDict[sample_i] &&
                                                        <FeaturePlot
                                                            assayType={getAssayType(datasetId)}
                                                            visiumData={visiumData_i}
                                                            geneData={exprDataDict}
                                                            metaData={sampleMetaDict[sample_i] || {}}
                                                            feature={feature}
                                                            showImage={settingOptions.showImage}
                                                        />
                                                    }
                                                    <Typography variant="caption" display="block" align="center">
                                                        {feature}
                                                    </Typography>
                                                </div>
                                            ))
                                        ) : (
                                            <Box className="no-feature">
                                                <Typography sx={{color: "text.secondary"}} variant="h5">
                                                    No feature selected for visualization
                                                </Typography>
                                            </Box>
                                        )}
                                    </div>
                                    <Divider/>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VisiumView;