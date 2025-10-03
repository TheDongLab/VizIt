# xQTL Dataset Preparation
Step-by-step guide for preparing single-cell ATAC-seq/xQTL/GWAS data for visualization in BrainDataPortal.

Learn how to prepare and process single-cell/nuclei ATAC-seq/xQTL/GWAS data for visualization in BrainDataPortal. 
This section covers seurat object processing, gene expression data splitting, metadata table preparation and data formatting.

We will use a brain dataset as an example and cover all essential preprocessing steps.

## 1. Prerequisites
* Python 3.8+ with pandas, numpy, json, polars, fastparquet, pyBigWig libraries installed.
* Basic understanding of single-cell ATAC-seq/QTL concepts.

## 2. Download demo data
We will use a single-cell dataset from human brain. 
This demo dataset contains several cell types from human brain middle brain region.

* Demo dataset and scripts:
> 1. Seurat object: [xQTL_Demo.zip](https://github.com/huruifeng/BrainDataPortal/blob/main/demo_data/seurat_object.rds)
> 2. Gene location file: [gene_annotations.tsv](https://github.com/huruifeng/BrainDataPortal/blob/main/demo_data/gene_annotation.zip)
> 3. SNP location file: [snp_annotations.tsv](https://github.com/huruifeng/BrainDataPortal/blob/main/demo_data/snp_location.zip)
> 4. GWAS summary file: [PD_GWAS.tab](https://github.com/huruifeng/BrainDataPortal/blob/main/demo_data/GWAS_summary.zip)
> 5. Dataset configuration file: [dataset_info.toml](../demos/notebooks/xqtl/dataset_info.toml)
> 6. Processing script: [xqtl_script.zip](../demos/scripts/xqtl_script.zip)

## 3. Preprocessing

In this step, we will read the raw xQTL summary files and extract the necessary columns and filter the data based on the p-values.

- This script should vary depending on the input data.
- Renames QTL data columns to `gene_id, snp_id, p_value, beta_value'.
- Splits QTL data by celltype into `unfiltered_celltypes/`.
- Renames gene and SNP annotation columns to `gene_id`,`position_start`, `position_end`, `strand` and `snp_id`, `position`.
- Filters each celltype in `unfiltered_celltypes/` for entries with p > 0.01 and outputs filtered TSVs into `filtered_celltypes/`.

Full code in Python: [01_preprocessing.py](../demos/scripts/xqtl/01_preprocessing.py).

Modify the following parameters according to your dataset and run the script:
```python
... ...
############################
## define parameters, modify as needed
dataset_name = "eQTLsummary_demo"
qtl_data_files = sorted(glob("eQTLsummary_sampled/*_sampled.tsv"))
geneid_col = "gene_id"
snpid_col = "variant_id"
pvalue_col = "pval_nominal"
beta_col = "slope"
... ...
```
!!! warning "Important Note"
    The QTL summary files should be in the TSV format with the following columns:
    
    <h4> Example xQTL file format (For each cell type,e.g. Astrocytes_eQTL.tsv):</h4>

        Gene    SNP p-value beta
        A1BG    rs1234567   0.02    0.213
        A1BG    rs1234568   0.03    0.314
        A1BG    rs1234569   0.01    0.615


## 4. Mapping cell type names to files
In this step, we will map the cell type names to the files. 
It prompts user for display names that correspond to filenames in`celltypes/`. 
Otherwise the __file names__ will be used.

The python script is: [02_celltype_mapping.py](../demos/scripts/xqtl/02_celltype_mapping.py).
!!! warning "Important Note"
    Change the __dataset_name = "your_dataset_name"__ to your dataset name. 

## 5.Global significance filtering
This step identifies gene-SNP pairs significant in at least one celltype using `filtered_celltypes/`.
Filters `unfiltered_celltypes/` accordingly, and outputs filtered TSVs into `celltypes/`.

Full code in Python: [03_significant.py](../demos/scripts/xqtl/03_significant.py).

## 6. Generate annotation JSONs
This step generates annotation JSONs for genes and SNPs.
The script reads the `gene_annotations.tsv` and `snp_annotations.tsv` files and splits gene and SNP annotation files by chromosome into `gene_locations/` and `snp_locations/`

Full code in Python: [04_annotate.py](../demos/scripts/xqtl/04_annotate.py).

Set the following parameters according to your dataset:
```python
## Dataset specific parameters
## define parameters, modify as needed
dataset_name = "eQTLsummary_demo"
gene_annotation_file = "data/gene_annotations.tsv"
geneid_col = "gene_id"
gene_start_col = "position_start"
gene_end_col = "position_end"
gene_chrom_col = "chromosome" 
gene_strand_col = "strand"  

snp_annotation_file = "data/snp_annotations.tsv"
snpid_col = "snp_id"
snp_chrom_col = "chr"
snp_pos_col = "position"
```
!!! warning "Important Note"
    You can use the demo annotation files provided in the demo data. Or you can prepare your own annotation files. 
    The annotation files should be in the TSV format with the following columns:
    
    <h4> Gene annotation file format (TSV)</h4>

        gene    chromosome  start   end strand
        A1BG    1   1234567 1234568 -
        A1BG    1   1234568 1234569 -
        A1BG    1   1234569 1234570 -

    <h4> SNP annotation file format (TSV)</h4>

        SNP chromosome  position
        rs1234567   1   1234567
        rs1234568   1   1234568
        rs1234569   1   1234569


## 7. Convert to Parquet
This step converts all necessary TSV files to Parquet format for final use.

Full code: [05_parquet.py](../demos/scripts/xqtl/05_parquet.py).

Modify the following codes for your specific dataset.
```python
# Define dataset name
dataset_name = "eQTLsummary_demo"
... ...
```

## 8. Clean up unnecessary files
This step cleans up unnecessary files. It removes the `unfiltered_celltypes/` directory and the `filtered_celltypes/` directory.

Full code: [06_filter_clean.py](../demos/scripts/xqtl/06_filter_clean.py).

Modify the following codes for your specific dataset.
```python
# Define dataset name
dataset_name = "eQTLsummary_demo"
... ...
```

## 9. Prepare GWAS data for visualization
BrainDataPortal can visualize GWAS summary data in the form of a scatter plot.
We provided a script to split the GWAS summary data to required TSV format files.

Full code: [07_gwas.py](../demos/scripts/xqtl/07_gwas.py).

Modify the following codes for your specific dataset.
```python
## Dataset specific parameters
dataset_name = "eQTLsummary_demo"
input_file = "PD_GWAS_with_rsIDs_hg38.tab"
gwas_chrom_col = "#chrom"
gwas_pos_col = "chromEnd"
gwas_snp_col = "rsID"
gwas_beta_col = "b"
gwas_pval_col = "p"
... ...
```

## 10. Prepare dataset information file
Download and modify the demo dataset information file: [dataset_info.toml](../demos/notebooks/xqtl/dataset_info.toml)
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

## 11. Upload dataset
Upload the dataset to server folder.

After running the pipeline, there will be a dataset folder that contains all necessary files:

* The files and folders within the `your_dataset_name` folder are necessary for upload.
* Upload the dataset folder named '&lt;dataset_name&gt;' to the server at __'backend/datasets'__.
* Put the dataset configuration file named __'dataset_info.toml'__ to your dataset folder at __'backend/datasets/&lt;dataset_name&gt;'__.
* Refresh the database: Go to __'Datasets Management Page '(DATASETS -> +ADD DATASET)__ and click __'REFRESH DB'__.







