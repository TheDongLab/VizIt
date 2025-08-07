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
import { debounce } from "@mui/material/utils";

import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { useSearchParams } from "react-router-dom";

import "./XQTLView.css";

import useDataStore from "../../store/DatatableStore.js";
import useQtlStore from "../../store/QtlStore.js";

import GeneViewPlotlyPlot from "./GeneViewPlotlyPlot.jsx";
import SNPViewPlotlyPlot from "./SNPViewPlotlyPlot.jsx";

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

function XQTLView() {
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
      ...geneList.map((gene) => ({ type: "gene", id: gene })),
      ...snpList.map((snp) => ({ type: "snp", id: snp })),
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
      const locations = await fetchSnpLocations(datasetId, 1500000);
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
    if (urlGene !== selectedGene) setSelectedGene(urlGene || "");
    if (urlSnp !== selectedSnp) setSelectedSnp(urlSnp || "");
  }, []);

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

  useEffect(() => {
    return () => {
      setSelectedGene("");
      setSelectedSnp("");
    };
  }, []);

  return (
    <div
      className="plot-page-container"
      style={{ display: "flex", flexDirection: "column", flex: 1 }}
    >
      {/* Title Row */}
      <Box className="title-row">
        <Typography variant="h6">xQTL View</Typography>
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
          <Autocomplete
            /* multiple */
            sx={{ width: "400px" }}
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
              const { key, ...rest } = props;
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
              endIcon={<ScatterPlotIcon />}
              disabled={loading || dataLoading}
              onClick={handleLoadPlot}
            >
              {loading || dataLoading ? "Loading plots..." : "Refresh Plots"}
            </Button>
          </Box>
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
                {!selectedGene && !selectedSnp ? (
                  <Typography
                    sx={{ color: "text.secondary", paddingTop: "100px" }}
                    variant="h5"
                  >
                    No gene or SNP selected for exploration
                  </Typography>
                ) : selectedCellTypes.length === 0 ? (
                  <Typography
                    sx={{ color: "text.secondary", paddingTop: "100px" }}
                    variant="h5"
                  >
                    No cell types available
                  </Typography>
                ) : selectedGene ? (
                  !dataLoading &&
                  !loading &&
                  selectedChromosome && (
                    <div key={`${selectedGene}-plot`} className="gene-plot">
                      <GeneViewPlotlyPlot
                        dataset={datasetId}
                        geneName={selectedGene}
                        genes={genes}
                        snpData={snpData}
                        chromosome={selectedChromosome}
                        cellTypes={selectedCellTypes}
                        handleSelect={handleSelect}
                        useWebGL={webGLSupported}
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
                        geneData={geneData}
                        chromosome={selectedChromosome}
                        cellTypes={selectedCellTypes}
                        handleSelect={handleSelect}
                        useWebGL={webGLSupported}
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
