import {useEffect, useState} from "react";
import {Box, Typography, Divider, Button, Link} from "@mui/material";

import FilterPanel from "./FilterPanel";
import DatasetDisplay from "./DatasetDisplay.jsx";
import "./DatasetPage.css";
import useDatatableStore from "../../store/DatatableStore.js";

import {useSearchParams} from "react-router-dom";

const DatasetsPage = () => {
    const {datasetRecords, fetchDatasetList} = useDatatableStore();
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize filters from URL params
    const [selectedFilters, setSelectedFilters] = useState({
        assayType: searchParams.getAll("assayType") || [],
        brainRegion: searchParams.getAll("brainRegion") || [],
        brainSubregion: searchParams.getAll("brainSubregion") || [],
        organism: searchParams.getAll("organism") || [],
        tissue: searchParams.getAll("tissue") || [],
        disease: searchParams.getAll("disease") || [],
    })

    useEffect(() => {
        fetchDatasetList()
    }, [fetchDatasetList]);

    // Update URL when filters change
    useEffect(() => {
        const newSearchParams = new URLSearchParams()

        Object.entries(selectedFilters).forEach(([key, values]) => {
            values.forEach((value) => {
                if (value) newSearchParams.append(key, value)
            })
        })

        setSearchParams(newSearchParams, {replace: true})
    }, [selectedFilters, setSearchParams])

    // Handle filter changes
    const handleFilterChange = (filterType, option, checked) => {
        setSelectedFilters((prev) => ({
            ...prev,
            [filterType]: checked ? [...prev[filterType], option] : prev[filterType].filter((item) => item !== option),
        }))
    }

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedFilters({
            assayType: [],
            brainRegion: [],
            brainSubregion: [],
            organism: [],
            tissue: [],
            disease: [],
        })
    }

    // Apply filters to dataset records
    const getFilteredRecords = () => {
        return datasetRecords.filter((record) => {
            // Check assay type filter
            if (selectedFilters.assayType.length > 0 && !selectedFilters.assayType.includes(record.assay)) {
                return false
            }

            // Check brain region filter
            if (
                selectedFilters.brainRegion.length > 0 &&
                !record.brain_super_region
                .split(',')
                .map(region => region.trim())
                .some(region => selectedFilters.brainRegion.includes(region))
            ) {
                return false;
            }

            // Check brain sub-region filter
            if (
                selectedFilters.brainSubregion.length > 0 &&
                !record.brain_region
                .split(',')
                .map(region => region.trim())
                .some(region => selectedFilters.brainSubregion.includes(region))
            ) {
                return false;
            }

            // Check organism filter (assuming you have organism field in your data)
            if (selectedFilters.organism.length > 0 && record.organism && !selectedFilters.organism.includes(record.organism)) {
                return false
            }

            // Check tissue filter (assuming you have tissue field in your data)
            if (selectedFilters.tissue.length > 0 && record.tissue && !selectedFilters.tissue.includes(record.tissue)) {
                return false
            }

            // Check disease filter (assuming you have disease field in your data)
            if (
                selectedFilters.disease.length > 0 &&
                !record.disease
                .split(',')
                .map(d => d.trim())
                .some(d => selectedFilters.disease.includes(d))
            ) {
                return false;
            }

            return true
        })
    }

    const filteredRecords = getFilteredRecords()
    const hasActiveFilters = Object.values(selectedFilters).some((filters) => filters.length > 0)

    const [deleteMode, setDeleteMode] = useState(false);
    // Toggle delete mode
    const toggleDeleteMode = () => {
        setDeleteMode(!deleteMode);
    }

    return (
        <div className="data-page-container" style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            {/* Title Row */}
            <Box className="title-row" sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h4">
                    All datasets
                    {hasActiveFilters && (
                        <Typography component="span" variant="body2" sx={{ml: 2, color: "text.secondary"}}>
                            ({filteredRecords.length} of {datasetRecords.length} datasets)
                        </Typography>
                    )}
                </Typography>
                {/* Right-side Add Button */}
                <Box sx={{display: 'flex', gap: 2}}>
                    {/*<Button variant="contained" color="error" onClick={toggleDeleteMode}>*/}
                    {/*    {deleteMode ? "Cancel Delete" : "- Delete Dataset"}*/}
                    {/*</Button>*/}

                    <Button variant="contained" color="primary">
                        <Link href="/datasetmanager" color="inherit" underline="hover">+ Add Dataset</Link>
                    </Button>
                </Box>
            </Box>
            <Divider/>

            {/* Main Content */}
            <Box className="main-content" style={{flex: 2, display: 'flex', flexDirection: 'row'}}>
                {/* Left Filter Panel */}
                <FilterPanel
                    selectedFilters={selectedFilters}
                    onFilterChange={handleFilterChange}
                    onClearAll={clearAllFilters}
                    hasActiveFilters={hasActiveFilters}
                />
                {/* Right Sample Display Area */}
                <DatasetDisplay dataRecords={filteredRecords} deleteMode={deleteMode}/>
            </Box>
        </div>
    );
};

export default DatasetsPage;
