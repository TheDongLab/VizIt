import React, {
  useEffect,
  useState,
  forwardRef,
  useContext,
  useRef,
  useMemo,
} from "react";
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
  styled,
  Popper,
  autocompleteClasses,
} from "@mui/material";

import PropTypes from "prop-types";
import { FixedSizeList } from "react-window";

import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { useSearchParams } from "react-router-dom";

import "./RegionView.css";

import useDataStore from "../../store/DatatableStore.js";
import useQtlStore from "../../store/QtlStore.js";

// Constants for react-window listbox
const LISTBOX_PADDING = 8;
const MAX_VISIBLE = 8;
const ITEM_SIZE = 36;

function renderRow({ data, index, style }) {
  const item = data[index];
  const inlineStyle = {
    ...style,
    top: style.top + LISTBOX_PADDING,
  };

  return React.cloneElement(item, {
    style: inlineStyle,
  });
}

const OuterElementContext = React.createContext({});

const OuterElementType = forwardRef(function OuterElementType(props, ref) {
  const outerProps = useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

// Reset the cache of the list when the data changes (unused)
function useResetCache(data) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": {
      padding: 0,
      margin: 0,
    },
  },
});

const ListboxComponent = forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData = useMemo(() => React.Children.toArray(children), [children]);
  // These also work, but may be worse
  // const itemData = React.Children.toArray(children);
  // const itemData = React.useMemo(() => {
  //   return Array.isArray(children) ? children : [children];
  // }, [children]);

  const itemCount = itemData.length;
  const height =
    Math.min(itemCount, MAX_VISIBLE) * ITEM_SIZE + 2 * LISTBOX_PADDING;

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <FixedSizeList
          itemData={itemData}
          height={height}
          width="100%"
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={ITEM_SIZE}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </FixedSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

