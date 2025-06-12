import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Divider,
  Chip,
  ListItem,
  Button,
  TextField,
  LinearProgress,
  CircularProgress,
  Autocomplete,
  Link,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Popper from "@mui/material/Popper";
import { autocompleteClasses } from "@mui/material/Autocomplete";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import { useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import { FixedSizeList } from "react-window";

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

const OuterElementType = React.forwardRef(
  function OuterElementType(props, ref) {
    const outerProps = React.useContext(OuterElementContext);
    return <div ref={ref} {...props} {...outerProps} />;
  },
);

// Reset the cache of the list when the data changes (unused)
function useResetCache(data) {
  const ref = React.useRef(null);
  React.useEffect(() => {
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

const ListboxComponent = React.forwardRef(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = React.Children.toArray(children);

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
  },
);

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
  } = useQtlStore();
  const { loading, error } = useQtlStore();

  // const [selectedMetaFeatures, setSelectedMetaFeatures] = useState(urlMetas);

  useEffect(() => {
    if (datasetId && datasetId !== "") {
      setDataset(datasetId);
      fetchGeneList(datasetId);
      fetchSnpList(datasetId);

      // Only fetch data if we have selections
      if (
        (selectedGene && selectedGene !== "") ||
        (urlGene && urlGene !== "")
      ) {
        fetchSnpData(datasetId, "Astrocytes");
      }
      if ((selectedSnp && selectedSnp !== "") || (urlSnp && urlSnp !== "")) {
        fetchGeneData(datasetId, "Astrocytes");
      }
    }
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

  /** Updates the query parameters in the URL */
  const updateQueryParams = (dataset, gene, snp) => {
    const newParams = new URLSearchParams();
    dataset && newParams.set("dataset", dataset);
    gene && newParams.set("gene", gene);
    snp && newParams.set("snp", snp);

    setQueryParams(newParams);
  };

  const handleDatasetChange = (event, newValue) => {
    // TODO clear both gene and snp selections?
    setDataset(newValue);
    setDatasetId(newValue);
    updateQueryParams(newValue, selectedGene, selectedSnp);
  };

  /** Handles gene selection change */
  const handleGeneChange = (event, newValue) => {
    setSelectedGene(newValue);
    setSelectedSnp("");
    updateQueryParams(datasetId, newValue, selectedSnp);
    // TODO clear the graph if no gene is selected?
    if (selectedGene != "") fetchSnpData(datasetId, "Astrocytes");
  };

  /** Handles SNP selection change */
  const handleSnpChange = (event, newValue) => {
    setSelectedSnp(newValue);
    setSelectedGene("");
    updateQueryParams(datasetId, selectedGene, newValue);
    // TODO clear the graph if no SNP is selected?
    if (selectedSnp != "") fetchGeneData(datasetId, "Astrocytes");
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
  const handleLoadPlot = () => {
    if (selectedGene) {
      fetchSnpData(datasetId, "Astrocytes");
    }
    if (selectedSnp) {
      fetchGeneData(datasetId, "Astrocytes");
    }
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
                <ListItem key={key} {...rest}>
                  {option}
                </ListItem>
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
            sx={{ marginLeft: "20px" }}
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
                <ListItem key={key} {...rest}>
                  {option}
                </ListItem>
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
            sx={{
              marginLeft: "20px",
            }}
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
                <ListItem key={key} {...rest}>
                  {option}
                </ListItem>
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
