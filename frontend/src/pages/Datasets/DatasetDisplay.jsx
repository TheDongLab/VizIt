"use client"

import {useState, useEffect} from "react"
import {useSearchParams} from "react-router-dom"
import {
    Box, Typography, Paper, Pagination,
    Table, TableHead, TableBody, TableRow, TableCell,
    ToggleButtonGroup, ToggleButton,
    TextField, FormControl, InputLabel,
    Select, MenuItem, Button,
} from "@mui/material"
import "./DatasetDisplay.css"
import TableChartIcon from "@mui/icons-material/TableChart"
import ListIcon from "@mui/icons-material/List"
import PivotTableChart from "@mui/icons-material/PivotTableChart"
import {Link} from "react-router-dom"
import useDatasetManageStore from "../../store/DatasetManageStore.js";
import {toast} from "react-toastify";

const DatasetDisplay = ({dataRecords, deleteMode}) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const {deleteDataset} = useDatasetManageStore()

    // Get initial values from URL params
    const [page, setPage] = useState(Number.parseInt(searchParams.get("page")) || 1)
    const [displayMode, setDisplayMode] = useState(searchParams.get("view") || "table")
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
    const [recordsPerPage, setRecordsPerPage] = useState(Number.parseInt(searchParams.get("limit")) || 15)

    // Update URL when display settings change
    useEffect(() => {
        const newSearchParams = new URLSearchParams(searchParams)

        // Update display-related params
        if (page !== 1) newSearchParams.set("page", page.toString())
        else newSearchParams.delete("page")

        if (displayMode !== "table") newSearchParams.set("view", displayMode)
        else newSearchParams.delete("view")

        if (searchQuery) newSearchParams.set("search", searchQuery)
        else newSearchParams.delete("search")

        if (recordsPerPage !== 15) newSearchParams.set("limit", recordsPerPage.toString())
        else newSearchParams.delete("limit")

        setSearchParams(newSearchParams, {replace: true})
    }, [page, displayMode, searchQuery, recordsPerPage, searchParams, setSearchParams])

    const handleRecordsPerPageChange = (event) => {
        setRecordsPerPage(event.target.value)
        setPage(1) // Reset to first page when changing records per page
    }

    const handleDisplayModeChange = (event, newMode) => {
        if (newMode) setDisplayMode(newMode)
    }

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value)
        setPage(1) // Reset to first page when searching
    }

    // Filter data based on the search query (this now works on already filtered data from parent)
    const searchFilteredData = dataRecords.filter(
        (item) =>
            item.dataset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.dataset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.PI_full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.first_contributor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.n_samples.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.organism.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.brain_region.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.assay.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Pagination logic: Get only the records for the current page
    const totalPages = Math.ceil(searchFilteredData.length / recordsPerPage)
    const displayedData = searchFilteredData.slice((page - 1) * recordsPerPage, page * recordsPerPage)

    const handlePageChange = (event, value) => {
        setPage(value)
    }

    // Reset page when filtered data changes
    useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(1)
        }
    }, [totalPages, page])

    const handleDeleteDataset = async (datasetId) => {
        // Confirm deletion
        if (window.confirm(`Are you sure you want to delete dataset ${datasetId}?`)) {
            // Call your API or store method to delete the dataset
            console.log(`Deleting dataset: ${datasetId}`);
            const response = await deleteDataset(datasetId);
            console.log(response);
            if (response.success) {
                toast.success(`Dataset ${datasetId} deleted successfully!`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
                // reload the dataset list
                window.location.reload();
            } else {
                toast.error(`Failed to delete dataset ${datasetId}: ${response.message}`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
            }
        } else {
            console.log("Deletion canceled");
        }
    }

    return (
        <Box className="data-display-area" style={{flex: 1, display: "flex", flexDirection: "column"}}>
            <Box className="data-toolbar">
                <div>
                    <ToggleButtonGroup
                        size="small"
                        value={displayMode}
                        exclusive
                        onChange={handleDisplayModeChange}
                        aria-label="display mode"
                    >
                        <ToggleButton value="table" aria-label="Table">
                            <TableChartIcon/>
                        </ToggleButton>
                        <ToggleButton value="list" aria-label="List">
                            <ListIcon/>
                        </ToggleButton>
                        {/*<ToggleButton value="matrix" aria-label="Matrix">*/}
                        {/*    <PivotTableChart/>*/}
                        {/*</ToggleButton>*/}
                    </ToggleButtonGroup>
                    <FormControl sx={{m: 1, minWidth: 120, margin: "0 8px"}} size="small">
                        <InputLabel id="select-records-per-page-label">Records / Page</InputLabel>
                        <Select
                            labelId="select-records-per-page"
                            id="select-records-per-page"
                            value={recordsPerPage}
                            label="Records / Page"
                            onChange={handleRecordsPerPageChange}
                        >
                            <MenuItem value={15}>15</MenuItem>
                            <MenuItem value={30}>30</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={100}>100</MenuItem>
                        </Select>
                    </FormControl>
                </div>

                <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
                    <Typography variant="body2" color="text.secondary">
                        {searchFilteredData.length} results
                    </Typography>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </Box>
            </Box>

            <Box className="data-display" style={{flex: 1, overflowY: "auto"}}>
                {displayedData.length === 0 ? (
                    <Box sx={{textAlign: "center", py: 4}}>
                        <Typography variant="h6" color="text.secondary">
                            No datasets found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Try adjusting your filters or search terms
                        </Typography>
                    </Box>
                ) : displayMode === "table" ? (
                    <Paper className="data-table">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Dataset ID</TableCell>
                                    <TableCell>PI</TableCell>
                                    <TableCell>First contributor</TableCell>
                                    <TableCell># Samples</TableCell>
                                    <TableCell>Brain region</TableCell>
                                    <TableCell>Assay</TableCell>
                                    <TableCell>View</TableCell>
                                    {deleteMode && <TableCell>Delete</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayedData.map((record) => (
                                    <TableRow key={record.dataset_id}>
                                        <TableCell>
                                            {record.sample_sheet === "None" || record.sample_sheet === null || record.sample_sheet.trim() === "" ? record.dataset_id :
                                                <Link to={`/samples/${record.dataset_id}`}>{record.dataset_id}</Link>}
                                        </TableCell>
                                        <TableCell>{record.PI_full_name}</TableCell>
                                        <TableCell>{record.first_contributor}</TableCell>
                                        <TableCell>{record.n_samples}</TableCell>
                                        <TableCell>{record.brain_region}</TableCell>
                                        <TableCell>{record.assay}</TableCell>
                                        <TableCell>
                                            <Box sx={{display: "flex", gap: "10px"}}>
                                                {["scrnaseq", "snrnaseq", "visiumst"].includes(record.assay.toLowerCase()) && (
                                                    <Link to={`/views/geneview?dataset=${record.dataset_id}&sample=all`}>UMAP</Link>)}
                                                {/*{["visiumst","visium"].includes(record.assay.toLowerCase()) && (<Link to={`/views/visiumview?dataset=${record.dataset_id}`}>Visium</Link>)}*/}
                                                {["eqtl", "caqtl"].includes(record.assay.toLowerCase()) && (<Link to={`/views/xqtlview?dataset=${record.dataset_id}`}>xQTL</Link>)}
                                                {record.has_bw && (<Link to={`/views/genomicregionview?dataset=${record.dataset_id}&region=chr1:1000000-2000000`}>Peaks</Link>)}
                                            </Box>
                                        </TableCell>
                                        {deleteMode && (
                                            <TableCell>
                                                <Button variant="outlined" color="error" size="small"
                                                        onClick={() => handleDeleteDataset(record.dataset_id)}>
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                ) : (
                    <Box className="data-list">
                        {displayedData.map((record) => (
                            <Box key={record.dataset_id} className="list-item">
                                <Typography variant="h6" color="text.secondary">
                                    <Link to={`/samples/${record.dataset_id}`}>{record.dataset_id}</Link>
                                </Typography>
                                <Box display="flex" gap={2} sx={{fontSize: "14px", padding: "8px 0"}}>
                                    <Box>
                                        <b>PI:</b> {record.PI_full_name}
                                    </Box>
                                    <Box>
                                        <b>First contributor:</b> {record.first_contributor}
                                    </Box>
                                    <Box>
                                        <b>Brain Region:</b> {record.brain_region}
                                    </Box>
                                    <Box>
                                        <b># Samples:</b> {record.n_samples}
                                    </Box>
                                    <Box>
                                        <b>Assay type:</b> {record.assay}
                                    </Box>
                                </Box>
                                <Box sx={{fontSize: "14px", padding: "8px 0", display: "flex", gap: "8px"}}>
                                    {["scrnaseq", "snrnaseq", "visiumst"].includes(record.assay.toLowerCase()) && (<Link
                                        to={`/views/geneview?dataset=${record.dataset_id}&sample=all`}>UMAP</Link>)}
                                    {/*{["visiumst","visium"].includes(record.assay.toLowerCase()) && (<Link to={`/views/visiumview?dataset=${record.dataset_id}`}>Visium</Link>)}*/}
                                    {["eqtl", "caqtl"].includes(record.assay.toLowerCase()) && (
                                        <Link to={`/views/xqtlview?dataset=${record.dataset_id}`}>xQTL</Link>)}
                                </Box>
                                <Box sx={{fontSize: "14px", display: "flex", gap: "8px", justifyContent: "flex-end"}}>
                                    {deleteMode && (
                                        <Button variant="outlined" color="error" size="small"
                                                onClick={() => handleDeleteDataset(record.dataset_id)}>
                                            Delete
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Pagination Component */}
                {totalPages > 1 && (
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        className="pagination"
                    />
                )}
            </Box>
        </Box>
    )
}

export default DatasetDisplay
