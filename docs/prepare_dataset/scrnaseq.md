# Single-Cell Dataset Preparation
Step-by-step guide for preparing single-cell RNA-seq data for visualization in BrainDataPortal.

Learn how to prepare and process single-cell/nuclei RNA sequencing data for visualization in BrainDataPortal. 
This section covers seurat object processing, gene expression data splitting, metadata table preparation and data formatting.

We will use a brain dataset as an example and cover all essential preprocessing steps.

## 1. Prerequisites
* Python 3.8+ with pandas, numpy, json libraries installed.
* R 4.0+ with Seurat, tidyverse, presto packages installed.
* Basic understanding of single-cell RNA-seq concepts.

## 2. Download demo data
We will use a single-cell dataset from human brain. 
This dataset contains 10 subjects, approximately 50,000 cells from brain middle temporal gyrus region.

* Demo dataset and scripts:
> 1. Seurat object: [snRNAseq_MTG_10samples.rds](https://github.com/huruifeng/BrainDataPortal/blob/main/demo_data/seurat_object.rds)
> 2. Sample metadata sheet: [Sample_snRNAseq_MTG_10samples.csv](https://github.com/huruifeng/BrainDataPortal/blob/main/demo_data/Sample_snRNAseq.csv)
> 3. Dataset configuration file: [dataset_info.toml](../demos/notebooks/sc/dataset_info.toml)
> 4. Processing script: [sc_script.zip](../demos/scripts/sc.zip)

## 3. Data loading and checking
Once you have the data, Load it and perform initial inspection to understand the dataset structure.

Full code in Notebook: [11.extract_SC_v4.R](../demos/notebooks/sc/11_extract_SC_v4.html).

You need to pay attention to the input arguments: __seurat_obj_file__, __output_dir__, __cluster_col__

```R
## Rscript 11.extract_SC_v4.R
... ...
# Get the arguments
seurat_obj_file <- "snRNAseq_MTG_10samples.rds"
output_dir <- "snRNAseq_MTG_10samples"
cluster_col <- "MajorCellTypes"

# Load the Seurat object
seurat_obj <- readRDS(seurat_obj_file)
capture.output(str(seurat_obj), file = paste0(output_dir, "/seurat_obj_structure.txt"))
... ...
```
!!! warning "Important Note"
    The above code will generate a file named __seurat_obj_structure.txt__ in the output directory. 
    Check this file to see the structure of the Seurat object, Make sure the necessary data is present.
    
    <h4> Required data in Seurat object</h4>

        sc RNAseq Seurat RDS/
        |-- @assays                     ## List of assays
        |   |-- RNA                     ## RNA data
        |   |   |-- @counts             ## Raw counts
        |   |   |-- @data               ## Normalized data
        |   |   |-- @features           ## Feature/Gene names, v5 format
        |   |   `-- @cells              ## Cell names/ID, v5 format, 
        |   `-- ...
        |-- @meta.data                  ## Cell level Metadata table
        |   |-- cell_id                 ## Cell ID
        |   |-- cell_type               ## Cell type annotation
        |   |-- sample_id               ## Sample ID
        |   |-- nCount_RNA              ## Number of UMI counts in the cell
        |   |-- nFeature_RNA            ## Number of genes detected in the cell
        |   `-- ...
        |-- @reductions                 ## Dimensionality reduction results
        |   |--umap                
        |   |   |-- @cell.embeddings    ## UMAP coordinates for each cell
        |   |   `-- ...
        |   `-- ...
        `-- ...

## 4. Data extraction
After check the structure of the Seurat object, we can extract the data and metadata from the object.

Full code in Notebook: [11.extract_SC_v4.R](../demos/notebooks/sc/11_extract_SC_v4.html).
!!! warning "Important Note"
    Seurat v5 has a different structure compared to v4, you may need to adjust the following codes accordingly.

<h3> v4 Seurat Object</h3>
```R
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
```

<h3>v5 Seurat Object</h3>
```R
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
```

## 5. Metadata processing
This step processes single cell metadata for visualization, including:

- Metadata filtering and renaming
- UMAP embedding sampling (Subset UMAP points for faster loading)
- Expression data splitting and saving (Save gene expression data in json files)
- Pseudo-bulk level expression calculation

Full code in Notebook: [21.rename_meta.py](../demos/notebooks/sc/21_rename_meta.html).

Set the following parameters according to your dataset:
```python
## This is the output directory from the previous step 
dataset_path = "snRNAseq_MTG_10samples"  

## a list of metadata columns to keep, pick features that you want to visualize
kept_features =[ "nCount_RNA", "nFeature_RNA", "sex", "MajorCellTypes", 
                "updrs", "Complex_Assignment", "mmse", "sample_id", "case",]
sample_col = "sample_id"
cluster_col = "MajorCellTypes"
condition_col = "case"
```

## 6. Computing cluster markers
This step computes cluster markers for each cluster, including:

- Finding cell cluster specific markers
- Calculating differential expression between conditions within each cell cluster
- Performing pseudo-bulk analysis

Full code in Notebook: [31.clustermarkers.R](../demos/notebooks/sc/31_clustermarkers.html).

Set the following parameters according to your dataset:
```R
## Dataset specific parameters
seurat_obj_file <- "snRNAseq_MTG_10samples.rds"
output_dir <- "snRNAseq_MTG_10samples"
cluster_col <- "MajorCellTypes"
condition_col <- "case"
sample_col <- "sample_id"
seurat_type <- "snrnaseq"
```
!!! warning "Important Note"
    You may need to adjust the following codes for your specific dataset.
    ```R
    if (!"data" %in% slotNames(seurat_obj@assays$RNA)) {
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
    ```
## 7. Post-marker processing
This step identifies and analyzes top marker genes for each cell type (or cluster) from single-cell data.
It also calculates detection frequency and average expression for selected marker genes across conditions and sexes.

Full code in Notebook: [41_clustermarkers_postprocess.py](../demos/notebooks/sc/41_clustermarkers_postprocess.html).

Modify the following codes for your specific dataset.
```python
# Define dataset and metadata column names
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
```

## 8. Prepare sample sheet
This step generates a sample sheet file for the dataset.
It includes information about the samples, such as condition, sex, and other relevant metadata.

Download the demo sample sheet file: [Sample_snRNAseq_MTG_10samples.csv](../demos/notebooks/sc/Sample_snRNAseq_MTG_10samples.csv)
!!! danger "Important Note"
    PLEASE KEEP ALL THE COLUMN NAMES AND ORDER AS IS, JUST FILL IN YOUR DATA.

## 9. Dataset configuration file
This step prepares the dataset information.

- The dataset information file is a toml file.
- It is an essential file for the dataset.

Download the demo dataset information file: [dataset_info.toml](../demos/notebooks/sc/dataset_info.toml)
!!! danger "Important Note"
    Dataset configuration file name must be __dataset_info.toml__.
Here is an example of the dataset configuration file content:
```toml
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

[visium_defaults]
samples = [ "BN2023", "BN1076",]         ## List of sample names
features = [ "smoothed_label_s5",...]    ## List of default feature names
genes = [ "SNCA",...]                    ## List of default gene names
```

## 10. Upload dataset
Upload the dataset to server folder.

After running the pipeline, there will be a dataset folder that contains all necessary files:

* The files with names starting with __raw___ are __NOT__ necessary for upload.
* The file named __'pb_expr_matrix.csv'__ in the folder '&lt;dataset_name&gt;/clustermarkers' is __NOT__ necessary for upload.
* Upload the dataset folder named '&lt;dataset_name&gt;' to the server at __'backend/datasets'__.
* Put the dataset configuration file named __'dataset_info.toml'__ to your dataset folder at __'backend/datasets/&lt;dataset_name&gt;'__.
* Upload __samplesheet file__ to the server at __'backend/SampleSheet'__.
* Refresh the database: Go to __'Datasets Management Page '(DATASETS -> +ADD DATASET)__ and click __'REFRESH DB'__.







