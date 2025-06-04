import {useState} from "react";
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Pagination, ToggleButtonGroup, ToggleButton, TextField, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import "./DatasetDisplay.css";
import TableChartIcon from "@mui/icons-material/TableChart";
import ListIcon from "@mui/icons-material/List";
import PivotTableChart from "@mui/icons-material/PivotTableChart";
import {Link} from "react-router-dom";

const DatasetDisplay = ({dataRecords}) => {
    const [page, setPage] = useState(1);
    const [displayMode, setDisplayMode] = useState("table"); // "table" or "list"
    const [searchQuery, setSearchQuery] = useState("");

    const [recordsPerPage, setRecordsPerPage] = useState(15);

    const handleChange = (event) => {
        setRecordsPerPage(event.target.value);
    };

    const handleDisplayModeChange = (event, newMode) => {
        setDisplayMode(newMode);
    };


    // Filter data based on the search query
    const filteredData = dataRecords.filter(
        (item) =>
            item.dataset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.PI_full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.first_contributor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.n_samples.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sample_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic: Get only the records for the current page
    const totalPages = Math.ceil(filteredData.length / recordsPerPage);
    const displayedData = filteredData.slice(
        (page - 1) * recordsPerPage,
        page * recordsPerPage
    );

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    return (
        <Box className="data-display-area" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
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
                        <ToggleButton value="matrix" aria-label="Matrix">
                            <PivotTableChart/>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <FormControl sx={{m: 1, minWidth: 120, margin: "0 8px"}} size="small">
                        <InputLabel id="select-records-per-page-label">Records / Page</InputLabel>
                        <Select
                            labelId="select-records-per-page"
                            id="select-records-per-page"
                            value={recordsPerPage}
                            label="Records / Page"
                            onChange={handleChange}
                        >
                            <MenuItem value={15}>15</MenuItem>
                            <MenuItem value={30}>30</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={100}>100</MenuItem>
                        </Select>
                    </FormControl>
                </div>

                <TextField
                    label="Search"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </Box>

            <Box className="data-display" style={{flex: 1, overflowY: 'auto'}}>
                {displayMode === "table" ? (
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayedData.map((record) => (
                                    <TableRow key={record.dataset_id}>
                                        <TableCell><Link to={`/samples/${record.dataset_id}`}>{record.dataset_id}</Link></TableCell>
                                        <TableCell>{record.PI_full_name}</TableCell>
                                        <TableCell>{record.first_contributor}</TableCell>
                                        <TableCell>{record.n_samples}</TableCell>
                                        <TableCell>{record.brain_region}</TableCell>
                                        <TableCell>{record.assay}</TableCell>
                                        <TableCell>
                                            <Box sx={{display: "flex", gap: "10px"}}>
                                                <Link
                                                    to={`/views/geneview?dataset=${record.dataset_id}&sample=all`}>UMAP</Link>
                                                {record.assay === "VisiumST" && <Link
                                                    to={`/views/visiumview?dataset=${record.dataset_id}`}>Visium</Link>}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                ) : (
                    <Box className="data-list">
                        {displayedData.map((record) => (
                            <Box key={record.dataset_id} className="list-item">
                                <Typography variant="h6"><Link
                                    to={`/samples/${record.dataset_id}`}>{record.dataset_id}</Link></Typography>
                                <Box>{record.name}</Box>
                                <Box display="flex" gap={2} sx={{fontSize: "14px", padding: "8px 0"}}>
                                    <Box><b>PI:</b> {record.PI_full_name}</Box>
                                    <Box><b>First contributor:</b> {record.first_contributor}</Box>
                                    <Box><b>Brain Region:</b> {record.brain_region}</Box>
                                    <Box><b># Samples:</b> {record.n_samples}</Box>
                                    <Box><b>Assay type:</b> {record.assay}</Box>
                                </Box>
                                <Box sx={{fontSize: "14px", padding: "8px 0", display: "flex", gap: "8px"}}>
                                    <Link to={`/views/geneview?dataset=${record.dataset_id}&sample=all`}>UMAP</Link>
                                    {record.assay === "VisiumST" &&
                                        <Link to={`/views/visiumview?dataset=${record.dataset_id}`}>Visium</Link>}
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
    );
};

export default DatasetDisplay;
