import { useEffect, useState, useMemo, useCallback } from "react";
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

import { supportsWebGL } from "../../utils/webgl.js";

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

  const { datasetRecords, fetchDatasetList } = useDataStore();
  useEffect(() => {
    fetchDatasetList();
  }, []);

  const datasetOptions = datasetRecords
    .filter((d) => d.assay.toLowerCase().endsWith("signal"))
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

  const setRegion = useCallback(
    (chromosome, start, end) => {
      if (!chromosome || start === null || end === null) {
        console.warn("Invalid region parameters:", chromosome, start, end);
        return;
      }
      // Update both chromosome and range in a single operation
      setSelectedChromosome(chromosome);
      setSelectedRange(start, end);
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
      selectedRange.start &&
      selectedRange.end
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
    console.log("Submitting region:", regionSearchText);
    const region = parseRegionString(regionSearchText);
    if (region) {
      console.log("Parsed region:", region);

      setRegion(region.chromosome, region.start, region.end);
      console.log("however", selectedChromosome, selectedRange);

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

  useEffect(() => {
    console.log("WATCH IS RUN AGAIN", selectedChromosome, selectedRange);
  }, [selectedChromosome, selectedRange]);

  const [selectionError, setSelectionError] = useState("");

  const fetchData = async () => {
    if (!datasetId) return;

    if (!selectedRange) {
      console.warn("Selected range is null");
      return;
    }

    if (!selectedChromosome) {
      console.warn("Selected chromosome is null");
      return;
    }

    const chromosome = selectedChromosome;
    const { start, end } = selectedRange;
    console.log("INSIDE FETCHDATA", chromosome, start, end);

    if (
      !chromosome ||
      start === null ||
      start === undefined ||
      end === null ||
      end === undefined
    ) {
      console.warn("Error: Incomplete region selection");
      return;
    } else if (start >= end) {
      console.warn("Error: Start position must be less than end position");
      setSelectionError("Start position must be less than end position.");
    } else {
      setDataLoading(true);
      setSelectionError("");
      console.log(
        "(Inside fetchData) Fetching data for:",
        chromosome,
        start,
        end,
      );
      try {
        await fetchCellTypes(datasetId);
        const padding = Math.ceil(Math.abs(start - end) * 0.25);
        const s = Math.max(0, start - padding);
        const e = Math.max(0, end + padding);
        const locations = await fetchGeneLocations(datasetId, s, e);

        setNearbyGenes(locations);

        // let gwas;
        // try {
        //   gwas = await fetchGwasForGene(datasetId, 1500000);
        //   setHasGwas(true);
        //   const gwasLocations = gwas.map(
        //     ({ snp_id, p_value, beta_value, position, ...rest }) => ({
        //       ...rest,
        //       id: snp_id,
        //       y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
        //       beta: beta_value,
        //       x: position,
        //       snp_id,
        //       p_value,
        //       position,
        //     }),
        //   );
        //   setGwasData(gwasLocations);
        // } catch (error) {
        //   console.error("Error fetching GWAS data:", error);
        //   setHasGwas(false);
        //   setGwasData([]);
        // }

        const binSize = Math.ceil(Math.abs(end - start) * 0.005);
        console.log(`fetchSignalData(${datasetId}, ${s}, ${e}, ${binSize})`);
        console.log(s, e, binSize, e - s);
        await fetchSignalData(datasetId, s, e, binSize);
        console.log("Fetched signal data:", signalData);
      } catch (error) {
        console.error("Error fetching signal data:", error);
        setSelectionError(
          "Error fetching data for the selected region. Please check your selection.",
        );
        setDataLoading(false);
        return;
      } finally {
        setDataLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRange, selectedChromosome, datasetId]);

  const handleDatasetChange = (event, newValue) => {
    setDataset(newValue);
    setDatasetId(newValue);
    // setSelectedChromosome(null);
    // setSelectedRange(null, null );
  };

  // click the button to fetch umap data
  const handleLoadPlot = async () => {
    await fetchData();
  };

  // Handle clicking points
  // const [selectedPoint, setSelectedPoint] = useState(null);
  // const [selectedPointData, setSelectedPointData] = useState(null);
  // const [type, setType] = useState(null);
  // const [isDialogOpen, setIsDialogOpen] = useState(false);

  // const handleSelect = useCallback((name, data, type) => {
  //   setSelectedPoint(name);
  //   setSelectedPointData(data);
  //   setType(type);
  //   setIsDialogOpen(true);
  // }, []);

  // const handleClose = () => {
  //   setIsDialogOpen(false);
  //   setSelectedPoint(null);
  //   setSelectedPointData(null);
  // };

  // const handleConfirm = () => {
  //   setIsDialogOpen(false);
  //   if (selectedPoint) {
  //     if (type === "gene") {
  //       selectGeneOrSnp("gene", selectedPoint);
  //     } else if (type === "snp") {
  //       selectGeneOrSnp("snp", selectedPoint);
  //     }
  //   }
  // };

  // Set the initial selected gene and SNP from URL parameters
  useEffect(() => {
    if (!urlRegion) return;

    const parsed = parseRegionString(urlRegion);
    if (!parsed) return;

    const { chromosome: urlChromosome, start: urlStart, end: urlEnd } = parsed;

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
    console.log(selectedChromosome, selectedRange);
  }, [selectedChromosome, selectedRange]);

  useEffect(() => {
    console.log(regionSearchText, selectedChromosome, selectedRange);
  }, [regionSearchText]);

  // TODO Clear zustand state on unmount
  // useEffect(() => {
  //   return () => {
  //     resetQtlState();
  //   };
  // }, []);

  const [anchorEl, setAnchorEl] = useState(null);
  const [displayOptions, setDisplayOptions] = useState({
    showDashedLine: true,
    crossGapDashedLine: true,
    dashedLineColor: "#000000",
    showGrid: true,
    trackHeight: 50,
    gapHeight: 12,
  });
  const [tempDisplayOptions, setTempDisplayOptions] = useState({
    ...displayOptions,
  });

  const menuOpen = Boolean(anchorEl);

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
    // Update immediately for switches
    if (option !== "dashedLineColor") {
      setDisplayOptions({
        ...displayOptions,
        [option]: event.target.checked,
      });
    }
  };

  const [visibleRange, setVisibleRange] = useState(null);
  const [isZooming, setIsZooming] = useState(false);
  const [currentBinSize, setCurrentBinSize] = useState(null);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Handle plot updates and visible range changes
  const handlePlotUpdate = useCallback(
    debounce((figure) => {
      if (
        figure &&
        figure.layout &&
        figure.layout.xaxis &&
        figure.layout.xaxis.range
      ) {
        const [start, end] = figure.layout.xaxis.range;
        const newRange = { start: Math.floor(start), end: Math.ceil(end) };

        // Only update if the range has actually changed
        if (
          !visibleRange ||
          newRange.start !== visibleRange.start ||
          newRange.end !== visibleRange.end
        ) {
          setVisibleRange(newRange);
        }
      }
    }, 500),
    [visibleRange], // Add visibleRange to dependencies
  );

  useEffect(() => {
    if (visibleRange && selectedChromosome && datasetId) {
      const rangeSize = visibleRange.end - visibleRange.start;

      // Determine appropriate bin size based on zoom level
      // let binSize;
      // if (rangeSize <= 100000) {
      //   binSize = 1000; // High resolution for close zoom
      // } else if (rangeSize <= 1000000) {
      //   binSize = 10000; // Medium resolution
      // } else {
      //   binSize = 100000; // Low resolution for wide view
      // }
      const binSize = Math.ceil(
        Math.abs(visibleRange.end - visibleRange.start) * 0.005,
      );

      // Only fetch if the bin size changed significantly or was panned
      if (
        !currentBinSize ||
        binSize !== currentBinSize ||
        visibleRange.start !== selectedRange.start ||
        visibleRange.end !== selectedRange.end
      ) {
        setCurrentBinSize(binSize);
        fetchDataForRange(visibleRange, binSize);
      }
    }
  }, [visibleRange, selectedChromosome, datasetId]);

  // Separate function to fetch data for a specific range
  const fetchDataForRange = async (range, binSize) => {
    if (!datasetId) return;

    if (!range) {
      console.warn("Selected range is null");
      return;
    }

    if (!selectedChromosome) {
      console.warn("Selected chromosome is null");
      return;
    }

    const chromosome = selectedChromosome;
    const { start, end } = range;
    console.log("INSIDE FETCHDATAFORRANGE", chromosome, start, end);

    if (
      !chromosome ||
      start === null ||
      start === undefined ||
      end === null ||
      end === undefined
    ) {
      console.warn("Error: Incomplete region selection");
      return;
    } else if (start >= end) {
      console.warn("Error: Start position must be less than end position");
      setSelectionError("Start position must be less than end position.");
    } else {
      setDataLoading(true);
      setSelectionError("");
      console.log(
        "(Inside fetchData) Fetching data for:",
        chromosome,
        start,
        end,
      );
      try {
        await fetchCellTypes(datasetId);
        const locations = await fetchGeneLocations(datasetId, start, end);

        setNearbyGenes(locations);

        // let gwas;
        // try {
        //   gwas = await fetchGwasForGene(datasetId, 1500000);
        //   setHasGwas(true);
        //   const gwasLocations = gwas.map(
        //     ({ snp_id, p_value, beta_value, position, ...rest }) => ({
        //       ...rest,
        //       id: snp_id,
        //       y: -Math.log10(Math.max(p_value, 1e-20)), // Avoid log10(0)
        //       beta: beta_value,
        //       x: position,
        //       snp_id,
        //       p_value,
        //       position,
        //     }),
        //   );
        //   setGwasData(gwasLocations);
        // } catch (error) {
        //   console.error("Error fetching GWAS data:", error);
        //   setHasGwas(false);
        //   setGwasData([]);
        // }

        await fetchSignalData(datasetId, start, end, binSize);
        console.log("Fetched signal data:", signalData);
      } catch (error) {
        console.error("Error fetching signal data:", error);
        setSelectionError(
          "Error fetching data for the selected region. Please check your selection.",
        );
        setDataLoading(false);
        return;
      } finally {
        setDataLoading(false);
      }
    }
  };

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
          {/* <label>Select Gene or SNP:</label> */}
          {/* Gene Selection */}
          <TextField
            sx={{ width: "400px" }}
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
              endIcon={<ScatterPlotIcon />}
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
              <SettingsIcon />
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                    sx={{ height: "30px" }}
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
                  sx={{ height: "30px" }}
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
                  sx={{ height: "30px" }}
                >
                  Save
                </Button>
              </Box>
            </MenuItem>
          </Menu>
        </div>
      </div>
      <div className="plot-content">
        {/* <ConfirmationDialog */}
        {/*   isOpen={isDialogOpen} */}
        {/*   handleClose={handleClose} */}
        {/*   handleConfirm={handleConfirm} */}
        {/*   title={`Do you want to open details for ${selectedPoint ?? "point"}?`} */}
        {/*   description={selectedPointData ?? "No additional data available."} */}
        {/* /> */}

        {/* Plot Area */}
        <div className="plot-main">
          {dataLoading && (
            <>
              <Box sx={{ width: "100%" }}>
                <LinearProgress />
              </Box>
            </>
          )}

          {datasetId === "" || datasetId === "all" || datasetId == null ? (
            <Typography
              sx={{ color: "text.secondary", paddingTop: "100px" }}
              variant="h5"
            >
              No dataset selected for exploration
            </Typography>
          ) : error ? (
            <Typography sx={{ paddingTop: "100px" }} variant="h5" color="error">
              {error}
            </Typography>
          ) : (
            <div className="qtl-container">
              {/* Plot Container */}
              <div key={"signal-view"} className={`view-container`}>
                {!selectedChromosome && !selectedRange && !selectionError ? (
                  <Typography
                    sx={{ color: "text.secondary", paddingTop: "100px" }}
                    variant="h5"
                  >
                    No genomic region selected for exploration
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
                    sx={{ color: "text.secondary", paddingTop: "100px" }}
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
                        /* gwasData={gwasData} */
                        /* hasGwas={hasGwas} */
                        /* handleSelect={handleSelect} */
                        useWebGL={webGLSupported}
                        displayOptions={displayOptions}
                        handlePlotUpdate={handlePlotUpdate}
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
