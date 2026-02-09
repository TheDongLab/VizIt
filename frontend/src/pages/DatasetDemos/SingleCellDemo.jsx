import {Link} from "react-router-dom"
import {Divider, Paper} from "@mui/material";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneLight} from "react-syntax-highlighter/dist/cjs/styles/prism/index.js";
import React from "react";

const SingleCellDemo = () => {
    return (
        <div className="docs-container">
            <header className="docs-header">
                <div className="container">
                    <Link to="/help/howtouse/demos" className="back-link">
                        ← Back to Documentation
                    </Link>
                    <h1>Single-Cell Data Preparation</h1>
                    <p className="subtitle">Step-by-step guide for preparing single-cell RNA-seq data for visualization in BrainDataPortal</p>
                </div>
            </header>

            <main className="container">
                <div className="docs-content">
                    <div className="tutorial-nav">
                        <h3>Table of Contents</h3>
                        <ul>
                            <li><a href="#overview">Overview</a></li>
                            <li><a href="#demo-data">1. Obtaining Demo Data</a></li>
                            <li><a href="#data-loading">2. Data Loading and Initial Inspection</a></li>
                            <li><a href="#data-extraction">3. Data Extraction from Seurat Object</a></li>
                            <li><a href="#metadata-processing">4. Metadata Processing</a></li>
                            <li><a href="#cluster-markers">5. Computing Cluster Markers</a></li>
                            <li><a href="#post-markerprocessing">6. Post-marker Processing and Selection</a></li>
                            <li><a href="#prepare-sample-sheet">7. Preparing Sample Sheet</a></li>
                            <li><a href="#prepare-dataset-info">8. Preparing Dataset Information</a></li>
                            <li><a href="#upload-dataset">9. Uploading Dataset</a></li>
                            <li><a href="#use-precomputed-markers">10. Use Pre-Computed Cluster Markers</a></li>
                            <li><a href="#troubleshooting">Troubleshooting</a></li>
                        </ul>
                    </div>

                    <section id="overview" className="tutorial-section">
                        <h2>Overview</h2>
                        <p>
                            This tutorial will guide you through the complete process of preparing single-cell RNA-seq
                            data for use in BrainDataPortal. We will use a brain dataset as an example and
                            cover all essential preprocessing steps.
                        </p>
                        <div className="info-box">
                            <h4>Prerequisites</h4>
                            <ul>
                                <li>Python 3.8+ with pandas, numpy,json installed</li>
                                <li>R 4.0+ with Seurat, tidyverse, presto packages installed</li>
                                <li>Basic understanding of single-cell RNA-seq concepts</li>
                            </ul>
                        </div>
                    </section>

                    <section id="demo-data" className="tutorial-section">
                        <h2>1. Obtaining Demo Data</h2>
                        <p>
                            We will use a single-cell dataset from human brain. This dataset
                            contains 10 subjects, approximately 50,000 cells from brain middle temporal gyrus region.
                        </p>

                        <h3>Download the demo dataset and scripts</h3>
                        <div className="troubleshooting-item">
                            1. Seurat object file: <a href="/demos/notebooks/sc/example_data/snRNAseq_MTG_10samples.rds" target="_blank">snRNAseq_MTG_10samples.rds</a> <br/>
                            2. Sample metadata file: <a href="/demos/notebooks/sc/example_data/Sample_snRNAseq_10Samples.csv" target="_blank">Sample_snRNAseq_MTG_10samples.csv</a><br/>
                            3. Dataset configuration file: <a href="/demos/notebooks/sc/example_data/dataset_info.toml" target="_blank">dataset_info.toml</a><br/>
                            4. Dataset processing scripts: <a href="/demos/scripts/sc.zip" target="_blank">sc_scripts.zip</a>
                        </div>
                    </section>

                    <section id="data-loading" className="tutorial-section">
                        <h2>2. Data Loading and Initial Inspection</h2>
                        <p>
                            Once you have the data, Load it and perform initial inspection to understand the dataset structure. <br/>
                            Full code in Notebook: <a href="/demos/notebooks/sc/11_extract_SC_v4.html" target="_blank">11.extract_SC_v4.R</a>. <br/>
                            You may need to pay attention to the input arguments: <strong>seurat_obj_file</strong>, <strong>output_dir</strong>, <strong>cluster_col</strong>
                        </p>

                        <div className="code-block">
              <pre>
                <code>{`## Rscript 11.extract_SC_v5.R
... ...
# Get the arguments
seurat_obj_file <- "snRNAseq_MTG_10samples.rds"
output_dir <- "snRNAseq_MTG_10samples"
cluster_col <- "MajorCellTypes"

# Load the Seurat object
seurat_obj <- readRDS(seurat_obj_file)
capture.output(str(seurat_obj), file = paste0(output_dir, "/seurat_obj_structure.txt"))
... ...
`}
                </code>
              </pre>
                        </div>

                        <div className="warning-box">
                            <h4>Important Note</h4>
                            <p>
                                The above code will generate a file named <strong>seurat_obj_structure.txt</strong> in the output directory. Check this file to see the structure of the Seurat object, Make sure the the necessary data is present.
                            </p>
                        </div>
                    </section>

                    <section id="data-extraction" className="tutorial-section">
                        <h2>3. Data Extraction from Seurat Object</h2>
                        <p>
                            After check the structure of the Seurat object, we can extract the data and metadata from the object. <br />
                            Full code in Notebook: <a href="/demos/notebooks/sc/11_extract_SC_v4.html" target="_blank">11.extract_SC_v4.R</a>.<br/>

                        </p>
                        <div className="warning-box">
                            <h4>Important Note</h4>
                            <p>
                                 Seurat v5 has a different structure compared to v4, you may need to adjust the following codes accordingly.
                            </p>
                        </div>

                        <h3>v4 Seurat Object</h3>
                        <div className="code-block">
              <pre>
                <code>{`
## 1. Extract the normalized counts
normalized_counts <- seurat_obj@assays$RNA@data  # This is a sparse matrix

## 2. Convert sparse matrix to triplet format (long format)
long_data <- summary(normalized_counts)

## 3. Get row (gene) and column (cell) names
long_data$Gene <- rownames(normalized_counts)[long_data$i]
long_data$Cell <- colnames(normalized_counts)[long_data$j]
long_data$Expression <- long_data$x

## 4. Keep only necessary columns
long_data <- long_data[, c("Gene", "Cell", "Expression")]

`}</code>
              </pre>
                        </div>

                        <h3>v5 Seurat Object</h3>
                        <div className="code-block">
              <pre>
                <code>{`
## 1. Extract normalized data
norm_data <- seurat_obj[["RNA"]]@layers[["data"]]   # This is a sparse matrix

## 2. Get gene and cell names from LogMaps
gene_names <- dimnames(seurat_obj[["RNA"]]@features)[[1]]
cell_names <- dimnames(seurat_obj[["RNA"]]@cells)[[1]]

## 3. Convert to triplet format (sparse matrix summary)
triplet <- summary(norm_data)

## 4. Map i and j indices to gene and cell names
triplet$Gene <- gene_names[triplet$i]
triplet$Cell <- cell_names[triplet$j]

## 5. Reorder and rename
long_data <- triplet %>% select(Cell, Gene, Expression = x)
`}</code>
              </pre>
                        </div>

                    </section>

                    <section id="metadata-processing" className="tutorial-section">
                        <h2>4. Metadata processing</h2>
                        <p>
                            This step processes single cell metadata for visualization, including: <br />
                            - Metadata filtering and renaming <br />
                            - UMAP embedding sampling <br />
                            - Expression data splitting and saving<br />
                            - Pseudo-bulk level expression calculation<br />
                        </p>
                        <p>
                            Full code in Notebook: <a href="/demos/notebooks/sc/21_rename_meta.html" target="_blank">21_rename_meta.ipynb</a>.
                        </p>

                        <div className="code-block">
              <pre>
                <code>{`dataset_path = "snRNAseq_MTG_10samples"  ## This is the output directory from the previous step 

## a list of metadata columns to keep, pick features that you want to visualize
kept_features =[ "nCount_RNA", "nFeature_RNA", "sex", "MajorCellTypes", 
                "updrs", "Complex_Assignment", "mmse", "sample_id", "case",]
sample_col = "sample_id"
cluster_col = "MajorCellTypes"
condition_col = "case"`}</code>
              </pre>
                        </div>
                    </section>

                    <section id="cluster-markers" className="tutorial-section">
                        <h2>5. Computing cluster markers</h2>
                        <p>This step includes:<br/>- Finding cell type specific markers<br/>- Calculating differential expression within cell types<br/>- Performing pseudo-bulk analysis</p>
                        <p>
                            Full code in Notebook: <a href="/demos/notebooks/sc/31_clustermarkers.html" target="_blank">31_clustermarkers.R</a>.<br/>
                        </p>
                        <div className="code-block">
              <pre>
                <code>{`seurat_obj_file <- "snRNAseq_MTG_10samples.rds"
output_dir <- "snRNAseq_MTG_10samples"
cluster_col <- "MajorCellTypes"
condition_col <- "case"
sample_col <- "sample_id"
seurat_type <- "snrnaseq"`}</code>
              </pre>
                        </div>
                        <Divider />
                        <div className="warning-box">
                            <h4>Important Note</h4>
                            <p>
                                You may need to adjust the following codes for your specific dataset.<br/>
                            </p>
                        </div>
                        <div className="code-block">
              <pre>
                <code>{`if (!"data" %in% slotNames(seurat_obj@assays$RNA)) {
    stop("The Seurat object does not contain the 'data' slot in the 'RNA' assay.")
}
... ...
# Check if the Seurat object has the necessary assay
if (!"ATAC" %in% names(seurat_obj@assays)) {
    stop("The Seurat object does not contain the 'ATAC' assay.")
}
# Check if the Seurat object has the necessary assay data
if (!"counts" %in% slotNames(seurat_obj@assays$ATAC)) {
    stop("The Seurat object does not contain the 'counts' slot in the 'ATAC' assay.")
}
... ...
# Check if the Seurat object has the necessary assay
if (!"Spatial" %in% names(seurat_obj@assays)) {
    stop("The Seurat object does not contain the 'Spatial' assay.")
}
# Check if the Seurat object has the necessary assay data
if (!"data" %in% slotNames(seurat_obj@assays$Spatial)) {
    stop("The Seurat object does not contain the 'data' slot in the 'Spatial' assay.")
}
`}</code>
              </pre>
                        </div>
                    </section>


                    <section id="post-markerprocessing" className="tutorial-section">
                        <h2>6. Post-marker processing and selection</h2>
                        <p> This step identifies and analyzes top marker genes for each cell type (or cluster) from single-cell data. <br/>
                            It also calculates detection frequency and average expression for selected marker genes across conditions and sexes.<br/>
                            Full code in Notebook: <a href="/demos/notebooks/sc/41_clustermarkers_postprocess.html" target="_blank">41_clustermarkers_postprocess.ipynb</a>.<br/>
                            Modify the following codes for your specific dataset.
                        </p>

                        <div className="code-block">
              <pre>
                <code>{`# Define dataset and metadata column names
dataset_folder = "example_data/snRNA_MTG_10Samples"
cluster_col = "MajorCellTypes"
sex_col = "sex"
output_folder = dataset_folder + "/clustermarkers"
... ...

# Filter for significant genes
filtered_df = marker_genes[marker_genes['p_val_adj'] < 0.05]

# Rank by absolute log2FC and select top 10 per cluster
top_genes = (
    filtered_df
    .assign(abs_log2FC = filtered_df['avg_log2FC'])  ## chenge to abs(filtered_df['avg_log2FC']) will include negative log2FC genes
    .sort_values(['cluster', 'abs_log2FC'], ascending=[True, False])
    .groupby('cluster')
    .head(10)
    .drop(columns='abs_log2FC')  # Optional: remove helper column
)
... ...
`}</code>
              </pre>
                        </div>
                    </section>

                    <section id="prepare-sample-sheet" className="tutorial-section">
                        <h2>7. Prepare sample sheet file</h2>
                        <p>
                            This step generates a sample sheet file for the dataset. <br/>
                            It includes information about the samples, such as condition, sex, and other relevant metadata.<br/>
                            Download the demo sample sheet file: <a href="/demos/notebooks/sc/example_data/Sample_snRNAseq_10Samples.csv" target="_blank">Sample_snRNAseq_MTG_10samples.csv</a><br/>
                        </p>
                        <div className="alert-box">
                            <h4>Important Note</h4>
                            <p>
                                PLEASE KEEP ALL THE COLUMN NAMES AND ORDER AS IS, JUST FILL IN YOUR DATA.
                            </p>
                        </div>

                    </section>

                    <section id="prepare-dataset-info" className="tutorial-section">
                        <h2>8. Prepare dataset information</h2>
                        <p>
                            This step prepares the dataset information. <br/>
                            Download the demo dataset information file: <a href="/demos/notebooks/sc/example_data/dataset_info.toml" target="_blank">dataset_info.toml</a>

                        </p>
                        <div className="alert-box">
                            <h4>Important Note</h4>
                            <p>
                                Dataset configuration file name must be <strong>dataset_info.toml</strong>
                            </p>
                        </div>
                         <p>
                            Here is an example of the dataset configuration file content:
                        </p>
                        <Paper className="config-content">
                                                <SyntaxHighlighter language="toml" style={oneLight}>
{`
[datasetfile]
file = ""                               ## Path to the Seurat object file
datatype = ""                           ## Type of the data. Options: scRNAseq, scATACseq, VisiumST, xQTL

[dataset]
dataset_name = ""                       ## Required: Dataset name, MUST BE UNIQUE, used to identify the dataset in the database
description = ""                        ## Dataset description
PI_full_name = ""                       ## Principal Investigator (PI) full name
PI_email = ""                           ## PI email
first_contributor = ""                  ## First contributor name
first_contributor_email = ""            ## First contributor email
other_contributors = ""                 ## Other contributors
support_grants = ""                     ## Support grants
other_funding_source = ""               ## Other funding source
publication_DOI = ""                    ## DOI of the publication
publication_PMID = ""                   ## PMID of the publication
brain_super_region = ""                 ## Brain super region
brain_region = ""                       ## Brain region
sample_info = ""                        ## Sample information
sample_sheet = ""                       ## Sample sheet file name (Not the path, just the file name)
n_samples = 96                          ## Number of samples
organism = "Homo Sapiens"               ## Organism
tissue = "Brain"                        ## Tissue
disease = "PD"                          ## Disease

[study]
study_name = "Parkinson5D"              ## Study name, the dataset belongs to
description = ""                        ## Study description
team_name = "Team Scherzer"             ## Team name
lab_name = "NeuroGenomics"              ## Lab name
submitter_name = ""                     ## Submitter name
submitter_email = ""                    ## Submitter email

[protocol]
protocol_id = "P002"                    ## Protocol ID
protocol_name = "P001_VisiumST"         ## Protocol name
version = ""                            ## Protocol version
github_url = ""                         ## GitHub URL
sample_collection_summary = ""          ## Sample collection summary
cell_extraction_summary = ""            ## Cell extraction summary
lib_prep_summary = ""                   ## Library preparation summary
data_processing_summary = ""            ## Data processing summary
protocols_io_DOI = ""                   ## protocols.io DOI
other_reference = ""                    ## Other reference

[meta_features]
selected_features = ["nCount_Spatial",...] ## List of selected features will be shown in the page
sample_id_column = "sample_name"        ## Sample ID column in Seurat object metadata
major_cluster_column = "CellType"       ## Major cluster column in Seurat object metadata
condition_column = "diagnosis"          ## Condition column in Seurat object metadata        

[spatial_defaults]
samples = [ "BN2023", "BN1076",]         ## List of sample names
features = [ "smoothed_label_s5",...]    ## List of default feature names
genes = [ "SNCA",...]                    ## List of default gene names
`}
                                                </SyntaxHighlighter>
                                            </Paper>
                    </section>

                    <section id="upload-dataset" className="tutorial-section">
                        <h2>9. Uploading Dataset</h2>
                        <p>
                            Upload the dataset to server folder.
                        </p>
                        <div className="info-box">
                            <h4>Upload Note</h4>
                            <p>
                                After running the pipeline, there will be a dataset folder that contains the all necessary files:
                                <ul>
                                    <li>1. the files with names starting with <code>raw_</code> are not necessary for upload.</li>
                                    <li>2. the file named &apos;pb_expr_matrix.csv&apos; in the folder &apos;&lt;dataset_name&gt;/clustermarkers&apos; is not necessary for upload.</li>
                                    <li>3. Upload the dataset folder named <b>&apos;&lt;dataset_name&gt;&apos;</b> to the server at <b>&apos;backend/datasets&apos;</b>.</li>
                                    <li>4. Put the dataset configuration file named <b>&apos;dataset_info.toml&apos;</b> to your dataset folder at <b>&apos;backend/datasets/&lt;dataset_name&gt;&apos;</b>.</li>
                                    <li>5. Upload <b>samplesheet file</b> to the server at <b>&apos;backend/SampleSheet&apos;</b>.</li>
                                    <li>6. Refresh the database: Go to <b>&apos;<a href="/datasetmanager?dataset=&stepidx=0">Datasets Management Page</a> &apos;</b>(DATASETS -&gt; +ADD DATASET) and click <b>&apos;REFRESH DB&apos;</b>.</li>
                                </ul>
                            </p>
                        </div>

                    </section>

{/*                    <section id="troubleshooting" className="tutorial-section">*/}
{/*                        <h2>Troubleshooting</h2>*/}

{/*                        <div className="troubleshooting-item">*/}
{/*                            <h4>Issue: Memory errors during processing</h4>*/}
{/*                            <p>*/}
{/*                                <strong>Solution:</strong> Process data in chunks or use a machine with more RAM.*/}
{/*                                Consider using sparse*/}
{/*                                matrices and avoiding dense operations.*/}
{/*                            </p>*/}
{/*                            <div className="code-block">*/}
{/*                <pre>*/}
{/*                  <code>{`# Use sparse matrices*/}
{/*import scipy.sparse as sp*/}
{/*if not sp.issparse(adata.X):*/}
{/*    adata.X = sp.csr_matrix(adata.X)`}</code>*/}
{/*                </pre>*/}
{/*                            </div>*/}
{/*                        </div>*/}

{/*                        <div className="troubleshooting-item">*/}
{/*                            <h4>Issue: Too many cells filtered out</h4>*/}
{/*                            <p>*/}
{/*                                <strong>Solution:</strong> Adjust filtering thresholds based on your specific dataset*/}
{/*                                characteristics.*/}
{/*                            </p>*/}
{/*                            <div className="code-block">*/}
{/*                <pre>*/}
{/*                  <code>{`# Check your data distribution first*/}
{/*print(adata.obs[['total_counts', 'n_genes_by_counts', 'pct_counts_mt']].describe())*/}
{/*# Adjust thresholds accordingly`}</code>*/}
{/*                </pre>*/}
{/*                            </div>*/}
{/*                        </div>*/}

{/*                        <div className="troubleshooting-item">*/}
{/*                            <h4>Issue: Gene names not recognized</h4>*/}
{/*                            <p>*/}
{/*                                <strong>Solution:</strong> Ensure gene symbols are in the correct format (human: HGNC*/}
{/*                                symbols, mouse:*/}
{/*                                MGI symbols).*/}
{/*                            </p>*/}
{/*                            <div className="code-block">*/}
{/*                <pre>*/}
{/*                  <code>{`# Convert gene IDs if needed*/}
{/*# For Ensembl to gene symbol conversion*/}
{/*import mygene*/}
{/*mg = mygene.MyGeneInfo()*/}
{/*gene_info = mg.querymany(adata.var_names.tolist(), scopes='ensembl.gene', fields='symbol', species='human')*/}
{/*# Update gene names based on results`}</code>*/}
{/*                </pre>*/}
{/*                            </div>*/}
{/*                        </div>*/}
{/*                    </section>*/}

                    {/*<div className="next-steps">*/}
                    {/*    <h3>Next Steps</h3>*/}
                    {/*    <p>After completing this tutorial, you can:</p>*/}
                    {/*    <ul>*/}
                    {/*        <li>Upload your processed data to BrainDataPortal</li>*/}
                    {/*        <li>Perform dimensionality reduction and clustering</li>*/}
                    {/*        <li>Identify cell types and marker genes</li>*/}
                    {/*        <li>Conduct differential expression analysis</li>*/}
                    {/*        <li>Integrate with other omics data types</li>*/}
                    {/*    </ul>*/}
                    {/*</div>*/}
                </div>
            </main>
        </div>
    )
}

export default SingleCellDemo
