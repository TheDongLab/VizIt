import { useState } from "react";
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
import "./SamplesDisplay.css";
import TableChartIcon from "@mui/icons-material/TableChart";
import ListIcon from "@mui/icons-material/List";
import PivotTableChart from "@mui/icons-material/PivotTableChart";
import {Link} from "react-router-dom";

const SamplesDisplay = ({ dataRecords}) => {
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
            item.sample_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.source_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tissue.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.brain_region.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.region_level_1.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.assay.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Box className="data-display-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                            <TableChartIcon />
                        </ToggleButton>
                        <ToggleButton value="list" aria-label="List">
                            <ListIcon />
                        </ToggleButton>
                        {/*<ToggleButton value="matrix" aria-label="Matrix">*/}
                        {/*    <PivotTableChart />*/}
                        {/*</ToggleButton>*/}
                    </ToggleButtonGroup>
                    <FormControl sx={{ m: 1, minWidth: 120, margin: "0 8px" }} size="small">
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

            <Box className="data-display" style={{ flex: 1, overflowY: 'auto' }}>
                {displayMode === "table" ? (
                    <Paper className="data-table">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Sample ID</TableCell>
                                    <TableCell>Source subject</TableCell>
                                    <TableCell>Tissue</TableCell>
                                    <TableCell>Brain region</TableCell>
                                    <TableCell>Sub-region</TableCell>
                                    <TableCell>Data type</TableCell>
                                    <TableCell>View</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayedData.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{record.sample_id}</TableCell>
                                        <TableCell>{record.source_id}</TableCell>
                                        <TableCell>{record.tissue}</TableCell>
                                        <TableCell>{record.region_level_1}</TableCell>
                                        <TableCell>{record.region_level_2}</TableCell>
                                        <TableCell>{record.assay}</TableCell>
                                        <TableCell>
                                            <Link to={`/views/geneview?dataset=${record.dataset_id}&sample=${record.sample_id}`}>UMAP</Link> &nbsp;&nbsp;
                                            {record.assay.toLowerCase() === "visiumst" && <Link to={`/views/visiumview?dataset=${record.dataset_id}&sample=${record.sample_id}`}>VisiumST</Link>}
                                            {record.assay.toLowerCase() === "merfish" && <Link to={`/views/visiumview?dataset=${record.dataset_id}&sample=${record.sample_id}`}>MERFISH</Link>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                ) : (
                    <Box className="data-list">
                        {displayedData.map((record) => (
                            <Box key={record.id} className="list-item">
                                <Typography variant="h6">{record.sample_id}</Typography>
                                <Typography variant="body1">
                                  <Box display="flex" gap={2}>
                                    <Box><b>Source subject:</b> {record.source_id}</Box>
                                    <Box><b>Tissue:</b> {record.tissue}</Box>
                                    <Box><b>Brain Region:</b> {record.brain_region}</Box>
                                    <Box><b>Region Level 1:</b> {record.region_level_1}</Box>
                                    <Box><b>Assay type:</b> {record.assay}</Box>
                                  </Box>
                                  <Box sx={{fontSize: "14px", padding: "8px 0"}}>
                                    <Link to={`/views/geneview?dataset=${record.dataset_id}&sample=${record.sample_id}`}>View UMAP</Link> &nbsp;&nbsp;
                                      {record.assay.toLowerCase() === "visiumst" && <Link to={`/views/visiumview?dataset=${record.dataset_id}&sample=${record.sample_id}`}>VisiumST</Link>}&nbsp;&nbsp;
                                      {record.assay.toLowerCase() === "merfish" && <Link to={`/views/visiumview?dataset=${record.dataset_id}&sample=${record.sample_id}`}>MERFISH</Link>}&nbsp;&nbsp;
                                  </Box>
                                </Typography>
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

export default SamplesDisplay;
