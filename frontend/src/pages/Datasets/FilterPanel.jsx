"use client"

import {useState} from "react"
import {Typography, Divider, Checkbox, FormControlLabel, Button, Chip, Box} from "@mui/material"
import {ExpandLess, ExpandMore, Clear} from "@mui/icons-material"
import "./FilterPanel.css"
import useDatatableStore from "../../store/DatatableStore.js";

const FilterPanel = ({selectedFilters, onFilterChange, onClearAll, hasActiveFilters}) => {
    const [expandedFilters, setExpandedFilters] = useState({
        assayType: true,
        tissue: true,
        brainRegion: true,
        brainSubregion: false,
        organism: false,
        disease: false,
    })

    const toggleFilter = (filter) => {
        setExpandedFilters((prev) => ({
            ...prev,
            [filter]: !prev[filter],
        }))
    }

    const {datasetFilters} = useDatatableStore();

    const handleCheckboxChange = (filterKey, option) => (event) => {
        onFilterChange(filterKey, option, event.target.checked)
    }

    const getTotalActiveFilters = () => {
        return Object.values(selectedFilters).reduce((total, filters) => total + filters.length, 0)
    }

    return (
        <div className="dataset-filter-panel">
            <div className="panel-title">
                <Typography variant="h6">Dataset filters</Typography>
                {hasActiveFilters && (
                    <Box sx={{mt: 1, mb: 2}}>
                        <Button size="small" startIcon={<Clear/>} onClick={onClearAll} sx={{mb: 1}}>
                            Clear all ({getTotalActiveFilters()})
                        </Button>
                        <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5}}>
                            {Object.entries(selectedFilters).map(([filterType, values]) =>
                                values.map((value) => (
                                    <Chip
                                        key={`${filterType}-${value}`}
                                        label={value}
                                        size="small"
                                        onDelete={() => onFilterChange(filterType, value, false)}
                                        sx={{fontSize: "0.75rem"}}
                                    />
                                )),
                            )}
                        </Box>
                    </Box>
                )}
            </div>

            {datasetFilters.map((filter, index) => (
                <div key={filter.key} className="filter-section">
                    {/* Filter Header */}
                    <div className="filter-header" onClick={() => toggleFilter(filter.key)}>
                        <Typography variant="subtitle1">
                            {filter.title}
                            {selectedFilters[filter.key].length > 0 && (
                                <Typography component="span" variant="caption" sx={{ml: 1, color: "primary.main"}}>
                                    ({selectedFilters[filter.key].length})
                                </Typography>
                            )}
                        </Typography>
                        <span className="toggle-icon">{expandedFilters[filter.key] ? <ExpandLess/> :
                            <ExpandMore/>}</span>
                    </div>

                    {/* Filter Options */}
                    {expandedFilters[filter.key] && (
                        <div className="filter-options">
                            {filter.options.map((option, idx) => (
                                <FormControlLabel
                                    sx={{fontSize: "0.8rem", display: "block"}}
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={selectedFilters[filter.key].includes(option)}
                                            onChange={handleCheckboxChange(filter.key, option)}
                                        />
                                    }
                                    label={option}
                                    className="filter-option-item"
                                />
                            ))}
                        </div>
                    )}

                    {/* Separator */}
                    {index < datasetFilters.length - 1 && <Divider/>}
                </div>
            ))}
        </div>
    )
}

export default FilterPanel