ListboxComponent.propTypes = {
  children: PropTypes.node,
};

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

  // Prepare all the  data
  // const {
  //   setDataset,
  //   geneList,
  //   fetchGeneList,
  //   sampleList,
  //   fetchSampleList,
  //   metaList,
  //   fetchMetaList,
  // } = useSampleGeneMetaStore();
  // const {
  //   selectedSamples,
  //   setSelectedSamples,
  //   selectedGenes,
  //   setSelectedGenes,
  // } = useSampleGeneMetaStore();
  // const {
  //   exprDataDict,
  //   fetchExprData,
  //   sampleMetaDict,
  //   fetchMetaDataOfSample,
  //   imageDataDict,
  //   fetchImageData,
  // } = useSampleGeneMetaStore();
  // const { loading, error } = useSampleGeneMetaStore();
  // const { defaultSamples, defaultFeatures, defaultGenes, fetchVisiumDefaults } =
  //   useVisiumStore();
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

        if (selectedGene && selectedGene !== "") {
          await fetchGeneCellTypes(datasetId);
          await fetchSnpData(datasetId);
        }

        if (selectedSnp && selectedSnp !== "") {
          await fetchSnpCellTypes(datasetId);
          await fetchGeneData(datasetId);
        }
      } catch (error) {
        console.error("Error in data fetching:", error);
      }
    };

    initialize();
  }, [datasetId]);

  // const excludedKeys = new Set([
  //   "cs_id",
  //   "sample_id",
  //   "Cell",
  //   "Spot",
  //   "UMAP_1",
  //   "UMAP_2",
  // ]);
  // const metaOptions = metaList
  //   ? metaList.filter((option) => !excludedKeys.has(option))
  //   : [];

  const [geneSearchText, setGeneSearchText] = useState("");
  const [snpSearchText, setSnpSearchText] = useState("");

  // /** Updates the query parameters in the URL */
  // const updateQueryParams = (dataset, gene, snp) => {
  //   const newParams = new URLSearchParams();
  //   dataset && newParams.set("dataset", dataset);
  //   gene && newParams.set("gene", gene);
  //   snp && newParams.set("snp", snp);

  //   setQueryParams(newParams);
  // };
  //
  // useEffect(() => {
  //   console.log(
  //     "geneData",
  //     geneData.map((g) => -Math.log10(g["p-value"])),
  //   );
  //   console.log(
  //     "snpData",
  //     snpData.map((s) => -Math.log10(s["p-value"])),
  //   );
  // }, [geneData, snpData]);

  useEffect(() => {
    const newParams = new URLSearchParams();
    datasetId && newParams.set("dataset", datasetId);
    selectedGene && newParams.set("gene", selectedGene);
    selectedSnp && newParams.set("snp", selectedSnp);
    setQueryParams(newParams);
  }, [datasetId, selectedGene, selectedSnp]);

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
      await fetchGeneCellTypes(datasetId);
      await fetchSnpData(datasetId);
    } else if (isSnp) {
      await fetchSnpCellTypes(datasetId);
      await fetchGeneData(datasetId);
    }
  };

  useEffect(() => {
    console.log("genes", geneList.length);
    console.log("snps", snpList.length);
  }, [geneList, snpList]);

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

  // TODO needed?
  // const handleGeneDelete = (delGene) => {
  //   const newGenes = selectedGenes.filter((g) => g !== delGene);
  //   setSelectedGenes(newGenes);
  //   updateQueryParams(datasetId, newGenes, selectedSamples);
  //   fetchExprData();
  // };

  // const handleMetaFeatureChange = (event, newValue) => {
  //   setSelectedMetaFeatures(newValue);
  //   updateQueryParams(datasetId, selectedGenes, selectedSamples, newValue);
  // };
  // const handleMetaDelete = (delMeta) => {
  //   const newMetas = selectedMetaFeatures.filter((m) => m !== delMeta);
  //   setSelectedMetaFeatures(newMetas);
  //   updateQueryParams(datasetId, selectedGenes, selectedSamples, newMetas);
  // };

  // click the button to fetch umap data
  const handleLoadPlot = async () => {
    await fetchGeneOrSnpData();
  };

  // const selectedFeatures = [
  //   ...new Set([...selectedGenes, ...selectedMetaFeatures]),
  // ];
  // console.log("selectedFeatures:", selectedFeatures);
  // const plotClass =
  //   Object.keys(selectedFeatures).length <= 1
  //     ? "single-plot"
  //     : Object.keys(selectedFeatures).length === 2
  //       ? "two-plots"
  //       : Object.keys(selectedFeatures).length === 3
  //         ? "three-plots"
  //         : "four-plots";

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
            options={geneList}
            value={selectedGene}
            /* value={geneList.includes(selectedGene) ? selectedGene : null} */
            onChange={handleGeneChange}
            inputValue={geneSearchText}
            onInputChange={(event, newInputValue) => {
              setGeneSearchText(newInputValue);
            }}
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
            /* renderTags={(value, getTagProps) => */
            /*   value.map((option, index) => { */
            /*     const { key, ...tagProps } = getTagProps({ index }); */
            /*     return ( */
            /*       <Chip */
            /*         key={`${key}-${option}`} */
            /*         label={option} */
            /*         {...tagProps} */
            /*         color="primary" */
            /*         /\* onDelete={() => handleGeneDelete(option)} *\/ */
            /*       /> */
            /*     ); */
            /*   }) */
            /* } */
            renderInput={(params) => (
              <TextField {...params} label="Search gene" variant="standard" />
            )}
          />

          {/* SNP Selection with Fuzzy Search & Chips */}
          <Autocomplete
            disableListWrap
            size="small"
            options={snpList}
            value={selectedSnp}
            onChange={handleSnpChange}
            inputValue={snpSearchText}
            onInputChange={(event, newInputValue) => {
              setSnpSearchText(newInputValue);
            }}
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
            /* renderTags={(value, getTagProps) => */
            /*   value.map((option, index) => { */
            /*     const { key, ...tagProps } = getTagProps({ index }); */
            /*     return ( */
            /*       <Chip */
            /*         key={`${key}-${option}`} */
            /*         label={option} */
            /*         {...tagProps} */
            /*         color="primary" */
            /*         /\* onDelete={() => handleGeneDelete(option)} *\/ */
            /*       /> */
            /*     ); */
            /*   }) */
            /* } */
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
              disabled={loading}
              onClick={handleLoadPlot}
            >
              {loading ? "Loading plots..." : "Refresh Plots"}
            </Button>
          </Box>
        </div>
        {/* display the genedata and snpdata in plain text for now */}
        <div className="plot-panel">
          <Typography variant="subtitle1">Selected Gene</Typography>
          <Box sx={{ marginTop: "10px" }}>
            <Typography variant="body1">
              {selectedGene ? selectedGene : "No gene selected"}
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ marginTop: "20px" }}>
            Selected SNP
          </Typography>
          <Box sx={{ marginTop: "10px" }}>
            <Typography variant="body1">
              {selectedSnp ? selectedSnp : "No SNP selected"}
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ marginTop: "20px" }}>
            Selected Cell Types
          </Typography>
          <Box sx={{ marginTop: "10px" }}>
            <Typography variant="body1">
              {selectedCellTypes.length > 0
                ? selectedCellTypes.join(", ")
                : "No cell types selected"}
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ marginTop: "20px" }}>
            Selected Dataset
          </Typography>
          <Box sx={{ marginTop: "10px" }}>
            <Typography variant="body1">
              {datasetId ? datasetId : "No dataset selected"}
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ marginTop: "20px" }}>
            Selected SNP Data
          </Typography>
          <Box sx={{ marginTop: "10px" }}>
            <Typography variant="body1">{JSON.stringify(snpData)}</Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ marginTop: "20px" }}>
            Selected Gene Data
          </Typography>
          <Box sx={{ marginTop: "10px" }}>
            <Typography variant="body1">
              {JSON.stringify(geneData, null, 2)}
            </Typography>
          </Box>
        </div>

        {/* Left UMAP Plot Area (80%) */}
        {/* <div className="plot-main"> */}
        {/*   {loading ? ( */}
        {/*     <> */}
        {/*       <Box sx={{ width: "100%" }}> */}
        {/*         <LinearProgress /> */}
        {/*       </Box> */}
        {/*       <Box */}
        {/*         sx={{ */}
        {/*           display: "flex", */}
        {/*           justifyContent: "center", */}
        {/*           paddingTop: "100px", */}
        {/*         }} */}
        {/*       > */}
        {/*         <CircularProgress /> */}
        {/*       </Box> */}
        {/*       <Box */}
        {/*         sx={{ */}
        {/*           display: "flex", */}
        {/*           justifyContent: "center", */}
        {/*           paddingTop: "10px", */}
        {/*         }} */}
        {/*       > */}
        {/*         <Typography */}
        {/*           sx={{ marginLeft: "10px", color: "text.secondary" }} */}
        {/*           variant="h5" */}
        {/*         > */}
        {/*           Loading sample list and metadata... */}
        {/*         </Typography> */}
        {/*       </Box> */}
        {/*     </> */}
        {/*   ) : datasetId === "" || */}
        {/*     datasetId === "all" || */}
        {/*     datasetId === undefined || */}
        {/*     datasetId === null ? ( */}
        {/*     <Typography */}
        {/*       sx={{ color: "text.secondary", paddingTop: "100px" }} */}
        {/*       variant="h5" */}
        {/*     > */}
        {/*       No dataset selected for exploration */}
        {/*     </Typography> */}
        {/*   ) : error ? ( */}
        {/*     <Typography color="error">{error}</Typography> */}
        {/*   ) : ( */}
        {/*     <div className="visium-container"> */}
        {/*       {Object.keys(imageDataDict).length < 1 ? ( */}
        {/*         <Box className="no-sample"> */}
        {/*           <Typography sx={{ color: "text.secondary" }} variant="h5"> */}
        {/*             No sample selected for visualization */}
        {/*           </Typography> */}
        {/*         </Box> */}
        {/*       ) : ( */}
        {/*         Object.entries(imageDataDict).map( */}
        {/*           ([sample_i, visiumData_i]) => ( */}
        {/*             <div key={sample_i} className="sample-row"> */}
        {/*               {/\* Sample Label *\/} */}
        {/*               <div key={`${sample_i}-label`} className="sample-label"> */}
        {/*                 <Box */}
        {/*                   display="flex" */}
        {/*                   alignItems="center" */}
        {/*                   justifyContent="center" */}
        {/*                   sx={{ mb: 1 }} */}
        {/*                 > */}
        {/*                   <Typography variant="subtitle1"> */}
        {/*                     Sample: {sample_i} */}
        {/*                   </Typography> */}
        {/*                   <div>&nbsp;&nbsp;</div>( */}
        {/*                   <Link */}
        {/*                     href={`/gsMAP/${sample_i}_PD_gsMap_Report.html`} */}
        {/*                     target="_blank" */}
        {/*                     rel="noopener" */}
        {/*                     underline="hover" */}
        {/*                   > */}
        {/*                     View gsMAP */}
        {/*                   </Link> */}
        {/*                   ) */}
        {/*                 </Box> */}
        {/*               </div> */}

        {/*               {/\* Features Container *\/} */}
        {/*               <div */}
        {/*                 key={`${sample_i}-features`} */}
        {/*                 className={`features-container ${plotClass}`} */}
        {/*               > */}
        {/*                 {selectedFeatures.length > 0 ? ( */}
        {/*                   selectedFeatures.map((feature) => ( */}
        {/*                     <> */}
        {/*                       <div */}
        {/*                         key={`${sample_i}-${feature}-chart`} */}
        {/*                         className="feature-plot-echart" */}
        {/*                       > */}
        {/*                         {sampleMetaDict[sample_i] && ( */}
        {/*                           <PlotlyFeaturePlot */}
        {/*                             visiumData={visiumData_i} */}
        {/*                             geneData={exprDataDict} */}
        {/*                             metaData={sampleMetaDict[sample_i] || {}} */}
        {/*                             feature={feature} */}
        {/*                           /> */}
        {/*                         )} */}
        {/*                         <Typography */}
        {/*                           variant="caption" */}
        {/*                           display="block" */}
        {/*                           align="center" */}
        {/*                         > */}
        {/*                           {feature} */}
        {/*                         </Typography> */}
        {/*                       </div> */}
        {/*                     </> */}
        {/*                   )) */}
        {/*                 ) : ( */}
        {/*                   <Box className="no-feature"> */}
        {/*                     <Typography */}
        {/*                       sx={{ color: "text.secondary" }} */}
        {/*                       variant="h5" */}
        {/*                     > */}
        {/*                       No feature selected for visualization */}
        {/*                     </Typography> */}
        {/*                   </Box> */}
        {/*                 )} */}
        {/*               </div> */}
        {/*               <Divider /> */}
        {/*             </div> */}
        {/*           ), */}
        {/*         ) */}
        {/*       )} */}
        {/*     </div> */}
        {/*   )} */}
        {/* </div> */}
      </div>
    </div>
  );
}

export default RegionView;
