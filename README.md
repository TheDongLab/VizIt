# BrainDataPortal

## Installation and running
The Documentation for installation and running the app is available at <a href="https://huruifeng.github.io/BrainDataPortal/" target="_blank">BrainDataPortal Docs</a>.

### NOTES:
- 1. Load all the meta data when first load the page, separate the meta data into cell level and sample level
- 2. To reduce the size of the meta data file, meta file only save an index/key of the meta string. And the actual meta data is stored in a JSON file (Dict).


## Overview
- This is project designed for the brain omics data analysis and visualization.
- The data assays include: scRNAseq, scATACseq, ChIPseq, Spatial Transcriptomics and other omics data.
- The backend is using [FastAPI](https://fastapi.tiangolo.com/) and [uvicorn](https://www.starlette.io/).
- The frontend is using [React](https://react.dev/) and [Vite](https://vitejs.dev/).
- The data is stored in [SQLite3](https://www.sqlite.org/) and JSON files.
- Use zustand for state management, and Material UI for web page layout design

## Directory structure:

    BrainDataPortal/
    |-- Backend/
    |   |-- main.py                         ## The main entry of the backend
    |   |-- db.py                           ## The database connection and management
    |   |-- settings.py                     ## The configuration of the backend
    |   |-- requirements.txt                ## The required libraries of the backend
    |   |-- funcs/                          ## This folder contains request handler functions of the backend
    |   |   |-- get_data.py                 ## The request handler functions for data
    |   |   |-- utils.py                    ## The utils functions
    |   |   `-- ...
    |   |-- models/                         ## This folder contains database models of the backend
    |   |   |-- dataset.py                  ## The dataset model/table
    |   |   `-- ...
    |   |-- routes/                         ## This folder contains routes endpoints of requests
    |   |   |-- api_routes.py                
    |   |   |-- qtl_routes.py
    |   |   |-- visium_routes.py
    |   |   `-- ...
    |   |-- SampleSheets/                   ## Upload sample sheets here when adding new datasets
    |   |   |-- Sample_snRNAseq.csv
    |   |   `-- ...
    |   |-- datasets/                       ## The datasets are stored here
    |   |   |-- dataset_1/
    |   |   |   |-- meta_cell.json
    |   |   |   |-- meta_sample.json
    |   |   |   |-- ...
    |   |   `-- ...
    |   |-- bdp_db.db                        ## The database file
    |   `-- ...
    |-- Frontend
    |   |-- index.html                      ## The entry page of the frontend
    |   |-- vite.config.js                  ## The vite configuration file
    |   |-- package.json                    ## The dependencies and dev/build settings of the frontend
    |   |-- env/                            ## The environment variables
    |   |   |-- .env                        ## The global environment variables
    |   |   |-- .env.development            ## The development environment variables
    |   |   `-- .env.production             ## The production environment variables
    |   |-- src/                            ## The source code of the frontend
    |   |   |-- App.jsx                     ## Define the routes of the frontend
    |   |   |-- index.css                   ## The global styles of the frontend
    |   |   |-- main.jsx                   ## The entry file of the frontend
    |   |   |-- components/                 ## The components of the frontend
    |   |   |   `-- ...
    |   |   |-- pages/                      ## The pages of the frontend
    |   |   |   `-- ...
    |   |   |-- utils/                      ## The fucntional utils
    |   |   |   `-- ...
    |   |   |-- store/                      ## The stores for state management
    |   |   |-- api/                        ## The api for data fetching
    |   |   `-- ...
    |   `-- ...
    `-- README.md

## Example pages
#### Home Page
<img src="docs/screenshots/home.png" width="800">

#### Dataset selection
<img src="docs/screenshots/dataset.png" width="800">

#### Single Cell UMAP clustering & gene expression
<img src="docs/screenshots/sc_page.png" width="800">
<img src="docs/screenshots/gene_view.png" width="800">

#### Cluster analysis
<img src="docs/screenshots/cluster1.png" width="800">
<img src="docs/screenshots/cluster2.png" width="800">

#### Spatial Transcriptomics
<img src="docs/screenshots/Visium_page.png" width="800">

#### XQTL analysis & Peak signals
<img src="docs/screenshots/xqtl.png" width="800">
<img src="docs/screenshots/peaksignal.png" width="800">

### Video examples are available here: [BrainDataPortal Video Demo](https://huruifeng.github.io/BrainDataPortal/#video-demo)