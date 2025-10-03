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

import "./GenomicRegionView.css";

import useDataStore from "../../store/DatatableStore.js";
import useSignalStore from "../../store/GenomicRegionStore.js";

import RegionViewPlotlyPlot from "./RegionViewPlotlyPlot.jsx";

import {ListboxComponent, StyledPopper} from "../../components/Listbox";

import {supportsWebGL} from "../../utils/webgl.js";

const webGLSupported = supportsWebGL();
console.log("WebGL supported:", webGLSupported);

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

function GenomicRegionView() {
    // Get all the pre-selected values
    const [queryParams, setQueryParams] = useSearchParams();
    const urlDataset = queryParams.get("dataset") ?? "";
    const urlRegion = queryParams.get("region") ?? "";

    const {datasetRecords, fetchDatasetList,setDatasetRecords} = useDataStore();
    const {checkBWDataExists} = useSignalStore()

    useEffect(() => {
        fetchDatasetList();
    }, []);

    const datasetOptions = datasetRecords
    .filter((d) => d.assay.toLowerCase().endsWith("qtl") && d.has_bw)
    .map((d) => d.dataset_id);

    const [datasetId, setDatasetId] = useState(urlDataset);
    const [datasetSearchText, setDatasetSearchText] = useState("");

    const {
        setDataset,
        dataset,
        selectedChromosome,
        selectedRange,
        setSelectedRange,
        setSelectedChromosome,
        availableCellTypes,
        signalData,
        fetchCellTypes,
        fetchSignalData,
        fetchGeneLocations,
        fetchGwas,
    } = useSignalStore();
    const {loading, error} = useSignalStore();

    const [dataLoading, setDataLoading] = useState(false);

    const parseRegionString = (str) => {
        if (str === null || str === undefined || str.trim() === "") {
            console.log("inside parseRegionString: empty string");
        }
        // Parse formats: "chr1:1000-2000", "1:1,000-2,000", "chr1 1000 2000"
        const match = str.match(/(chr)?(\w+)[:\s]+([\d,]+)[-\s]+([\d,]+)/i);
        if (match) {
            return {
                chromosome: match[1] ? match[1] + match[2] : "chr" + match[2],
                start: parseInt(match[3].replace(/,/g, "")),
                end: parseInt(match[4].replace(/,/g, "")),
            };
        }
        return null;
    };

    const setRegion = useCallback(
        (chromosome, start, end) => {
            if (!chromosome || start === null || end === null) {
                console.warn("Invalid region parameters:", chromosome, start, end);
                return;
            }
            // Update both chromosome and range in a single operation
            setSelectedChromosome(chromosome);
            setSelectedRange(start, end);
            setVisibleRange({start, end});
        },
        [setSelectedChromosome, setSelectedRange],
    );

    useEffect(() => {
        const initialize = async () => {
            if (!datasetId || datasetId === "") return;

            try {
                await setDataset(datasetId);
                await fetchCellTypes(datasetId);

                // if (urlRegion) {
                //   const parsedRegion = parseRegionString(urlRegion);
                //   if (parsedRegion) {
                //     setRegion(
                //       parsedRegion.chromosome,
                //       parsedRegion.start,
                //       parsedRegion.end,
                //     );
                //     setRegionSearchText(
                //       `${parsedRegion.chromosome}:${parsedRegion.start}-${parsedRegion.end}`,
                //     );
                //   } else {
                //     console.warn("Invalid region format in URL:", urlRegion);
                //   }
                // }
            } catch (error) {
                console.error("Error in data fetching:", error);
            }
        };

        initialize();
    }, [datasetId, setDataset]);

    const [nearbyGenes, setNearbyGenes] = useState([]);
    const [regionSearchText, setRegionSearchText] = useState("");

    useEffect(() => {
        const newParams = new URLSearchParams();
        if (datasetId) newParams.set("dataset", datasetId);
        if (
            selectedChromosome &&
            selectedRange &&
            selectedRange.start !== undefined &&
            selectedRange.start !== null &&
            selectedRange.end !== undefined &&
            selectedRange.end !== null
        ) {
            newParams.set(
                "region",
                `${selectedChromosome}:${selectedRange.start}-${selectedRange.end}`,
            );
        }
        setQueryParams(newParams);
    }, [datasetId, selectedChromosome, selectedRange, setQueryParams]);

    const handleRegionChange = (event) => {
        setRegionSearchText(event.target.value);
    };

    const handleRegionSubmit = async () => {
        const region = parseRegionString(regionSearchText);
        if (region) {
            setRegion(region.chromosome, region.start, region.end);

            // try {
            //   await fetchData();
            // } catch (error) {
            //   console.error("Error fetching data:", error);
            //   setSelectionError("Failed to fetch data for this region.");
            // }
        } else {
            setSelectionError("Invalid region format. Use: chr1:1000000-2000000");
        }
    };

    const [gwasData, setGwasData] = useState([]);
    const [hasGwas, setHasGwas] = useState(true);
    const [selectionError, setSelectionError] = useState("");

    const fetchData = async (range, binSizeOverride = null) => {
        if (!datasetId || !selectedChromosome || !range) return;

        const {start, end} = range;
        if (start == null || end == null || start >= end) {
            setSelectionError("Invalid region range");
            return;
        }

        setDataLoading(true);
        setSelectionError("");

        try {
            await fetchCellTypes(datasetId);

            const locations = await fetchGeneLocations(datasetId, start, end);
            setNearbyGenes(locations);

            let gwas;
            if (hasGwas !== false) {
                if (!(displayOptions?.showGwas ?? true)) {
                    setGwasData([]);
                    gwas = [];
                } else {
                    try {
                        gwas = await fetchGwas(datasetId, start, end);
                        setHasGwas(true);
                        setGwasData(
                            gwas.map(
                                ({snp_id, p_value, beta_value, position, ...rest}) => ({
                                    ...rest,
                                    id: snp_id,
                                    y: -Math.log10(Math.max(p_value, 1e-20)),
                                    beta: beta_value,
                                    x: position,
                                    snp_id,
                                    p_value,
                                    position,
                                }),
                            ),
                        );
                        console.log(gwasData);
                    } catch (err) {
                        console.error("Error fetching GWAS data:", err);
                        setHasGwas(false);
                        setGwasData([]);
                    }
                }
            }

            const binSize =
                binSizeOverride ?? Math.ceil(Math.abs(end - start) * 0.002);

            await fetchSignalData(datasetId, start, end, binSize);
            setCurrentBinSize(binSize);
        } catch (err) {
            console.error("Error fetching signal data:", err);
            setSelectionError(
                "Error fetching data for the selected region. Please check your selection.",
            );
        } finally {
            setDataLoading(false);
        }
    };

    // useEffect(() => {
    //   if (
    //     selectedRange &&
    //     selectedChromosome &&
    //     datasetId &&
    //     selectedRange.start != null &&
    //     selectedRange.end != null
    //   ) {
    //     fetchData(selectedRange);
    //   }
    // }, [selectedRange, selectedChromosome, datasetId]);

    const handleDatasetChange = (event, newValue) => {
        setDataset(newValue);
        setDatasetId(newValue);
        // setSelectedChromosome(null);
        // setSelectedRange(null, null );
    };

    // click the button to fetch umap data
    const handleLoadPlot = async () => {
        await fetchData(selectedRange);
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
                console.warn("Clicked on gene. Not implemented!");
                return;
            } else if (type === "signal") {
                const parts = selectedPoint.split("–");
                if (parts.length == 2) {
                    const start = parseInt(parts[0]);
                    const end = parseInt(parts[1]);
                    setSelectedRange(start, end);
                    setVisibleRange({start, end});
                }
            }
        }
    };

    // Set the initial selected gene and SNP from URL parameters
    useEffect(() => {
        if (!urlRegion) return;

        const parsed = parseRegionString(urlRegion);
        if (!parsed) return;

        const {chromosome: urlChromosome, start: urlStart, end: urlEnd} = parsed;

        if (
            urlChromosome !== selectedChromosome ||
            urlStart !== selectedRange.start ||
            urlEnd !== selectedRange.end
        ) {
            setRegion(urlChromosome, urlStart, urlEnd);
            setRegionSearchText(`${urlChromosome}:${urlStart}-${urlEnd}`);
        }
    }, [urlRegion]);

    useEffect(() => {
        // when the selectedchromosome or range changes, update the region search text
        if (selectedChromosome && selectedRange)
            setRegionSearchText(
                `${selectedChromosome}:${selectedRange.start}-${selectedRange.end}`,
            );
    }, [selectedChromosome, selectedRange]);

    // TODO Clear zustand state on unmount
    // useEffect(() => {
    //   return () => {
    //     resetQtlState();
    //   };
    // }, []);

    const [anchorEl, setAnchorEl] = useState(null);
    const [displayOptions, setDisplayOptions] = useState({
        showGrid: true,
        trackHeight: 50,
        gapHeight: 12,
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

    const [visibleRange, setVisibleRange] = useState({start: null, end: null});
    const [currentBinSize, setCurrentBinSize] = useState(1000);

    // const debounce = (func, wait) => {
    //   let timeout;
    //   return function executedFunction(...args) {
    //     const later = () => {
    //       clearTimeout(timeout);
    //       func(...args);
    //     };
    //     clearTimeout(timeout);
    //     timeout = setTimeout(later, wait);
    //   };
    // };

    // Memoize the debounced function properly
    const debouncedUpdate = useMemo(
        () =>
            debounce((figure) => {
                if (
                    figure &&
                    figure.layout &&
                    figure.layout.xaxis &&
                    figure.layout.xaxis.range
                ) {
                    const [start, end] = figure.layout.xaxis.range;
                    const newRange = {start: Math.floor(start), end: Math.ceil(end)};

                    if (
                        !visibleRange ||
                        newRange.start !== visibleRange.start ||
                        newRange.end !== visibleRange.end
                    ) {
                        setVisibleRange(newRange);
                    }
                }
            }, 500),
        [visibleRange, setVisibleRange],
    );

    // Handle plot updates and visible range changes
    const handlePlotUpdate = useCallback(
        (figure) => {
            debouncedUpdate(figure);
        },
        [debouncedUpdate],
    );

    useEffect(() => {
        if (
            visibleRange &&
            visibleRange.start != null &&
            visibleRange.end != null &&
            selectedChromosome &&
            datasetId
        ) {
            const binSize = Math.ceil(
                Math.abs(visibleRange.end - visibleRange.start) * 0.002,
            );

            // Only fetch if the bin size changed significantly or was panned
            if (
                !currentBinSize ||
                binSize !== currentBinSize ||
                visibleRange.start !== selectedRange.start ||
                visibleRange.end !== selectedRange.end
            ) {
                fetchData(visibleRange, binSize);
            }
        }
    }, [
        visibleRange,
        selectedChromosome,
        datasetId,
        currentBinSize,
        selectedRange,
        hasGwas,
    ]);

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
                <Typography variant="h6">Genomic Region View</Typography>
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
                    <TextField
                        sx={{width: "400px"}}
                        size="small"
                        value={regionSearchText}
                        onChange={handleRegionChange}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                handleRegionSubmit();
                            }
                        }}
                        placeholder="chr1:1000000-2000000 or chr1 1000000 2000000"
                        label="Enter genomic region"
                        variant="standard"
                        /* helperText="Format: chromosome:start-end or chromosome start end" */
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
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={displayOptions.showGwas}
                                        onChange={handleOptionChange("showGwas")}
                                    />
                                }
                                label="Show GWAS data"
                            />
                        </MenuItem>
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
                            <div key={"signal-view"} className={`view-container`}>
                                {!selectedChromosome && !selectedRange && !selectionError ? (
                                    <Typography
                                        sx={{color: "text.secondary", paddingTop: "100px"}}
                                        variant="h5"
                                    >
                                        No genomic region selected for exploration
                                    </Typography>
                                ) : selectionError ? (
                                    <Typography
                                        sx={{paddingTop: "100px"}}
                                        variant="h5"
                                        color="error"
                                    >
                                        {selectionError}
                                    </Typography>
                                ) : availableCellTypes.length === 0 ? (
                                    <Typography
                                        sx={{color: "text.secondary", paddingTop: "100px"}}
                                        variant="h5"
                                    >
                                        No cell types available
                                    </Typography>
                                ) : (
                                    /* !dataLoading && */
                                    /* !loading && */
                                    selectedChromosome &&
                                    selectedRange && (
                                        // ((hasGwas && gwasData.length > 0) || !hasGwas) && (
                                        <div
                                            key={`${selectedChromosome}-${selectedRange.start}-${selectedRange.end}-plot`}
                                            className="region-plot"
                                        >
                                            <RegionViewPlotlyPlot
                                                dataset={datasetId}
                                                chromosome={selectedChromosome}
                                                selectedRange={selectedRange}
                                                visibleRange={visibleRange}
                                                cellTypes={availableCellTypes}
                                                signalData={signalData}
                                                nearbyGenes={nearbyGenes}
                                                gwasData={gwasData}
                                                hasGwas={
                                                    (displayOptions?.showGwas ?? true) ? hasGwas : false
                                                }
                                                handleSelect={handleSelect}
                                                useWebGL={webGLSupported}
                                                displayOptions={displayOptions}
                                                handlePlotUpdate={handlePlotUpdate}
                                                binSize={currentBinSize}
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

export default GenomicRegionView;
