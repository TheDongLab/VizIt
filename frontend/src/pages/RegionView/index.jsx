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
} from "@mui/material";
import { PropTypes } from "prop-types";

import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { useSearchParams } from "react-router-dom";

import "./RegionView.css";

import useDataStore from "../../store/DatatableStore.js";
import useQtlStore from "../../store/QtlStore.js";

import GeneViewPlotlyPlot from "./GeneViewPlotlyPlot.jsx";
import SNPViewPlotlyPlot from "./SNPViewPlotlyPlot.jsx";

import { ListboxComponent, StyledPopper } from "../../components/Listbox";

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

function RegionView() {
  // Get all the pre-selected values
  const [queryParams, setQueryParams] = useSearchParams();
  const urlGene = queryParams.get("gene") ?? "";
  const urlSnp = queryParams.get("snp") ?? "";
  const urlDataset = queryParams.get("dataset") ?? "";

  const { datasetRecords, fetchDatasetList } = useDataStore();
  useEffect(() => {
    fetchDatasetList();
  }, []);

  const datasetOptions = datasetRecords
    .filter((d) => d.assay.toLowerCase() === "eqtl")
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
  } = useQtlStore();
  const { loading, error } = useQtlStore();

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
          }
        }

        if (urlSnp) {
          if (snps.includes(urlSnp)) {
            setSelectedSnp(urlSnp);
          } else {
            setSelectedSnp("");
          }
        }

        // if (selectedGene && selectedGene !== "") {
        //   await fetchGeneCellTypes(datasetId);
        //   await fetchSnpData(datasetId);
        // }

        // if (selectedSnp && selectedSnp !== "") {
        //   await fetchSnpCellTypes(datasetId);
        //   await fetchGeneData(datasetId);
        // }
      } catch (error) {
        console.error("Error in data fetching:", error);
      }
    };

    initialize();
  }, [datasetId, setDataset]);

  const [geneSearchText, setGeneSearchText] = useState("");
  const [snpSearchText, setSnpSearchText] = useState("");
  const [filteredGeneList, setFilteredGeneList] = useState([]);
  const [filteredSnpList, setFilteredSnpList] = useState([]);

  useEffect(() => {
    const newParams = new URLSearchParams();
    datasetId && newParams.set("dataset", datasetId);
    selectedGene && newParams.set("gene", selectedGene);
    selectedSnp && newParams.set("snp", selectedSnp);
    setQueryParams(newParams);
  }, [datasetId, selectedGene, selectedSnp, setQueryParams]);

  const listLength = 15000; // Limit the list length for performance

  const initialSlicedGeneList = useMemo(() => {
    return geneList.slice(0, listLength);
  }, [geneList, listLength]);

  const initialSlicedSnpList = useMemo(() => {
    return snpList.slice(0, listLength);
  }, [snpList, listLength]);

  useEffect(() => {
    setFilteredSnpList(initialSlicedSnpList);
  }, [initialSlicedSnpList]);

  useEffect(() => {
    setFilteredGeneList(initialSlicedGeneList);
  }, [initialSlicedGeneList]);

  const handleGeneInputChange = (event, value) => {
    setGeneSearchText(value);
    if (!value || value === selectedGene) {
      setFilteredGeneList(initialSlicedGeneList);
    } else {
      const results = geneList.filter((id) =>
        id.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredGeneList(results.slice(0, listLength));
    }
  };

  const handleSnpInputChange = (event, value) => {
    setSnpSearchText(value);
    if (!value || value === "rs") {
      // Ignore if only the prefix is provided. There are some SNPs that aren't
      // stored in rsID format, but those are rare.
      setFilteredSnpList(initialSlicedSnpList);
    } else {
      const results = snpList.filter((id) =>
        id.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredSnpList(results.slice(0, listLength));
    }
  };

  const handleGeneAutocompleteOpen = () => {
    if (geneSearchText == selectedGene) {
      setFilteredGeneList(initialSlicedGeneList);
    }
  };

  const handleSnpAutocompleteOpen = () => {
    if (snpSearchText == selectedSnp) {
      setFilteredSnpList(initialSlicedSnpList);
    }
  };

  const [genes, setGenes] = useState([]);
  const [snps, setSnps] = useState([]);

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
      await fetchGeneCellTypes(datasetId);
      await fetchGeneChromosome(datasetId);
      const locations = await fetchGeneLocations(datasetId, 10000000);
      setGenes(locations);

      await fetchSnpData(datasetId);
      setDataLoading(false);
    } else if (isSnp) {
      setDataLoading(true);
      await fetchSnpCellTypes(datasetId);
      await fetchSnpChromosome(datasetId);
      console.time("fetchSnpLocations");
      const locations = await fetchSnpLocations(datasetId, 1500000);
      console.log("SNP locations fetched:", locations.length);
      console.timeEnd("fetchSnpLocations");
      setSnps(locations);

      await fetchGeneData(datasetId);
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneOrSnpData();
  }, [selectedGene, selectedSnp, datasetId]);

  const handleDatasetChange = (event, newValue) => {
    setDataset(newValue);
    setDatasetId(newValue);
    selectGeneOrSnp("reset", null);
  };

  /** Handles gene selection change */
  const handleGeneChange = async (event, newValue) => {
    selectGeneOrSnp("gene", newValue);
  };

  /** Handles SNP selection change */
  const handleSnpChange = async (event, newValue) => {
    selectGeneOrSnp("snp", newValue);
  };

  // click the button to fetch umap data
  const handleLoadPlot = async () => {
    await fetchGeneOrSnpData();
  };

  // Handle clicking points
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedPointData, setSelectedPointData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = useCallback((name, data) => {
    setSelectedPoint(name);
    setSelectedPointData(data);
    setIsDialogOpen(true);
  }, []);

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedPoint(null);
    setSelectedPointData(null);
  };

  const handleConfirm = () => {
    setIsDialogOpen(false);
  };

  const [renderedGraphs, setRenderedGraphs] = useState([]);
  const [isRenderingGraphs, setIsRenderingGraphs] = useState(false);

  useEffect(() => {
    if (!selectedCellTypes.length || dataLoading || loading) {
      setRenderedGraphs([]);
      return;
    }

    const renderGraphsIncrementally = async () => {
      setRenderedGraphs([]);
      setIsRenderingGraphs(true);

      const cellTypesToRender = selectedCellTypes.filter((cellType) =>
        selectedGene ? snpData[cellType] : geneData[cellType],
      );

      for (let i = 0; i < cellTypesToRender.length; i++) {
        const cellType = cellTypesToRender[i];
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay

        setRenderedGraphs((prev) => [...prev, cellType]);
      }

      setIsRenderingGraphs(false);
    };

    renderGraphsIncrementally();
  }, [
    selectedCellTypes,
    selectedGene,
    selectedSnp,
    snpData,
    geneData,
    dataLoading,
    loading,
  ]);

  // Set the initial selected gene and SNP from URL parameters
  useEffect(() => {
    if (urlGene !== selectedGene) setSelectedGene(urlGene || "");
    if (urlSnp !== selectedSnp) setSelectedSnp(urlSnp || "");
  }, []);

  return (
    <div
      className="plot-page-container"
      style={{ display: "flex", flexDirection: "column", flex: 1 }}
    >
      {/* Title Row */}
      <Box className="title-row">
        {/* TODO */}
        <Typography variant="h6">eQTL Region View</Typography>
      </Box>
      <Divider />
      <div className="plot-content">
        {/* Left Panel for Gene and SNP Selection (20%) */}
        <div className="plot-panel">
          <ConfirmationDialog
            isOpen={isDialogOpen}
            handleClose={handleClose}
            handleConfirm={handleConfirm}
            title={`Do you want to open details for ${selectedPoint ?? "point"}?`}
            description={selectedPointData ?? "No additional data available."}
          />
          <Typography variant="subtitle1">Select a Dataset </Typography>
          {/* Dataset Selection */}
          <Autocomplete
            size="small"
            disableListWrap
            options={datasetOptions}
            value={datasetId}
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
                style={{ marginBottom: "30px" }}
              />
            )}
          />

          <Typography sx={{ marginTop: "10px" }} variant="subtitle1">
            Search Gene or SNP
          </Typography>

          {/* Gene Selection */}
          <Autocomplete
            /* multiple */
            disableListWrap
            size="small"
            options={filteredGeneList}
            value={selectedGene}
            onChange={handleGeneChange}
            onOpen={handleGeneAutocompleteOpen}
            inputValue={geneSearchText}
            onInputChange={handleGeneInputChange}
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
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Search gene" variant="standard" />
            )}
          />

          {/* SNP Selection */}
          <Autocomplete
            disableListWrap
            size="small"
            options={filteredSnpList}
            value={selectedSnp}
            onChange={handleSnpChange}
            onOpen={handleSnpAutocompleteOpen}
            inputValue={snpSearchText}
            onInputChange={handleSnpInputChange}
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
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Search SNP" variant="standard" />
            )}
          />

          {/* Button to fetch data and a loading indicator*/}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              margin: "20px 0px",
            }}
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

        {/* Rirhg Plot Area (80%) */}
        <div className="plot-main">
          {(dataLoading || isRenderingGraphs) && (
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
            <Typography color="error">{error}</Typography>
          ) : (
            <div className="qtl-container">
              {/* Plot Container */}
              <div
                key={`${selectedGene || selectedSnp || "plot"}-view`}
                className={`view-container`}
              >
                {selectedCellTypes.length > 0 &&
                (selectedGene || selectedSnp) ? (
                  selectedGene ? (
                    !dataLoading &&
                    !loading &&
                    selectedChromosome && (
                      <div key={`${selectedGene}-plot`} className="gene-plot">
                        <GeneViewPlotlyPlot
                          geneName={selectedGene}
                          genes={genes}
                          snpData={snpData}
                          chromosome={selectedChromosome}
                          cellTypes={selectedCellTypes}
                          handleSelect={handleSelect}
                        />
                      </div>
                    )
                  ) : selectedSnp ? (
                    !dataLoading &&
                    !loading &&
                    selectedChromosome && (
                      <div key={`${selectedSnp}-plot`} className="snp-plot">
                        <SNPViewPlotlyPlot
                          snpName={selectedSnp}
                          snps={snps}
                          geneData={geneData}
                          chromosome={selectedChromosome}
                          cellTypes={selectedCellTypes}
                          handleSelect={handleSelect}
                        />
                      </div>
                    )
                  ) : (
                    <Typography
                      sx={{ color: "text.secondary", paddingTop: "100px" }}
                      variant="h5"
                    >
                      No gene or SNP selected for exploration
                    </Typography>
                  )
                ) : (
                  <Typography
                    sx={{ color: "text.secondary", paddingTop: "100px" }}
                    variant="h5"
                  >
                    No cell types available
                  </Typography>
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

export default RegionView;
