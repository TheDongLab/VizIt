import { useEffect, useState } from "react";
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
} from "@mui/material";

import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { useSearchParams } from "react-router-dom";

import "./RegionView.css";

import useDataStore from "../../store/DatatableStore.js";
import useQtlStore from "../../store/QtlStore.js";
import { getGenePositions, getSnpPosition } from "../../api/qtl.js";

import GeneViewPlotlyPlot from "./GeneViewPlotlyPlot.jsx";

// import ListboxComponent from "../../components/Listbox";
import { ListboxComponent, StyledPopper } from "../../components/Listbox";

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
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (!datasetId || datasetId === "") return;

      try {
        await setDataset(datasetId);
        await fetchGeneList(datasetId);
        await fetchSnpList(datasetId);

        // if the selectedgene is not in the list, reset it
        if (urlGene && !geneList.includes(urlGene)) {
          setSelectedGene("");
        }
        // if the selectedsnp is not in the list, reset it
        if (urlSnp && !snpList.includes(urlSnp)) {
          setSelectedSnp("");
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
  }, [datasetId]);

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
  }, [datasetId, selectedGene, selectedSnp]);

  const listLength = 15000; // Limit the list length for performance

  useEffect(() => {
    setFilteredSnpList(snpList.slice(0, listLength));
  }, [snpList]);

  useEffect(() => {
    setFilteredGeneList(geneList.slice(0, listLength));
  }, [geneList]);

  const handleGeneInputChange = (event, value) => {
    setGeneSearchText(value);
    if (!value || value === selectedGene) {
      setFilteredGeneList(geneList.slice(0, listLength));
    } else {
      const results = geneList.filter((id) =>
        id.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredGeneList(results.slice(0, listLength));
    }
  };

  const handleSnpInputChange = (event, value) => {
    setSnpSearchText(value);
    if (!value) {
      setFilteredSnpList(snpList.slice(0, listLength));
    } else if (value === "rs") {
      setFilteredSnpList(snpList.slice(0, listLength));
    } else {
      const results = snpList.filter((id) =>
        id.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredSnpList(results.slice(0, listLength));
    }
  };

  const handleGeneAutocompleteOpen = () => {
    if (geneSearchText == selectedGene) {
      setFilteredGeneList(geneList.slice(0, listLength));
    }
  };

  const handleSnpAutocompleteOpen = () => {
    if (snpSearchText == selectedSnp) {
      setFilteredSnpList(snpList.slice(0, listLength));
    }
  };

  const fetchGeneOrSnpData = async () => {
    if (!datasetId) return;
    const isGene = selectedGene && selectedGene !== "";
    const isSnp = selectedSnp && selectedSnp !== "";

    // TODO clear the graph if nothing is selected?

    if (!isGene && !isSnp) {
      return;
    } else if (isGene && isSnp) {
      console.warn("Error: Both gene and SNP are selected.");
    } else if (isGene) {
      setDataLoading(true);
      await fetchGeneCellTypes(datasetId);
      const genePositions = await getGenePositions(datasetId, selectedGene);
      await setGeneStart(genePositions.data.start);
      await setGeneEnd(genePositions.data.end);
      console.log("gene positions", geneStart, geneEnd);

      await fetchSnpData(datasetId);
      setDataLoading(false);
    } else if (isSnp) {
      setDataLoading(true);
      await fetchSnpCellTypes(datasetId);
      const snpPosition = await getSnpPosition(datasetId, selectedSnp);
      await setSnpPosition(snpPosition);

      await fetchGeneData(datasetId);
      console.log("snp position", snpPosition);
      setDataLoading(false);
    }
  };

  useEffect(() => {
    console.log("genes", geneList.length);
    console.log("snps", snpList.length);
  }, [geneList, snpList]);

  const [geneStart, setGeneStart] = useState(null);
  const [geneEnd, setGeneEnd] = useState(null);
  const [snpPosition, setSnpPosition] = useState(null);

  useEffect(() => {
    fetchGeneOrSnpData();
  }, [selectedGene, selectedSnp, datasetId]);

  const handleDatasetChange = (event, newValue) => {
    // TODO clear both gene and snp selections?
    setDataset(newValue);
    setDatasetId(newValue);
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
        {/* Right Panel for Sample & Gene Selection (20%) */}
        <div className="plot-panel">
          <Typography variant="subtitle1">Select a Dataset </Typography>
          {/* Dataset Selection */}
          <Autocomplete
            size="small"
            disableListWrap
            options={datasetOptions}
            value={datasetId}
            /* value={datasetOptions.includes(datasetId) ? datasetId : null} */
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

          {/* Gene Selection with Fuzzy Search & Chips */}
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

          {/* SNP Selection with Fuzzy Search & Chips */}
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

          {/* a button to fetch data and a loading indicator*/}
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
              {loading ? "Loading plots..." : "Refresh Plots"}
            </Button>
          </Box>
        </div>

        {/* Left UMAP Plot Area (80%) */}
        <div className="plot-main">
          {loading || dataLoading ? (
            <>
              <Box sx={{ width: "100%" }}>
                <LinearProgress />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: "100px",
                }}
              >
                <CircularProgress />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: "10px",
                }}
              >
                <Typography
                  sx={{ marginLeft: "10px", color: "text.secondary" }}
                  variant="h5"
                >
                  Loading sample list and metadata...
                </Typography>
              </Box>
            </>
          ) : datasetId === "" || datasetId === "all" || datasetId == null ? (
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
              <div key={`${selectedGene}-view`} className={`view-container`}>
                {selectedCellTypes.length > 0 ? (
                  geneStart !== null && geneEnd !== null ? (
                    selectedCellTypes.map((cellType, index) => (
                      <div
                        key={`${cellType}-plot`}
                        className="gene-plot"
                        data-celltype={cellType}
                        /* style={{ */
                        /*   width: "800px", */
                        /*   marginBottom: "20px", */
                        /*   height: "100%", */
                        /* }} */
                      >
                        {/* <Typography variant="h6" align="center"> */}
                        {/*   {cellType} */}
                        {/* </Typography> */}
                        <GeneViewPlotlyPlot
                          geneName={selectedGene}
                          geneStart={geneStart}
                          geneEnd={geneEnd}
                          snpData={snpData[cellType] || []}
                          celltype={cellType}
                        />
                      </div>
                    ))
                  ) : (
                    <Typography
                      sx={{ color: "text.secondary", paddingTop: "100px" }}
                      variant="h5"
                    >
                      No gene selected for exploration
                    </Typography>
                  )
                ) : (
                  <Typography
                    sx={{ color: "text.secondary", paddingTop: "100px" }}
                    variant="h5"
                  >
                    No cell types selected for exploration
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

export default RegionView;
