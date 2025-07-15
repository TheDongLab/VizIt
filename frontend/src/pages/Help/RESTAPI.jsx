"use client"

import {useState} from "react"
import {
    Container,
    Typography,
    Box,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Button,
    Grid,
    Alert,
    Tab,
    Tabs,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Card, CardContent, Stack,
} from "@mui/material"
import {
    ExpandMore as ExpandMoreIcon,
    ContentCopy as CopyIcon,
    Code as CodeIcon,
    Security as SecurityIcon,
    DataObject as DataIcon,
    Analytics as AnalyticsIcon,
    Person as PersonIcon,
    Visibility as VisibilityIcon,
} from "@mui/icons-material"

const apiEndpoints = [
    {
        id: "auth",
        category: "Authentication",
        icon: <SecurityIcon/>,
        color: "#d32f2f",
        endpoints: [
            {
                method: "POST",
                path: "/auth/login",
                summary: "User login",
                description: "Authenticate user and receive access token",
                requestBody: {
                    email: "user@example.com",
                    password: "password123",
                },
                response: {
                    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    token_type: "bearer",
                    expires_in: 3600,
                    user: {
                        id: "user123",
                        email: "user@example.com",
                        name: "John Doe",
                    },
                },
                parameters: [],
            },
            {
                method: "POST",
                path: "/auth/refresh",
                summary: "Refresh access token",
                description: "Get a new access token using refresh token",
                requestBody: {
                    refresh_token: "refresh_token_here",
                },
                response: {
                    access_token: "new_access_token",
                    expires_in: 3600,
                },
                parameters: [],
            },
        ],
    },
    {
        id: "datasets",
        category: "Datasets",
        icon: <DataIcon/>,
        color: "#388e3c",
        endpoints: [
            {
                method: "GET",
                path: "/datasets",
                summary: "List all datasets",
                description: "Retrieve a list of all available datasets",
                requestBody: null,
                response: {
                    datasets: [
                        {
                            id: "dataset123",
                            name: "Brain scRNA-seq Study",
                            description: "Single-cell RNA sequencing of mouse brain",
                            cell_count: 15000,
                            gene_count: 20000,
                            created_at: "2024-01-15T10:30:00Z",
                            status: "processed",
                        },
                    ],
                    total: 1,
                    page: 1,
                    per_page: 20,
                },
                parameters: [
                    {name: "page", type: "integer", description: "Page number (default: 1)"},
                    {name: "per_page", type: "integer", description: "Items per page (default: 20)"},
                    {name: "search", type: "string", description: "Search term for dataset name"},
                ],
            },
            {
                method: "POST",
                path: "/datasets",
                summary: "Create new dataset",
                description: "Upload and create a new dataset",
                requestBody: {
                    name: "My Dataset",
                    description: "Description of the dataset",
                    data_type: "scRNA-seq",
                    file_format: "h5ad",
                },
                response: {
                    id: "dataset456",
                    name: "My Dataset",
                    status: "uploading",
                    upload_url: "https://api.braindataportal.com/upload/dataset456",
                },
                parameters: [],
            },
            {
                method: "GET",
                path: "/datasets/{dataset_id}",
                summary: "Get dataset details",
                description: "Retrieve detailed information about a specific dataset",
                requestBody: null,
                response: {
                    id: "dataset123",
                    name: "Brain scRNA-seq Study",
                    description: "Single-cell RNA sequencing of mouse brain",
                    cell_count: 15000,
                    gene_count: 20000,
                    metadata: {
                        organism: "Mus musculus",
                        tissue: "brain",
                        technology: "10x Genomics",
                    },
                    created_at: "2024-01-15T10:30:00Z",
                    status: "processed",
                },
                parameters: [{name: "dataset_id", type: "string", description: "Unique dataset identifier"}],
            },
        ],
    },
    {
        id: "analysis",
        category: "Analysis",
        icon: <AnalyticsIcon/>,
        color: "#f57c00",
        endpoints: [
            {
                method: "POST",
                path: "/analysis/jobs",
                summary: "Submit analysis job",
                description: "Submit a new analysis job for processing",
                requestBody: {
                    dataset_id: "dataset123",
                    analysis_type: "clustering",
                    parameters: {
                        resolution: 0.5,
                        n_neighbors: 15,
                        min_dist: 0.1,
                    },
                },
                response: {
                    job_id: "job789",
                    status: "queued",
                    estimated_time: "5-10 minutes",
                    created_at: "2024-01-15T11:00:00Z",
                },
                parameters: [],
            },
            {
                method: "GET",
                path: "/analysis/jobs/{job_id}",
                summary: "Get job status",
                description: "Check the status of an analysis job",
                requestBody: null,
                response: {
                    job_id: "job789",
                    status: "completed",
                    progress: 100,
                    results: {
                        clusters: 12,
                        output_file: "https://api.braindataportal.com/files/job789_results.h5ad",
                    },
                    created_at: "2024-01-15T11:00:00Z",
                    completed_at: "2024-01-15T11:07:30Z",
                },
                parameters: [{name: "job_id", type: "string", description: "Unique job identifier"}],
            },
        ],
    },
    {
        id: "visualization",
        category: "Visualization",
        icon: <VisibilityIcon/>,
        color: "#7b1fa2",
        endpoints: [
            {
                method: "GET",
                path: "/visualization/plot-data/{dataset_id}",
                summary: "Get plot data",
                description: "Retrieve data for creating visualizations",
                requestBody: null,
                response: {
                    coordinates: [
                        {x: 1.23, y: -0.45, cluster: "Neurons"},
                        {x: -0.67, y: 2.11, cluster: "Astrocytes"},
                    ],
                    metadata: {
                        plot_type: "umap",
                        total_cells: 15000,
                    },
                },
                parameters: [
                    {name: "dataset_id", type: "string", description: "Dataset identifier"},
                    {name: "plot_type", type: "string", description: "Type of plot (umap, tsne, pca)"},
                    {name: "color_by", type: "string", description: "Metadata column to color by"},
                ],
            },
        ],
    },
]

