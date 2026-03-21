import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { PropTypes } from "prop-types";
import { debounce } from "@mui/material/utils";

import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSearchParams } from "react-router-dom";

import "./GenomicRegionView.css";

import useDataStore from "../../store/DatatableStore.js";
import useSignalStore from "../../store/GenomicRegionStore.js";

import RegionViewPlotlyPlot from "./RegionViewPlotlyPlot.jsx";

import { ListboxComponent, StyledPopper } from "../../components/Listbox";

import { getGeneLocation, getSnpLocation } from "../../api/qtl.js";

import { supportsWebGL } from "../../utils/webgl.js";

const webGLSupported = supportsWebGL();
// console.log("WebGL supported:", webGLSupported);

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

    const { datasetRecords, fetchDatasetList } = useDataStore();

    useEffect(() => {
        fetchDatasetList();
    }, []);

    const datasetOptions = datasetRecords
        .filter((d) => /[A-Za-z]*?(RNAseq|ATACseq)$/i.test(d.assay) && d.has_bw)
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
        fetchGeneList,
        fetchSnpList,
        fetchExonStructure,
        exonStructure,
        exonStructureTruncated,
        gwasDatasets,
        selectedGwasDatasets,
        fetchGwasDatasets,
        fetchGwasForRegion,
        gwasData,
    } = useSignalStore();
    const { loading, error } = useSignalStore();

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

    const [visibleRange, setVisibleRange] = useState({
        start: null,
        end: null,
    });

    const setRegion = useCallback(
        (chromosome, start, end) => {
            if (!chromosome || start === null || end === null) {
                console.warn(
                    "Invalid region parameters:",
                    chromosome,
                    start,
                    end,
                );
                return;
            }
            // Update both chromosome and range in a single operation
            setSelectedChromosome(chromosome);
            setSelectedRange(start, end);
            setVisibleRange({ start, end });
        },
        [setSelectedChromosome, setSelectedRange],
    );

    const ignoreNextUrlRegionRef = useRef(false);
    const firstRenderRef = useRef(true);

    const [combinedList, setCombinedList] = useState([]);
    const [filteredCombinedList, setFilteredCombinedList] = useState([]);

    useEffect(() => {
        console.log("filteredCombinedList", filteredCombinedList);
    }, [filteredCombinedList]);

    useEffect(() => {
        const initialize = async () => {
            if (!datasetId || datasetId === "") return;

            try {
                await setDataset(datasetId);
                await fetchCellTypes(datasetId);

                const genes = await fetchGeneList(datasetId);
                const snps = await fetchSnpList(datasetId);

                const combined = [
                    ...(genes || []).map((gene) => ({
                        type: "gene",
                        id: gene.id, // Ensembl ID
                        name: gene.name, // Symbol
                    })),
                    ...(snps || []).map((snp) => ({
                        type: "snp",
                        id: snp,
                    })),
                ];

                setCombinedList(combined);
                setFilteredCombinedList(combined.slice(0, listLength));

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

    const indexedList = useMemo(
        () =>
            combinedList.map((item) => ({
                original: item,
                lowercaseId: (item.id || "").toLowerCase(),
                lowercaseName: (item.name || "").toLowerCase(),
            })),
        [combinedList],
    );

    const debouncedFilter = useMemo(
        () =>
            debounce((value, setFn) => {
                const q = value.toLowerCase();
                const results = indexedList
                    .filter(
                        (item) =>
                            item.lowercaseId.includes(q) ||
                            item.lowercaseName.includes(q),
                    )
                    .map((item) => item.original);
                setFn(results.slice(0, listLength));
            }, 120),
        [indexedList],
    );

    const listLength = 500; // Limit the list length for performance

    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }

        const newParams = new URLSearchParams();

        if (datasetId) newParams.set("dataset", datasetId);

        const regionStart = visibleRange?.start ?? selectedRange?.start ?? null;
        const regionEnd = visibleRange?.end ?? selectedRange?.end ?? null;

        if (selectedChromosome && regionStart != null && regionEnd != null) {
            newParams.set(
                "region",
                `${selectedChromosome}:${regionStart}-${regionEnd}`,
            );
        }

        const current = queryParams.toString();
        const next = newParams.toString();
        if (current !== next) {
            ignoreNextUrlRegionRef.current = true;
            setQueryParams(newParams);
        }
    }, [
        datasetId,
        selectedChromosome,
        visibleRange,
        selectedRange,
        setQueryParams,
    ]);

    const handleCombinedInputChange = (event, value, reason) => {
        // always reflect the current text
        setRegionSearchText(value);

        if (!value) {
            setFilteredCombinedList(combinedList.slice(0, listLength));
        } else {
            debouncedFilter(value, setFilteredCombinedList);
        }
    };

    const handleCombinedAutocompleteOpen = () => {
        if (!regionSearchText) {
            setFilteredCombinedList(combinedList.slice(0, listLength));
        }
    };

    const handleCombinedChange = async (event, newValue) => {
        if (!newValue) {
            setRegionSearchText("");
            return;
        }

        if (typeof newValue === "string") {
            setRegionSearchText(newValue);
            return;
        }

        const id = newValue.id;

        if (newValue.type === "snp") {
            try {
                const snp = await getSnpLocation(datasetId, id);
                if (snp && snp.data) {
                    const start = Math.max(snp.data.position - 50000, 0);
                    const end = snp.data.position + 50000;
                    const chr = snp.data.chromosome;
                    setRegion(chr, start, end);
                    setRegionSearchText(`${chr}:${start}-${end}`);
                    setSelectionError("");
                } else {
                    setSelectionError(`SNP "${id}" not found in this dataset.`);
                }
            } catch (e) {
                console.error(e);
                setSelectionError(`SNP "${id}" not found in this dataset.`);
            }
        } else if (newValue.type === "gene") {
            try {
                const gene = await getGeneLocation(datasetId, id);
                if (gene && gene.data) {
                    const { chromosome, start, end } = gene.data;
                    const paddedStart = Math.max(start - 50000, 0);
                    const paddedEnd = end + 50000;

                    setRegion(chromosome, paddedStart, paddedEnd);
                    setRegionSearchText(
                        `${chromosome}:${paddedStart}-${paddedEnd}`,
                    );
                    setSelectionError("");
                } else {
                    setSelectionError(
                        `Gene "${newValue.name || id}" not found in this dataset.`,
                    );
                }
            } catch (e) {
                console.error(e);
                setSelectionError(
                    `Gene "${newValue.name || id}" not found in this dataset.`,
                );
            }
        }
    };

    const handleEnterSubmit = async () => {
        const text = regionSearchText.trim();
        if (!text) return;

        const textLower = text.toLowerCase();

        const match = combinedList.find((item) => {
            const idMatch = (item.id || "").toLowerCase() === textLower;
            const nameMatch =
                item.type === "gene" &&
                (item.name || "").toLowerCase() === textLower;
            return idMatch || nameMatch;
        });
        if (match) {
            await handleCombinedChange(null, match, "selectOption");
            return;
        }

        const region = parseRegionString(text);
        if (region) {
            setSelectionError("");
            setRegion(region.chromosome, region.start, region.end);
            setRegionSearchText(
                `${region.chromosome}:${region.start}-${region.end}`,
            );
            return;
        }

        if (textLower.startsWith("rs")) {
            try {
                const snp = await getSnpLocation(datasetId, text);
                if (snp && snp.data) {
                    const start = Math.max(snp.data.position - 50000, 0);
                    const end = snp.data.position + 50000;
                    const chr = snp.data.chromosome;
                    setRegion(chr, start, end);
                    setRegionSearchText(`${chr}:${start}-${end}`);
                    setSelectionError("");
                } else {
                    setSelectionError(
                        `SNP "${text}" not found in this dataset.`,
                    );
                }
            } catch (e) {
                console.error(e);
                setSelectionError(`SNP "${text}" not found in this dataset.`);
            }
        } else {
            try {
                const gene = await getGeneLocation(datasetId, text);
                if (gene && gene.data) {
                    const { chromosome, start, end } = gene.data;
                    const paddedStart = Math.max(start - 50000, 0);
                    const paddedEnd = end + 50000;
                    setRegion(chromosome, paddedStart, paddedEnd);
                    setRegionSearchText(
                        `${chromosome}:${paddedStart}-${paddedEnd}`,
                    );
                    setSelectionError("");
                } else {
                    setSelectionError(
                        `Gene "${text}" not found in this dataset.`,
                    );
                }
            } catch (e) {
                console.error(e);
                setSelectionError(`Gene "${text}" not found in this dataset.`);
            }
        }
    };

    useEffect(() => {
        if (datasetId) {
            fetchGwasDatasets(datasetId);
        }
    }, [datasetId]);

    const [selectionError, setSelectionError] = useState("");

    const fetchData = async (range, binSizeOverride = null) => {
        if (!datasetId || !selectedChromosome || !range) return;

        const { start, end } = range;
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

            await fetchExonStructure(datasetId, start, end);

            if (activeGwasDatasets.length > 0) {
                try {
                    await fetchGwasForRegion(
                        datasetId,
                        selectedChromosome,
                        start,
                        end,
                    );
                } catch (err) {
                    console.error("Error fetching GWAS data:", err);
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

    const handleConfirm = async () => {
        setIsDialogOpen(false);
        if (!selectedPoint) return;

        if (type === "gene") {
            try {
                const gene = await getGeneLocation(datasetId, selectedPoint);

                if (gene && gene.data) {
                    const { chromosome, start, end } = gene.data;

                    const paddedStart = Math.max(start - 50000, 0);
                    const paddedEnd = end + 50000;

                    setRegion(chromosome, paddedStart, paddedEnd);
                    setRegionSearchText(
                        `${chromosome}:${paddedStart}-${paddedEnd}`,
                    );
                    setSelectionError("");
                } else {
                    setSelectionError(
                        `Gene "${selectedPoint}" not found in this dataset.`,
                    );
                }
            } catch (err) {
                console.error("Error resolving gene from click:", err);
                setSelectionError(
                    `Error resolving gene "${selectedPoint}". Please try again.`,
                );
            }
            return;
        } else if (type === "signal") {
            const parts = selectedPoint.split("–");
            if (parts.length === 2) {
                const start = parseInt(parts[0]);
                const end = parseInt(parts[1]);
                setSelectedRange(start, end);
                setVisibleRange({ start, end });
                setRegionSearchText(`${selectedChromosome}:${start}-${end}`);
                setSelectionError("");
            }
        }
    };

    // Set the initial selected gene and SNP from URL parameters
    useEffect(() => {
        if (!urlRegion) return;

        // if we just changed URL ourselves, don't try to parse it again
        if (ignoreNextUrlRegionRef.current) {
            console.log("Ignoring URL region change:", urlRegion);
            ignoreNextUrlRegionRef.current = false;
            return;
        }

        const init = async () => {
            const parsed = parseRegionString(urlRegion);
            if (!parsed) return;

            const {
                chromosome: urlChromosome,
                start: urlStart,
                end: urlEnd,
            } = parsed;

            if (
                urlChromosome !== selectedChromosome ||
                urlStart !== selectedRange?.start ||
                urlEnd !== selectedRange?.end
            ) {
                setRegion(urlChromosome, urlStart, urlEnd);
                setRegionSearchText(`${urlChromosome}:${urlStart}-${urlEnd}`);
            }
        };
        init();
    }, [urlRegion]);

    // useEffect(() => {
    //     // when the selectedchromosome or range changes, update the region search text
    //     if (selectedChromosome && selectedRange)
    //         setRegionSearchText(
    //             `${selectedChromosome}:${selectedRange.start}-${selectedRange.end}`,
    //         );
    // }, [selectedChromosome, selectedRange]);

    // TODO Clear zustand state on unmount
    // useEffect(() => {
    //   return () => {
    //     resetQtlState();
    //   };
    // }, []);

    const [anchorEl, setAnchorEl] = useState(null);
    const [displayOptions, setDisplayOptions] = useState({
        showGrid: true,
        trackHeight: 120,
        gapHeight: 10,
        yHeightGlobal: "",
        showGwas: true,
        perTrackY: true,
    });
    const [tempDisplayOptions, setTempDisplayOptions] = useState({
        ...displayOptions,
    });

    const menuOpen = Boolean(anchorEl);

    const activeGwasDatasets = useMemo(() => {
        return displayOptions.showGwas ? selectedGwasDatasets || [] : [];
    }, [displayOptions.showGwas, selectedGwasDatasets]);

    useEffect(() => {
        if (menuOpen) {
            setTempDisplayOptions({ ...displayOptions });
        }
    }, [displayOptions, menuOpen]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setDisplayOptions({ ...tempDisplayOptions });
        setAnchorEl(null);
    };

    const handleOptionChange = (option) => (event) => {
        setTempDisplayOptions({
            ...tempDisplayOptions,
            [option]: event.target.checked,
        });
    };

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
                    let [start, end] = figure.layout.xaxis.range;

                    // Clamp at 0
                    if (start < 0) {
                        const width = end - start;
                        start = 0;
                        end = width;
                    }

                    const newRange = {
                        start: Math.floor(start),
                        end: Math.ceil(end),
                    };

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

    // Refetch data when dataset, chromosome, or selected range changes
    useEffect(() => {
        if (
            datasetId &&
            selectedChromosome &&
            selectedRange?.start != null &&
            selectedRange?.end != null
        ) {
            fetchData(selectedRange);
        }
    }, [
        datasetId,
        selectedChromosome,
        selectedRange?.start,
        selectedRange?.end,
        activeGwasDatasets,
    ]);

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
        activeGwasDatasets,
    ]);

    return (
        <div
            className="plot-page-container"
            style={{ display: "flex", flexDirection: "column", flex: 1 }}
        >
            {/* Title Row */}
            <Box className="title-row">
                <Typography variant="h6">Genomic Region View</Typography>
            </Box>
            <Divider />
            <div className="selection-row">
                <div className="control-group">
                    {/* <Typography variant="subtitle1">Select a Dataset:</Typography> */}
                    {/* Dataset Selection */}
                    <Autocomplete
                        sx={{ width: "400px" }}
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
                            const { key, ...rest } = props;
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
                    <Autocomplete
                        sx={{ width: "400px" }}
                        size="small"
                        freeSolo
                        disableListWrap
                        options={filteredCombinedList}
                        onChange={handleCombinedChange}
                        inputValue={regionSearchText}
                        onInputChange={handleCombinedInputChange}
                        onOpen={handleCombinedAutocompleteOpen}
                        getOptionLabel={(option) => {
                            if (typeof option === "string") return option;
                            if (option.type === "gene") {
                                if (option.name && option.id) {
                                    return `${option.name} (${option.id})`;
                                }
                                return option.name || option.id || "";
                            }
                            return option.id || "";
                        }}
                        isOptionEqualToValue={(option, value) =>
                            (option.id || option) === (value.id || value)
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
                            const { key, ...rest } = props;
                            if (option.type === "gene") {
                                return (
                                    <li key={key} {...rest}>
                                        {option.name
                                            ? `${option.name} (${option.id})`
                                            : option.id}
                                    </li>
                                );
                            }
                            return (
                                <li key={key} {...rest}>
                                    {option.id}
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="chr:start-end, gene symbol or SNP rsID"
                                variant="standard"
                                // Pressing Enter should parse as region/gene/SNP
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleEnterSubmit();
                                    }
                                }}
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
                            endIcon={<ScatterPlotIcon />}
                            disabled={loading || dataLoading}
                            onClick={handleLoadPlot}
                        >
                            {loading || dataLoading
                                ? "Loading plots..."
                                : "Refresh Plots"}
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
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        marginThreshold={50}
                        PaperProps={{
                            style: {
                                width: "400px",
                                padding: "10px",
                            },
                        }}
                    >
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={tempDisplayOptions.showGrid}
                                        onChange={handleOptionChange(
                                            "showGrid",
                                        )}
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
                                <Typography variant="body">
                                    Track height:
                                </Typography>
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
                                <Typography variant="body">
                                    Gap height:
                                </Typography>
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
                            </Box>
                        </MenuItem>
                        {!displayOptions.perTrackY && (
                            <MenuItem>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        width: "100%",
                                    }}
                                >
                                    <Typography variant="body">
                                        Global y-axis height:
                                    </Typography>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={tempDisplayOptions.yHeightGlobal}
                                        onChange={(e) =>
                                            setTempDisplayOptions({
                                                ...tempDisplayOptions,
                                                yHeightGlobal:
                                                    e.target.value === ""
                                                        ? ""
                                                        : Number(
                                                              e.target.value,
                                                          ),
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
                                </Box>
                            </MenuItem>
                        )}
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={tempDisplayOptions.perTrackY}
                                        onChange={(e) =>
                                            setTempDisplayOptions({
                                                ...tempDisplayOptions,
                                                perTrackY: e.target.checked,
                                            })
                                        }
                                    />
                                }
                                label="Separate y-axis height per track"
                            />
                        </MenuItem>
                        {tempDisplayOptions.perTrackY && (
                            <MenuItem disableGutters>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.5,
                                        width: "100%",
                                        px: 2,
                                        pb: 1,
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 600, mb: 0.5 }}
                                    >
                                        Per-track y-axis overrides
                                    </Typography>

                                    {availableCellTypes.map((ct) => (
                                        <Box
                                            key={ct}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                pl: 1.5, // Indent rows under heading
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {ct}:
                                            </Typography>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={
                                                    tempDisplayOptions
                                                        .trackYHeights?.[ct] ??
                                                    ""
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value === ""
                                                            ? ""
                                                            : Number(
                                                                  e.target
                                                                      .value,
                                                              );
                                                    setTempDisplayOptions(
                                                        (prev) => ({
                                                            ...prev,
                                                            trackYHeights: {
                                                                ...prev.trackYHeights,
                                                                [ct]: value,
                                                            },
                                                        }),
                                                    );
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
                                        </Box>
                                    ))}
                                </Box>
                            </MenuItem>
                        )}
                        <MenuItem>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={tempDisplayOptions.showGwas}
                                        onChange={handleOptionChange(
                                            "showGwas",
                                        )}
                                    />
                                }
                                label="Show GWAS data"
                            />
                        </MenuItem>
                        <Box sx={{ mt: 1, p: 1, pb: 0.5 }}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                    setDisplayOptions({
                                        ...tempDisplayOptions,
                                    });
                                    setAnchorEl(null); // close the menu
                                }}
                            >
                                Apply changes
                            </Button>
                        </Box>
                    </Menu>
                </div>
            </div>
            <div className="plot-content">
                <ConfirmationDialog
                    isOpen={isDialogOpen}
                    handleClose={handleClose}
                    handleConfirm={handleConfirm}
                    title={`Do you want to open details for ${selectedPoint ?? "point"}?`}
                    description={
                        selectedPointData ?? "No additional data available."
                    }
                />

                {/* Plot Area */}
                <div className="plot-main">
                    {dataLoading && (
                        <>
                            <Box sx={{ width: "100%" }}>
                                <LinearProgress />
                            </Box>
                        </>
                    )}

                    {datasetId === "" ||
                    datasetId === "all" ||
                    datasetId == null ? (
                        <Typography
                            sx={{
                                color: "text.secondary",
                                paddingTop: "100px",
                            }}
                            variant="h5"
                        >
                            No dataset selected for exploration
                        </Typography>
                    ) : error ? (
                        <Typography
                            sx={{ paddingTop: "100px" }}
                            variant="h5"
                            color="error"
                        >
                            {error}
                        </Typography>
                    ) : (
                        <div className="qtl-container">
                            {/* Plot Container */}
                            <div
                                key={"signal-view"}
                                className={`view-container`}
                            >
                                {!selectedChromosome &&
                                !selectedRange &&
                                !selectionError ? (
                                    <Typography
                                        sx={{
                                            color: "text.secondary",
                                            paddingTop: "100px",
                                        }}
                                        variant="h5"
                                    >
                                        No genomic region selected for
                                        exploration
                                    </Typography>
                                ) : selectionError ? (
                                    <Typography
                                        sx={{ paddingTop: "100px" }}
                                        variant="h5"
                                        color="error"
                                    >
                                        {selectionError}
                                    </Typography>
                                ) : availableCellTypes.length === 0 ? (
                                    <Typography
                                        sx={{
                                            color: "text.secondary",
                                            paddingTop: "100px",
                                        }}
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
                                            key={"region-plot"}
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
                                                gwasDatasets={gwasDatasets.filter(
                                                    (ds) =>
                                                        activeGwasDatasets.includes(
                                                            ds.id,
                                                        ),
                                                )}
                                                gwasData={gwasData}
                                                handleSelect={handleSelect}
                                                useWebGL={webGLSupported}
                                                displayOptions={displayOptions}
                                                handlePlotUpdate={
                                                    handlePlotUpdate
                                                }
                                                binSize={currentBinSize}
                                                exonStructure={exonStructure}
                                                exonStructureTruncated={
                                                    exonStructureTruncated
                                                }
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
