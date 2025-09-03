import {useEffect, useState, useMemo, useCallback} from "react";
import {
    Typography,
    Box,
    Divider,
    Chip,
    Button,
    TextField,
    LinearProgress,
    CircularProgress,
    Autocomplete,
    Link,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    DialogContentText,
    Menu,
    MenuItem,
    FormControlLabel,
    Switch,
    IconButton,
    Tooltip,
} from "@mui/material";
import {PropTypes} from "prop-types";
import {debounce} from "@mui/material/utils";

import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import SettingsIcon from "@mui/icons-material/Settings";
import {useSearchParams} from "react-router-dom";

import "./XQTLView.css";

import useDataStore from "../../store/DatatableStore.js";
import useQtlStore from "../../store/QtlStore.js";

import GeneViewPlotlyPlot from "./GeneViewPlotlyPlot.jsx";
import SNPViewPlotlyPlot from "./SNPViewPlotlyPlot.jsx";

import {ListboxComponent, StyledPopper} from "../../components/Listbox";

import {supportsWebGL} from "../../utils/webgl.js";

const webGLSupported = supportsWebGL();
console.log("WebGL supported:", webGLSupported);

import {getGeneLocation, getSnpLocation} from "../../api/qtl.js";

function ConfirmationDialog({
                                isOpen,
                                handleClose,
                                handleConfirm,
                                title,
                                description,
                            }) {
    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
        >
            <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
            <DialogContent>{description}</DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>No</Button>
                <Button onClick={handleConfirm} autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function XQTLView() {
    // Get all the pre-selected values
    const [queryParams, setQueryParams] = useSearchParams();
    const urlGene = queryParams.get("gene") ?? "";
    const urlSnp = queryParams.get("snp") ?? "";
    const urlDataset = queryParams.get("dataset") ?? "";

    const {datasetRecords, fetchDatasetList} = useDataStore();
    useEffect(() => {
        fetchDatasetList();
    }, []);

    const datasetOptions = datasetRecords
    .filter((d) => d.assay.toLowerCase().endsWith("qtl"))
    .map((d) => d.dataset_id);

    const [datasetId, setDatasetId] = useState(urlDataset);
    const [datasetSearchText, setDatasetSearchText] = useState("");

    const {
        setDataset,
        selectedGene,
        setSelectedGene,
        selectedSnp,
        setSelectedSnp,
        geneList,
        fetchGeneList,
        snpList,
        fetchSnpList,
        snpData,
        fetchSnpData,
        geneData,
        fetchGeneData,
        selectedCellTypes,
        fetchGeneCellTypes,
        fetchSnpCellTypes,
        selectedChromosome,
        fetchGeneChromosome,
        fetchSnpChromosome,
        fetchGeneLocations,
        fetchSnpLocations,
        fetchGwasForGene,
        fetchGwasForSnp,
        resetQtlState,
    } = useQtlStore();
    const {loading, error} = useQtlStore();

    const [dataLoading, setDataLoading] = useState(false);

    const selectGeneOrSnp = (type, value) => {
        if (type === "gene") {
            setSelectedSnp("");
            setSelectedGene(value);
        } else if (type === "snp") {
            setSelectedGene("");
            setSelectedSnp(value);
        } else if (type === "reset") {
            setSelectedGene("");
            setSelectedSnp("");
        }
    };

    useEffect(() => {
        const initialize = async () => {
            if (!datasetId || datasetId === "") return;

            try {
                await setDataset(datasetId);
                const genes = await fetchGeneList(datasetId);
                const snps = await fetchSnpList(datasetId);

                if (urlGene) {
                    if (genes.includes(urlGene)) {
                        setSelectedGene(urlGene);
                    } else {
                        setSelectedGene("");
                        setSelectionError("Please enter a valid gene, peak, or SNP");
                    }
                }

                if (urlSnp) {
                    if (snps.includes(urlSnp)) {
                        setSelectedSnp(urlSnp);
                    } else {
                        setSelectedSnp("");
                        setSelectionError("Please enter a valid gene, peak, or SNP");
                    }
                }
            } catch (error) {
                console.error("Error in data fetching:", error);
            }
        };

        initialize();
    }, [datasetId, setDataset]);

    const [geneSearchText, setGeneSearchText] = useState("");
    const [snpSearchText, setSnpSearchText] = useState("");
    const [combinedSearchText, setCombinedSearchText] = useState("");
    const [filteredGeneList, setFilteredGeneList] = useState([]);
    const [filteredSnpList, setFilteredSnpList] = useState([]);
    const [filteredCombinedList, setFilteredCombinedList] = useState([]);

    useEffect(() => {
        const newParams = new URLSearchParams();
        datasetId && newParams.set("dataset", datasetId);
        selectedGene && newParams.set("gene", selectedGene);
        selectedSnp && newParams.set("snp", selectedSnp);
        setQueryParams(newParams);
    }, [datasetId, selectedGene, selectedSnp, setQueryParams]);

    const combinedList = useMemo(() => {
        return [
            ...geneList.map((gene) => ({type: "gene", id: gene})),
            ...snpList.map((snp) => ({type: "snp", id: snp})),
        ];
    }, [geneList, snpList]);

    const listLength = 500; // Limit the list length for performance

    const initialSlicedCombinedList = useMemo(() => {
        return combinedList.slice(0, listLength);
    }, [combinedList, listLength]);

    useEffect(() => {
        setFilteredCombinedList(initialSlicedCombinedList);
    }, [initialSlicedCombinedList]);

    const indexedList = useMemo(
        () =>
            combinedList.map((item) => ({
                original: item,
                lowercaseId: item.id.toLowerCase(),
            })),
        [combinedList],
    );

    const debouncedFilter = useMemo(
        () =>
            debounce((value, setFn) => {
                const results = indexedList
                .filter((item) => item.lowercaseId.includes(value.toLowerCase()))
                .map((item) => item.original);
                setFn(results.slice(0, listLength));
            }, 120),
        [indexedList],
    );

    const handleCombinedInputChange = (event, value) => {
        setCombinedSearchText(value);
        if (!value) {
            setFilteredCombinedList(initialSlicedCombinedList);
        } else {
            debouncedFilter(value, setFilteredCombinedList);
            // const results = combinedList.filter((item) =>
            //   item.id.toLowerCase().includes(value.toLowerCase()),
            // );
            // setFilteredCombinedList(results.slice(0, listLength));
        }
    };

    const handleCombinedAutocompleteOpen = () => {
        if (
            combinedSearchText === selectedGene ||
            combinedSearchText === selectedSnp
        ) {
            setFilteredCombinedList(initialSlicedCombinedList);
        }
    };

    const [genes, setGenes] = useState([]);
    const [snps, setSnps] = useState([]);
    const [gwasData, setGwasData] = useState([]); // Only used for gene view
    const [hasGwas, setHasGwas] = useState(true);
    const [selectionError, setSelectionError] = useState("");

    const fetchGeneOrSnpData = async () => {
        if (!datasetId) return;

        const isGene = selectedGene && selectedGene !== "";
        const isSnp = selectedSnp && selectedSnp !== "";

        if (!isGene && !isSnp) {
            return;
        } else if (isGene && isSnp) {
            console.warn("Error: Both gene and SNP are selected.");
        } else if (isGene) {
            setDataLoading(true);
            try {
                await fetchGeneCellTypes(datasetId);
                await fetchGeneChromosome(datasetId);
                const locations = await fetchGeneLocations(datasetId, 10000000);
                const gene = await getGeneLocation(datasetId, selectedGene);

                if (!locations.some((g) => g.id === gene)) {
                    locations.push({
                        gene_id: selectedGene,
                        position_start: gene.data.start,
                        position_end: gene.data.end,
                        strand: gene.data.strand,
                    });
                }
                setGenes(locations);

                let gwas;
                if (hasGwas) {
                    if (!(displayOptions?.showGwas ?? true)) {
                        setGwasData([]);
                        gwas = [];
                    } else {
                        try {
                            gwas = await fetchGwasForGene(datasetId, 1500000);
                            setHasGwas(gwas.length > 0);
                            const gwasLocations = gwas.map(
                                ({snp_id, p_value, beta_value, position, ...rest}) => ({
                                    ...rest,
                                    id: snp_id,
                                    y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
                                    beta: beta_value,
                                    x: position,
                                    snp_id,
                                    p_value,
                                    position,
                                }),
                            );
                            setGwasData(gwasLocations);
                        } catch (error) {
                            console.error("Error fetching GWAS data:", error);
                            setHasGwas(false);
                            setGwasData([]);
                        }
                    }
                }

                await fetchSnpData(datasetId);
                setSelectionError("");
                setDataLoading(false);
            } catch (error) {
                console.error("Error fetching gene data:", error);
                setSelectionError("Please enter a valid gene, peak, or SNP");
                setDataLoading(false);
                return;
            }
        } else if (isSnp) {
            setDataLoading(true);
            try {
                await fetchSnpCellTypes(datasetId);
                await fetchSnpChromosome(datasetId);

                let locations=[];
                if (hasGwas) {
                    if (!(displayOptions?.showGwas ?? true)) {
                        locations = await fetchSnpLocations(datasetId, 1500000);
                    } else {
                        try {
                            locations = await fetchGwasForSnp(datasetId, 1500000);
                            setHasGwas(locations.length > 0);
                            locations = locations.map(
                                ({snp_id, p_value, beta_value, position, ...rest}) => ({
                                    ...rest,
                                    id: snp_id,
                                    y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
                                    beta: beta_value,
                                    x: position,
                                    snp_id,
                                    p_value,
                                    position,
                                }),
                            );
                        } catch (error) {
                            console.error("Error fetching GWAS data:", error);
                            locations = await fetchSnpLocations(datasetId, 1500000);
                            setHasGwas(false);
                        }
                    }
                }

                const snp = await getSnpLocation(datasetId, selectedSnp);

                if (!locations.some((s) => s.id === snp)) {
                    locations.push({
                        snp_id: selectedSnp,
                        position: snp.data.position,
                    });
                }
                setSnps(locations);

                await fetchGeneData(datasetId);
                setSelectionError("");
                setDataLoading(false);
            } catch (error) {
                console.error("Error fetching SNP data:", error);
                setSelectionError("Please enter a valid gene, peak, or SNP");
                setDataLoading(false);
                return;
            }
        }
    };

    useEffect(() => {
        if (selectedGene || selectedSnp) {
            fetchGeneOrSnpData();
        }
    }, [selectedGene, selectedSnp, datasetId, hasGwas]);

    const handleDatasetChange = (event, newValue) => {
        setDataset(newValue);
        setDatasetId(newValue);
        setHasGwas(true);
        selectGeneOrSnp("reset", null);
    };

    const handleCombinedChange = async (event, newValue) => {
        if (!newValue) {
            selectGeneOrSnp("reset", null);
            return;
        }
        if (newValue.type === "gene") {
            selectGeneOrSnp("gene", newValue.id);
        } else if (newValue.type === "snp") {
            selectGeneOrSnp("snp", newValue.id);
        }
    };

    // click the button to fetch umap data
    const handleLoadPlot = async () => {
        await fetchGeneOrSnpData();
    };

    // Handle clicking points
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [selectedPointData, setSelectedPointData] = useState(null);
    const [type, setType] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSelect = useCallback((name, data, type) => {
        setSelectedPoint(name);
        setSelectedPointData(data);
        setType(type);
        setIsDialogOpen(true);
    }, []);

    const handleClose = () => {
        setIsDialogOpen(false);
        setSelectedPoint(null);
        setSelectedPointData(null);
    };

    const handleConfirm = () => {
        setIsDialogOpen(false);
        if (selectedPoint) {
            if (type === "gene") {
                selectGeneOrSnp("gene", selectedPoint);
            } else if (type === "snp") {
                selectGeneOrSnp("snp", selectedPoint);
            }
        }
    };

    // Set the initial selected gene and SNP from URL parameters
    useEffect(() => {
        if (urlGene !== selectedGene) {
            if (urlGene) {
                setSelectedGene(urlGene);
            } else {
                setSelectedGene("");
            }
        }
        if (urlSnp !== selectedSnp) {
            if (urlSnp) {
                setSelectedSnp(urlSnp);
            } else {
                setSelectedSnp("");
            }
        }
    }, [urlGene, urlSnp]);

    const currentValue = useMemo(() => {
        if (selectedGene) {
            return (
                combinedList.find(
                    (item) => item.type === "gene" && item.id === selectedGene,
                ) ?? null
            );
        }
        if (selectedSnp) {
            return (
                combinedList.find(
                    (item) => item.type === "snp" && item.id === selectedSnp,
                ) ?? null
            );
        }
        return null;
    }, [combinedList, selectedGene, selectedSnp]);

    // Clear zustand state on unmount
    useEffect(() => {
        return () => {
            resetQtlState();
        };
    }, []);

    const [anchorEl, setAnchorEl] = useState(null);
    const [displayOptions, setDisplayOptions] = useState({
        showDashedLine: true,
        crossGapDashedLine: true,
        dashedLineColor: "#000000",
        showGrid: true,
        trackHeight: 150,
        gapHeight: 20,
        yHeight: "",
        showGwas: true,
    });
    const [tempDisplayOptions, setTempDisplayOptions] = useState({
        ...displayOptions,
    });

    const menuOpen = Boolean(anchorEl);

    useEffect(() => {
        if (menuOpen) {
            setTempDisplayOptions({...displayOptions});
        }
    }, [displayOptions, menuOpen]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setDisplayOptions({...tempDisplayOptions});
        setAnchorEl(null);
    };

    const handleOptionChange = (option) => (event) => {
        setTempDisplayOptions({
            ...tempDisplayOptions,
            [option]: event.target.checked,
        });
        // Update immediately for switches
        if (option !== "dashedLineColor") {
            setDisplayOptions({
                ...displayOptions,
                [option]: event.target.checked,
            });
        }
    };

    useEffect(() => {
        if (displayOptions?.showGwas ?? true) {
            setHasGwas(true);
        } else {
            setHasGwas(null);
        }
    }, [displayOptions.showGwas]);

    return (
        <div
            className="plot-page-container"
            style={{display: "flex", flexDirection: "column", flex: 1}}
        >
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h6">xQTL View</Typography>
            </Box>
            <Divider/>
            <div className="selection-row">
                <div className="control-group">
                    {/* <Typography variant="subtitle1">Select a Dataset:</Typography> */}
                    {/* Dataset Selection */}
                    <Autocomplete
                        sx={{width: "400px"}}
                        size="small"
                        disableListWrap
                        options={datasetOptions}
                        value={datasetId ?? null}
                        onChange={handleDatasetChange}
                        inputValue={datasetSearchText}
                        onInputChange={(event, newInputValue) =>
                            setDatasetSearchText(newInputValue)
                        }
                        slots={{
                            popper: StyledPopper,
                        }}
                        slotProps={{
                            listbox: {
                                component: ListboxComponent,
                            },
                        }}
                        renderOption={(props, option) => {
                            const {key, ...rest} = props;
                            return (
                                <li key={key} {...rest}>
                                    {option}
                                </li>
                                // <ListItem key={key} {...rest}>
                                //   {option}
                                // </ListItem>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Dataset"
                                variant="standard"
                                /* style={{ marginBottom: "30px" }} */
                            />
                        )}
                    />
                </div>
                <div className="control-group">
                    {/* <label>Select Gene or SNP:</label> */}
                    {/* Gene Selection */}
                    <Autocomplete
                        /* multiple */
                        sx={{width: "400px"}}
                        disableListWrap
                        size="small"
                        options={filteredCombinedList}
                        value={currentValue}
                        onChange={handleCombinedChange}
                        onOpen={handleCombinedAutocompleteOpen}
                        inputValue={combinedSearchText}
                        onInputChange={handleCombinedInputChange}
                        /* isOptionEqualToValue={(option, value) => option.id === value.id} */
                        slots={{
                            popper: StyledPopper,
                        }}
                        slotProps={{
                            listbox: {
                                component: ListboxComponent,
                            },
                        }}
                        getOptionLabel={(option) => option.id || ""}
                        renderOption={(props, option) => {
                            const {key, ...rest} = props;
                            return (
                                <li key={key} {...rest}>
                                    {option.id}
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search by gene symbol, gene ID, SNP rsID"
                                variant="standard"
                            />
                        )}
                    />

                    {/* SNP Selection */}
                    {/* <Autocomplete */}
                    {/*   disableListWrap */}
                    {/*   size="small" */}
                    {/*   options={filteredSnpList} */}
                    {/*   value={selectedSnp} */}
                    {/*   onChange={handleSnpChange} */}
                    {/*   onOpen={handleSnpAutocompleteOpen} */}
                    {/*   inputValue={snpSearchText} */}
                    {/*   onInputChange={handleSnpInputChange} */}
                    {/*   slots={{ */}
                    {/*     popper: StyledPopper, */}
                    {/*   }} */}
                    {/*   slotProps={{ */}
                    {/*     listbox: { */}
                    {/*       component: ListboxComponent, */}
                    {/*     }, */}
                    {/*   }} */}
                    {/*   renderOption={(props, option) => { */}
                    {/*     const { key, ...rest } = props; */}
                    {/*     return ( */}
                    {/*       <li key={key} {...rest}> */}
                    {/*         {option} */}
                    {/*       </li> */}
                    {/*     ); */}
                    {/*   }} */}
                    {/*   renderInput={(params) => ( */}
                    {/*     <TextField {...params} label="Search SNP" variant="standard" /> */}
                    {/*   )} */}
                    {/* /> */}
                </div>
                <div className="control-group">
                    {/* Button to fetch data and a loading indicator*/}
                    <Box
                        /* sx={{ */
                        /*   display: "flex", */
                        /*   justifyContent: "center", */
                        /*   /\* margin: "20px 0px", *\/ */
                        /* }} */
                    >
                        <Button
                            variant="outlined"
                            endIcon={<ScatterPlotIcon/>}
                            disabled={loading || dataLoading}
                            onClick={handleLoadPlot}
                        >
                            {loading || dataLoading ? "Loading plots..." : "Refresh Plots"}
                        </Button>
                    </Box>
                </div>
                <div className="control-group">
                    <Tooltip title="Graph display options">
                        <IconButton
                            onClick={handleMenuOpen}
                            color="inherit"
                            aria-label="display options"
                        >
                            <SettingsIcon/>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        PaperProps={{
                            style: {
                                width: "500px",
                                padding: "10px",
                            },
                        }}
                    >
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={displayOptions.showDashedLine}
                                        onChange={handleOptionChange("showDashedLine")}
                                    />
                                }
                                label="Show dashed line"
                            />
                        </MenuItem>
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={displayOptions.crossGapDashedLine}
                                        onChange={handleOptionChange("crossGapDashedLine")}
                                    />
                                }
                                label="Cross-gap dashed line"
                            />
                        </MenuItem>
                        <MenuItem>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    width: "100%",
                                }}
                            >
                                <Typography variant="body">Dashed line color:</Typography>
                                <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                                    <input
                                        type="color"
                                        value={
                                            /^#[0-9A-Fa-f]{6}$/.test(
                                                tempDisplayOptions.dashedLineColor,
                                            )
                                                ? tempDisplayOptions.dashedLineColor
                                                : "#000000" // fallback color for when user is typing in text box
                                        }
                                        onChange={(e) => {
                                            setTempDisplayOptions({
                                                ...tempDisplayOptions,
                                                dashedLineColor: e.target.value,
                                            });
                                        }}
                                        style={{
                                            width: "30px",
                                            height: "30px",
                                            cursor: "pointer",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        value={tempDisplayOptions.dashedLineColor}
                                        onChange={(e) => {
                                            setTempDisplayOptions({
                                                ...tempDisplayOptions,
                                                dashedLineColor: e.target.value,
                                            });
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                setDisplayOptions({
                                                    ...tempDisplayOptions,
                                                });
                                            }
                                        }}
                                        inputProps={{
                                            style: {
                                                width: "80px",
                                                padding: "5px",
                                            },
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => {
                                            setDisplayOptions({
                                                ...tempDisplayOptions,
                                            });
                                        }}
                                        sx={{height: "30px"}}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            </Box>
                        </MenuItem>
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={displayOptions.dashedLineOnTop}
                                        onChange={handleOptionChange("dashedLineOnTop")}
                                    />
                                }
                                label="Dashed line on top"
                            />
                        </MenuItem>
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={displayOptions.showGrid}
                                        onChange={handleOptionChange("showGrid")}
                                    />
                                }
                                label="Show grid"
                            />
                        </MenuItem>
                        <MenuItem>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    width: "100%",
                                }}
                            >
                                <Typography variant="body">Track height:</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={tempDisplayOptions.trackHeight}
                                    onChange={(e) =>
                                        setTempDisplayOptions({
                                            ...tempDisplayOptions,
                                            trackHeight: Number(e.target.value),
                                        })
                                    }
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            setDisplayOptions({
                                                ...tempDisplayOptions,
                                            });
                                        }
                                    }}
                                    inputProps={{
                                        style: {
                                            width: "80px",
                                            padding: "5px",
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                        setDisplayOptions({
                                            ...tempDisplayOptions,
                                        });
                                    }}
                                    sx={{height: "30px"}}
                                >
                                    Save
                                </Button>
                            </Box>
                        </MenuItem>
                        <MenuItem>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    width: "100%",
                                }}
                            >
                                <Typography variant="body">Gap height:</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={tempDisplayOptions.gapHeight}
                                    onChange={(e) =>
                                        setTempDisplayOptions({
                                            ...tempDisplayOptions,
                                            gapHeight: Number(e.target.value),
                                        })
                                    }
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            setDisplayOptions({
                                                ...tempDisplayOptions,
                                            });
                                        }
                                    }}
                                    inputProps={{
                                        style: {
                                            width: "80px",
                                            padding: "5px",
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                        setDisplayOptions({
                                            ...tempDisplayOptions,
                                        });
                                    }}
                                    sx={{height: "30px"}}
                                >
                                    Save
                                </Button>
                            </Box>
                        </MenuItem>
                        <MenuItem>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    width: "100%",
                                }}
                            >
                                <Typography variant="body">Y-axis height:</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={tempDisplayOptions.yHeight}
                                    onChange={(e) =>
                                        setTempDisplayOptions({
                                            ...tempDisplayOptions,
                                            yHeight:
                                                e.target.value === "" ? "" : Number(e.target.value),
                                        })
                                    }
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            setDisplayOptions({
                                                ...tempDisplayOptions,
                                            });
                                        }
                                    }}
                                    placeholder="Auto"
                                    inputProps={{
                                        style: {
                                            width: "80px",
                                            padding: "5px",
                                        },
                                        min: 0,
                                        step: 0.1,
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                        setDisplayOptions({
                                            ...tempDisplayOptions,
                                        });
                                    }}
                                    sx={{height: "30px"}}
                                >
                                    Save
                                </Button>
                            </Box>
                        </MenuItem>
                        {hasGwas && <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch checked={displayOptions.showGwas} onChange={handleOptionChange("showGwas")}/>
                                }
                                label="Show GWAS data"
                            />
                        </MenuItem>}
                    </Menu>
                </div>
            </div>
            <div className="plot-content">
                <ConfirmationDialog
                    isOpen={isDialogOpen}
                    handleClose={handleClose}
                    handleConfirm={handleConfirm}
                    title={`Do you want to open details for ${selectedPoint ?? "point"}?`}
                    description={selectedPointData ?? "No additional data available."}
                />

                {/* Plot Area */}
                <div className="plot-main">
                    {dataLoading && (
                        <>
                            <Box sx={{width: "100%"}}>
                                <LinearProgress/>
                            </Box>
                        </>
                    )}

                    {datasetId === "" || datasetId === "all" || datasetId == null ? (
                        <Typography
                            sx={{color: "text.secondary", paddingTop: "100px"}}
                            variant="h5"
                        >
                            No dataset selected for exploration
                        </Typography>
                    ) : error ? (
                        <Typography sx={{paddingTop: "100px"}} variant="h5" color="error">
                            {error}
                        </Typography>
                    ) : (
                        <div className="qtl-container">
                            {/* Plot Container */}
                            <div
                                key={`${selectedGene || selectedSnp || "plot"}-view`}
                                className={`view-container`}
                            >
                                {!selectedGene && !selectedSnp && !selectionError ? (
                                    <Typography
                                        sx={{color: "text.secondary", paddingTop: "100px"}}
                                        variant="h5"
                                    >
                                        No gene or SNP selected for exploration
                                    </Typography>
                                ) : selectionError ? (
                                    <Typography
                                        sx={{paddingTop: "100px"}}
                                        variant="h5"
                                        color="error"
                                    >
                                        {selectionError}
                                    </Typography>
                                ) : selectedCellTypes.length === 0 ? (
                                    <Typography
                                        sx={{color: "text.secondary", paddingTop: "100px"}}
                                        variant="h5"
                                    >
                                        No cell types available
                                    </Typography>
                                ) : selectedGene ? (
                                    !dataLoading &&
                                    !loading &&
                                    selectedChromosome && (
                                        // ((hasGwas && gwasData.length > 0) || !hasGwas) && (
                                        <div key={`${selectedGene}-plot`} className="gene-plot">
                                            <GeneViewPlotlyPlot
                                                dataset={datasetId}
                                                geneName={selectedGene}
                                                genes={genes}
                                                gwasData={gwasData}
                                                hasGwas={
                                                    (displayOptions?.showGwas ?? true) ? hasGwas : false
                                                }
                                                snpData={snpData}
                                                chromosome={selectedChromosome}
                                                cellTypes={selectedCellTypes}
                                                handleSelect={handleSelect}
                                                useWebGL={webGLSupported}
                                                displayOptions={displayOptions}
                                            />
                                        </div>
                                    )
                                ) : (
                                    selectedSnp &&
                                    !dataLoading &&
                                    !loading &&
                                    selectedChromosome && (
                                        <div key={`${selectedSnp}-plot`} className="snp-plot">
                                            <SNPViewPlotlyPlot
                                                dataset={datasetId}
                                                snpName={selectedSnp}
                                                snps={snps}
                                                hasGwas={
                                                    (displayOptions?.showGwas ?? true) ? hasGwas : false
                                                }
                                                geneData={geneData}
                                                chromosome={selectedChromosome}
                                                cellTypes={selectedCellTypes}
                                                handleSelect={handleSelect}
                                                useWebGL={webGLSupported}
                                                displayOptions={displayOptions}
                                            />
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ConfirmationDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    handleConfirm: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
        .isRequired,
};

export default XQTLView;