const codeExamples = {
    javascript: `// JavaScript/Node.js example
const response = await fetch('https://api.braindataportal.com/datasets', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
    python: `# Python example
import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.braindataportal.com/datasets',
    headers=headers
)

data = response.json()
print(data)`,
    r: `# R example
library(httr)
library(jsonlite)

headers <- add_headers(
  'Authorization' = 'Bearer YOUR_ACCESS_TOKEN',
  'Content-Type' = 'application/json'
)

response <- GET(
  'https://api.braindataportal.com/datasets',
  headers
)

data <- fromJSON(content(response, 'text'))
print(data)`,
    curl: `# cURL example
curl -X GET "https://api.braindataportal.com/datasets" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`,
}

function TabPanel({children, value, index}) {
    return <div hidden={value !== index}>{value === index && <Box sx={{p: 3}}>{children}</Box>}</div>
}

function CodeBlock({code, language = "json"}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Box position="relative">
            <Paper
                sx={{
                    bgcolor: "#1e1e1e",
                    color: "#d4d4d4",
                    p: 2,
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    overflow: "auto",
                    maxHeight: "400px",
                }}
            >
        <pre style={{margin: 0, whiteSpace: "pre-wrap"}}>
          {typeof code === "object" ? JSON.stringify(code, null, 2) : code}
        </pre>
            </Paper>
            <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                <IconButton
                    onClick={handleCopy}
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "rgba(255,255,255,0.1)",
                        color: "white",
                        "&:hover": {bgcolor: "rgba(255,255,255,0.2)"},
                    }}
                    size="small"
                >
                    <CopyIcon fontSize="small"/>
                </IconButton>
            </Tooltip>
        </Box>
    )
}

function MethodChip({method}) {
    const colors = {
        GET: "#4caf50",
        POST: "#2196f3",
        PUT: "#ff9800",
        DELETE: "#f44336",
        PATCH: "#9c27b0",
    }

    return (
        <Chip
            label={method}
            size="small"
            sx={{
                bgcolor: colors[method] || "#757575",
                color: "white",
                fontWeight: "bold",
                minWidth: 60,
            }}
        />
    )
}

export default function RESTAPIPage() {
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [expanded, setExpanded] = useState(false)
    const [codeTab, setCodeTab] = useState(0)

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false)
    }

    const filteredEndpoints = selectedCategory
        ? apiEndpoints.filter((category) => category.id === selectedCategory)
        : apiEndpoints

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            {/* Header */}
            <Box textAlign="center" mb={4}>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                    REST API Reference
                </Typography>
                <Typography variant="h6" color="text.secondary" mb={4}>
                    Complete guide to BrainDataPortal REST API endpoints
                </Typography>
            </Box>

            {/* Quick Start */}
            <Paper elevation={2} sx={{p: 4, mb: 4, bgcolor: "primary.main", color: "white"}}>
                <Typography variant="h5" gutterBottom>
                    Quick Start
                </Typography>
                <Typography variant="body1" mb={2}>
                    Base URL:{" "}
                    <code style={{bgcolor: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: "4px"}}>
                        https://api.braindataportal.com/v1
                    </code>
                </Typography>
                <Typography variant="body1">
                    All API requests require authentication using Bearer tokens. Include your token in the Authorization
                    header.
                </Typography>
            </Paper>

            {/* Authentication Info */}
            <Alert severity="info" sx={{mb: 4}}>
                <Typography variant="subtitle2" gutterBottom>
                    Authentication Required
                </Typography>
                <Typography variant="body2">
                    Most endpoints require authentication. Include your access token in the Authorization header:
                    <code style={{marginLeft: 8}}>Authorization: Bearer YOUR_ACCESS_TOKEN</code>
                </Typography>
            </Alert>

            {/* Category Filter */}
            <Paper elevation={1} sx={{p: 3, mb: 4}}>
                <Typography variant="h6" gutterBottom>
                    API Categories
                </Typography>
                <Grid container spacing={2}>
                    <Grid item>
                        <Chip
                            label="All Categories"
                            onClick={() => setSelectedCategory(null)}
                            color={selectedCategory === null ? "primary" : "default"}
                            variant={selectedCategory === null ? "filled" : "outlined"}
                        />
                    </Grid>
                    {apiEndpoints.map((category) => (
                        <Grid item key={category.id}>
                            <Chip
                                label={category.category}
                                onClick={() => setSelectedCategory(category.id)}
                                color={selectedCategory === category.id ? "primary" : "default"}
                                variant={selectedCategory === category.id ? "filled" : "outlined"}
                                icon={category.icon}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Code Examples */}
            <Paper elevation={1} sx={{mb: 4}}>
                <Box sx={{borderBottom: 1, borderColor: "divider"}}>
                    <Tabs value={codeTab} onChange={(e, newValue) => setCodeTab(newValue)}>
                        <Tab label="JavaScript"/>
                        <Tab label="Python"/>
                        <Tab label="R"/>
                        <Tab label="cURL"/>
                    </Tabs>
                </Box>
                <TabPanel value={codeTab} index={0}>
                    <CodeBlock code={codeExamples.javascript} language="javascript"/>
                </TabPanel>
                <TabPanel value={codeTab} index={1}>
                    <CodeBlock code={codeExamples.python} language="python"/>
                </TabPanel>
                <TabPanel value={codeTab} index={2}>
                    <CodeBlock code={codeExamples.r} language="r"/>
                </TabPanel>
                <TabPanel value={codeTab} index={3}>
                    <CodeBlock code={codeExamples.curl} language="bash"/>
                </TabPanel>
            </Paper>

            {/* API Endpoints */}
            <Typography variant="h4" gutterBottom sx={{mt: 4, mb: 3}}>
                API Endpoints
            </Typography>

            {filteredEndpoints.map((category) => (
                <Box key={category.id} mb={4}>
                    <Paper elevation={2} sx={{mb: 2}}>
                        <Box
                            sx={{
                                p: 3,
                                bgcolor: category.color,
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            {category.icon}
                            <Typography variant="h5" fontWeight="bold">
                                {category.category}
                            </Typography>
                        </Box>
                    </Paper>

                    {category.endpoints.map((endpoint, index) => (
                        <Accordion
                            key={`${category.id}-${index}`}
                            expanded={expanded === `${category.id}-${index}`}
                            onChange={handleAccordionChange(`${category.id}-${index}`)}
                            sx={{mb: 1, boxShadow: 1}}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                <Box display="flex" alignItems="center" gap={2} width="100%">
                                    <MethodChip method={endpoint.method}/>
                                    <Typography variant="h6" fontFamily="monospace">
                                        {endpoint.path}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ml: "auto"}}>
                                        {endpoint.summary}
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="body1" paragraph>
                                            {endpoint.description}
                                        </Typography>
                                    </Grid>

                                    {/* Parameters */}
                                    {endpoint.parameters.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom>
                                                Parameters
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Name</TableCell>
                                                            <TableCell>Type</TableCell>
                                                            <TableCell>Description</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {endpoint.parameters.map((param, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell>
                                                                    <code>{param.name}</code>
                                                                </TableCell>
                                                                <TableCell>{param.type}</TableCell>
                                                                <TableCell>{param.description}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Grid>
                                    )}

                                    {/* Request Body */}
                                    {endpoint.requestBody && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="h6" gutterBottom>
                                                Request Body
                                            </Typography>
                                            <CodeBlock code={endpoint.requestBody}/>
                                        </Grid>
                                    )}

                                    {/* Response */}
                                    <Grid item xs={12} md={endpoint.requestBody ? 6 : 12}>
                                        <Typography variant="h6" gutterBottom>
                                            Response
                                        </Typography>
                                        <CodeBlock code={endpoint.response}/>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            ))}

            {/* Error Codes */}
            <Paper elevation={2} sx={{p: 4, mt: 2}}>
                <Typography variant="h5">
                    HTTP Status Codes
                </Typography>
                <Card elevation={0} sx={{mb: 2, border: "0px solid #D0D7DE"}}>
                    <CardContent sx={{p: 4}}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={2}>
                                    {[
                                        {code: "200", status: "OK", description: "Request successful"},
                                        {code: "201", status: "Created", description: "Resource created successfully"},
                                        {code: "400", status: "Bad Request", description: "Invalid request parameters"},
                                        {code: "401", status: "Unauthorized", description: "Authentication required"},
                                    ].map((item) => (
                                        <Box key={item.code} display="flex" alignItems="center" gap={2}>
                                            <Chip
                                                label={item.code}
                                                sx={{
                                                    bgcolor: item.code.startsWith("2") ? "#DCFCE7" : "#FEF2F2",
                                                    color: item.code.startsWith("2") ? "#166534" : "#DC2626",
                                                    fontFamily: "monospace",
                                                    fontWeight: 600,
                                                    minWidth: 50,
                                                }}
                                            />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {item.status}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={2}>
                                    {[
                                        {code: "403", status: "Forbidden", description: "Insufficient permissions"},
                                        {code: "404", status: "Not Found", description: "Resource not found"},
                                        {code: "429", status: "Too Many Requests", description: "Rate limit exceeded"},
                                        {
                                            code: "500",
                                            status: "Internal Server Error",
                                            description: "Server error occurred"
                                        },
                                    ].map((item) => (
                                        <Box key={item.code} display="flex" alignItems="center" gap={2}>
                                            <Chip
                                                label={item.code}
                                                sx={{
                                                    bgcolor: "#FEF2F2",
                                                    color: "#DC2626",
                                                    fontFamily: "monospace",
                                                    fontWeight: 600,
                                                    minWidth: 50,
                                                }}
                                            />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {item.status}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Paper>

            {/* Support Section */}
            <Paper elevation={2} sx={{p: 4, mt: 4, textAlign: "center", bgcolor: "grey.50"}}>
                <Typography variant="h5" gutterBottom>
                    Need Help?
                </Typography>
                <Typography variant="body1" mb={2}>
                    Check out our documentation or contact our support team for assistance.
                </Typography>
                <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                    <Button variant="outlined" startIcon={<CodeIcon/>}>
                        View SDK Documentation
                    </Button>
                    <Button variant="outlined" startIcon={<PersonIcon/>}>
                        Contact Support
                    </Button>
                </Box>
            </Paper>
        </Container>
    )
}
