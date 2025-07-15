"use client"

import React from "react"
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Tabs,
    Tab,
    Alert,
    AlertTitle,
    Container,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Button,
    ThemeProvider,
    createTheme,
    CssBaseline,
} from "@mui/material"
import {
    Code,
    Storage,
    Settings,
    CloudUpload,
    Group,
    Terminal,
    Folder,
    Language,
    Computer,
    CheckCircle,
    ArrowForward,
    Info,
    DataObject,
    Biotech,
    Analytics,
    Science,
    BarChart,
    Timeline,
    Layers,
    Memory,
    Dns,
    Api,
    GitHub,
    Visibility,
} from "@mui/icons-material"
import "./Help.css"

// Create a custom theme with better colors
const theme = createTheme({
    palette: {
        primary: {main: "#6366f1", light: "#818cf8", dark: "#4f46e5",},
        secondary: {main: "#ec4899", light: "#f472b6", dark: "#db2777",},
        background: {default: "#f9fafb", paper: "#ffffff",},
        success: {
            main: "#10b981", light: "#34d399", dark: "#059669",
        },
        info: {
            main: "#3b82f6", light: "#60a5fa", dark: "#2563eb",
        },
        warning: {
            main: "#f59e0b", light: "#fbbf24", dark: "#d97706",
        },
        error: {
            main: "#ef4444", light: "#f87171", dark: "#dc2626",
        },
    }, typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        h1: {fontWeight: 700},
        h2: {fontWeight: 700},
        h3: {fontWeight: 600},
        h4: {fontWeight: 600},
        h5: {fontWeight: 600},
        h6: {fontWeight: 600},
    }, shape: {
        borderRadius: 12,
    }, components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 500,
                },
            },
        }, MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                },
            },
        }, MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        }, MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: "none", fontWeight: 500, fontSize: "1rem",
                },
            },
        },
    },
})

function TabPanel(props) {
    const {children, value, index, ...other} = props

    return (<div
        role="tabpanel"
        hidden={value !== index}
        id={`help-tabpanel-${index}`}
        aria-labelledby={`help-tab-${index}`}
        {...other}
    >
        {value === index && <Box className="tab-panel-content">{children}</Box>}
    </div>)
}

const GradientCard = ({children, color = "primary", ...props}) => {
    return (<Card {...props} className={`gradient-card gradient-card--${color}`}>
        <div className="gradient-card__decoration"/>
        <CardContent className="gradient-card__content">{children}</CardContent>
    </Card>)
}

const FeatureCard = ({icon, title, description, color = "primary"}) => {
    return (<Card className="feature-card">
        <div className={`feature-card__accent feature-card__accent--${color}`}/>
        <CardContent className="feature-card__content">
            <Box className={`feature-card__icon feature-card__icon--${color}`}>{icon}</Box>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {description}
            </Typography>
        </CardContent>
    </Card>)
}

const CodeBlock = ({children}) => (<Paper elevation={4} className="code-block">
    <Box className="code-block__dots">
        <Box className="code-block__dot code-block__dot--red"/>
        <Box className="code-block__dot code-block__dot--yellow"/>
        <Box className="code-block__dot code-block__dot--green"/>
    </Box>
    <Box className="code-block__content">{children}</Box>
</Paper>)

export default function HelpPage() {
    const [value, setValue] = React.useState(0)

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

    return (<ThemeProvider theme={theme}>
        <CssBaseline/>
        <Box className="help-page">
            {/* Hero Section */}
            <Box className="hero-section">
                <div className="hero-section__pattern"/>
                <Container maxWidth="lg" className="hero-section__container">
                    <Box className="hero-section__content">
                        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                            {import.meta.env.VITE_APP_TITLE} Help Center
                        </Typography>
                        <Typography variant="h5" className="hero-section__subtitle">
                            Complete guide for single-cell, spatial transcriptomics and omics data analysis platform
                        </Typography>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="xl" className="main-content-container">
                {/* Main Content */}
                <Paper elevation={0} className="main-content">
                    <Box className="tabs-layout">
                        {/* Left Side - Tabs */}
                        <Box className="tabs-sidebar">
                            <Tabs value={value} onChange={handleChange} orientation="vertical" variant="scrollable"
                                  className="vertical-tabs">
                                <Tab icon={<Code fontSize="small"/>} label="Tech Stack" iconPosition="start"
                                     className="vertical-tab"/>
                                <Tab icon={<Settings fontSize="small"/>} label="Setup & Run" iconPosition="start"
                                     className="vertical-tab"/>
                                <Tab icon={<Storage fontSize="small"/>} label="Data Preparation" iconPosition="start"
                                     className="vertical-tab"/>
                                <Tab icon={<Group fontSize="small"/>} label="How to Use" iconPosition="start"
                                     className="vertical-tab"/>
                            </Tabs>
                        </Box>

                        {/* Right Side - Tab Panels */}
                        <Box className="tab-panels">
                            {/* Tech Stack Section */}
                            <TabPanel value={value} index={0}>
                                <Container maxWidth="lg">
                                    <Box className="section-header">
                                        <Typography variant="h4" component="h2" gutterBottom>
                                            Technology Stack
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" className="section-description">
                                            {import.meta.env.VITE_APP_TITLE} is built with modern technologies to provide a powerful and flexible platform
                                            for single-cell and spatial transcriptomics data analysis.
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={4} className="tech-stack-grid">
                                        <Grid item xs={12} md={6}>
                                            <GradientCard color="primary">
                                                <Box className="tech-stack__header">
                                                    <Language fontSize="medium"/>
                                                    <Typography variant="h5">Frontend</Typography>
                                                </Box>
                                                <Typography variant="body1" className="tech-stack__description">
                                                    Modern React-based frontend with powerful visualization
                                                    capabilities for complex biological data.
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    {[
                                                        {name: "React 18+", desc: "UI Framework"},
                                                        {name: "Material UI", desc: "Component Library"},
                                                         {name: "JSX", desc: "Type Safety"},
                                                         {name: "Vite", desc: "Build Tool"},
                                                        {name: "zustand", desc: "State Management"},
                                                        {name: "Plotly", desc: "Interactive Charts"},
                                                    ].map((tech, i) => (<Grid item xs={6} key={i}>
                                                        <Box className="tech-item">
                                                            <Chip label={tech.name} size="small" className="tech-chip"/>
                                                            <Typography variant="caption" className="tech-description">{tech.desc}</Typography>
                                                        </Box>
                                                    </Grid>))}
                                                </Grid>
                                            </GradientCard>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <GradientCard color="secondary">
                                                <Box className="tech-stack__header">
                                                    <Computer fontSize="medium"/>
                                                    <Typography variant="h5">Backend</Typography>
                                                </Box>
                                                <Typography variant="body1" className="tech-stack__description">
                                                    High-performance Python backend optimized for bioinformatics and
                                                    large-scale data processing.
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    {[{
                                                        name: "FastAPI", desc: "API Framework"
                                                    }, {name: "Python 3.8+", desc: "Language"}, {
                                                        name: "Pandas", desc: "Data Processing"
                                                    }, {
                                                        name: "NumPy", desc: "Numerical Computing"
                                                    }, {
                                                        name: "Seurat", desc: "Single-cell Analysis"
                                                    }, {
                                                        name: "SQLAlchemy", desc: "Database ORM"
                                                    },].map((tech, i) => (<Grid item xs={6} key={i}>
                                                        <Box className="tech-item">
                                                            <Chip label={tech.name} size="small" className="tech-chip"/>
                                                            <Typography variant="caption" className="tech-description">
                                                                {tech.desc}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>))}
                                                </Grid>
                                            </GradientCard>
                                        </Grid>
                                    </Grid>

                                    <Typography variant="h4" className="specialized-tools-title">
                                        Specialized Tools & Libraries
                                    </Typography>

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={4}>
                                            <FeatureCard
                                                icon={<Biotech className="feature-icon"/>}
                                                title="Data Analysis"
                                                description="Powerful libraries for single-cell and spatial transcriptomics analysis, including Seurat, AnnData, and Scipy."
                                                color="info"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FeatureCard
                                                icon={<BarChart className="feature-icon"/>}
                                                title="Visualization"
                                                description="Advanced visualization tools including Matplotlib, Seaborn, and Plotly for interactive data exploration."
                                                color="success"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FeatureCard
                                                icon={<Dns className="feature-icon"/>}
                                                title="Infrastructure"
                                                description="Modern infrastructure with React, Vite and FastAPI for scalable and reliable performance."
                                                color="warning"
                                            />
                                        </Grid>
                                    </Grid>
                                </Container>
                            </TabPanel>

                            {/* Setup Section */}
                            <TabPanel value={value} index={1}>
                                <Container maxWidth="lg">
                                    <Box className="section-header">
                                        <Typography variant="h4" component="h2" gutterBottom>
                                            Environment Setup & Running the Project
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" className="section-description">
                                            Follow these steps to set up your development environment and get
                                            {import.meta.env.VITE_APP_TITLE} running locally.
                                        </Typography>
                                    </Box>

                                    <Alert severity="info" icon={<Info color="info"/>} className="prerequisites-alert">
                                        <AlertTitle className="alert-title">Prerequisites</AlertTitle>
                                        <Typography variant="body2">
                                            Before you begin, ensure you have the following installed on your system:
                                        </Typography>
                                        <Grid container spacing={2} className="prerequisites-grid">
                                            <Grid item xs={12} sm={4}>
                                                <Paper className="prerequisite-item">
                                                    <Typography variant="subtitle2" gutterBottom>Node.js v18+</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Required for the frontend
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Paper className="prerequisite-item">
                                                    <Typography variant="subtitle2" gutterBottom>Python v3.8+</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Required for the backend
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Paper className="prerequisite-item">
                                                    <Typography variant="subtitle2" gutterBottom>Git</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        [Optional] For clone and version control
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </Alert>

                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={6}>
                                            <Card className="setup-card">
                                                <CardContent>
                                                    <Box className="setup-header setup-header--primary">
                                                        <Box className="setup-icon setup-icon--primary">
                                                            <Terminal fontSize="medium"/>
                                                        </Box>
                                                        <Typography variant="h5">Frontend Setup</Typography>
                                                    </Box>
                                                    <CodeBlock>
                                                        <div>
                                                            <span className="comment"># Clone the repository</span>
                                                            <br/>
                                                            git clone
                                                            https://github.com/your-org/braindataportal.git
                                                            <br/>
                                                            cd {import.meta.env.VITE_APP_TITLE}/frontend
                                                            <br/>
                                                            <br/>
                                                            <span className="comment"># Install dependencies</span>
                                                            <br/>
                                                            npm install
                                                            <br/>
                                                            <br/>
                                                            <span
                                                                className="comment"># Set up environment variables</span>
                                                            <br/>
                                                            cp .env.example .env.local
                                                            <br/>
                                                            <br/>
                                                            <span
                                                                className="comment"># Start development server</span>
                                                            <br/>
                                                            npm run dev
                                                        </div>
                                                    </CodeBlock>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card className="setup-card">
                                                <CardContent>
                                                    <Box className="setup-header setup-header--secondary">
                                                        <Box className="setup-icon setup-icon--secondary">
                                                            <Api fontSize="medium"/>
                                                        </Box>
                                                        <Typography variant="h5">Backend Setup</Typography>
                                                    </Box>
                                                    <CodeBlock>
                                                        <div>
                                                            <span
                                                                className="comment"># Navigate to backend directory</span>
                                                            <br/>
                                                            cd ../backend
                                                            <br/>
                                                            <br/>
                                                            <span
                                                                className="comment"># Create virtual environment</span>
                                                            <br/>
                                                            python -m venv venv
                                                            <br/>
                                                            source venv/bin/activate{" "}
                                                            <span className="comment"># On Windows: venv\Scripts\activate</span>
                                                            <br/>
                                                            <br/>
                                                            <span className="comment"># Install dependencies</span>
                                                            <br/>
                                                            pip install -r requirements.txt
                                                            <br/>
                                                            <br/>
                                                            <span className="comment"># Set up database</span>
                                                            <br/>
                                                            alembic upgrade head
                                                            <br/>
                                                            <br/>
                                                            <span className="comment"># Start the server</span>
                                                            <br/>
                                                            uvicorn main:app --reload --host 0.0.0.0 --port 8000
                                                        </div>
                                                    </CodeBlock>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    <Typography variant="h5" className="env-vars-title">
                                        Environment Variables
                                    </Typography>
                                    <Grid container spacing={3} className="env-vars-grid">
                                        <Grid item xs={12} md={6}>
                                            <Card className="env-card env-card--primary">
                                                <CardContent>
                                                    <Typography variant="h6" className="env-title env-title--primary">
                                                        Frontend (.env.local)
                                                    </Typography>
                                                    <Paper className="env-content env-content--primary">
                                                        NEXT_PUBLIC_API_URL=http://localhost:8000
                                                        <br/>
                                                        NEXT_PUBLIC_APP_NAME=BrainDataPortal
                                                        <br/>
                                                        NEXTAUTH_SECRET=your-secret-key
                                                        <br/>
                                                        NEXTAUTH_URL=http://localhost:3000
                                                    </Paper>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card className="env-card env-card--secondary">
                                                <CardContent>
                                                    <Typography variant="h6"
                                                                className="env-title env-title--secondary">
                                                        Backend (.env)
                                                    </Typography>
                                                    <Paper className="env-content env-content--secondary">
                                                        DATABASE_URL=postgresql://user:pass@localhost/bdpdb
                                                        <br/>
                                                        REDIS_URL=redis://localhost:6379
                                                        <br/>
                                                        SECRET_KEY=your-secret-key
                                                        <br/>
                                                        CORS_ORIGINS=http://localhost:3000
                                                    </Paper>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    <Card className="docker-card">
                                        <CardContent>
                                            <Box className="docker-header">
                                                <GitHub fontSize="large" className="docker-icon"/>
                                                <Typography variant="h5">Docker Setup (Alternative)</Typography>
                                            </Box>
                                            <Typography variant="body2" className="docker-description">
                                                For a quicker setup, you can use Docker Compose to run both frontend and backend:
                                            </Typography>
                                            <CodeBlock>
                                                <div>
                                                    <span className="comment"># Run with Docker Compose</span>
                                                    <br/>
                                                    docker-compose up -d
                                                    <br/>
                                                    <br/>
                                                    <span className="comment"># Access the application</span>
                                                    <br/>
                                                    Frontend: http://localhost:3000
                                                    <br/>
                                                    Backend API: http://localhost:8000
                                                    <br/>
                                                    API Docs: http://localhost:8000/docs
                                                </div>
                                            </CodeBlock>
                                        </CardContent>
                                    </Card>
                                </Container>
                            </TabPanel>

                            {/* Data Preparation Section */}
                            <TabPanel value={value} index={2}>
                                <Container maxWidth="lg">
                                    <Box className="section-header">
                                        <Typography variant="h4" component="h2" gutterBottom>
                                            Data Preparation Guide
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" className="section-description">
                                            Learn about supported data formats and how to prepare your datasets for
                                            analysis in {import.meta.env.VITE_APP_TITLE}.
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={4} className="data-formats-grid">
                                        <Grid item xs={12} md={6}>
                                            <GradientCard color="info">
                                                <Box className="data-format__header">
                                                    <DataObject fontSize="medium"/>
                                                    <Typography variant="h5">Single-cell RNA-seq</Typography>
                                                </Box>
                                                <Typography variant="body1" className="data-format__description">
                                                    Supported formats for single-cell RNA sequencing data:
                                                </Typography>
                                                <List className="data-format__list">
                                                    {["H5AD (AnnData format) - Recommended", "CSV/TSV (Gene expression matrix)", "MTX (Matrix Market format)", "H5 (HDF5 format)", "Seurat RDS files",].map((item, i) => (
                                                        <ListItem key={i} className="data-format__item">
                                                            <ListItemIcon className="data-format__icon">
                                                                <CheckCircle fontSize="small" className="check-icon"/>
                                                            </ListItemIcon>
                                                            <ListItemText primary={item}/>
                                                        </ListItem>))}
                                                </List>
                                            </GradientCard>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <GradientCard color="success">
                                                <Box className="data-format__header">
                                                    <Science fontSize="medium"/>
                                                    <Typography variant="h5">Spatial Transcriptomics</Typography>
                                                </Box>
                                                <Typography variant="body1" className="data-format__description">
                                                    Supported formats for spatial transcriptomics data:
                                                </Typography>
                                                <List className="data-format__list">
                                                    {["H5AD with spatial coordinates", "Visium data (10x Genomics)", "MERFISH data", "seqFISH data", "Custom spatial formats",].map((item, i) => (
                                                        <ListItem key={i} className="data-format__item">
                                                            <ListItemIcon className="data-format__icon">
                                                                <CheckCircle fontSize="small" className="check-icon"/>
                                                            </ListItemIcon>
                                                            <ListItemText primary={item}/>
                                                        </ListItem>))}
                                                </List>
                                            </GradientCard>
                                        </Grid>
                                    </Grid>

                                    <Card className="file-structure-card">
                                        <CardContent>
                                            <Typography variant="h5" className="file-structure__title">
                                                Required File Structure
                                            </Typography>
                                            <Paper className="file-structure__content">
                                                <Box className="file-structure__tree">
                                                    <Box className="file-structure__folder">
                                                        <Folder className="folder-icon"/>
                                                        <span>your-dataset/</span>
                                                    </Box>
                                                    <Box className="file-structure__files">
                                                        ├── expression_matrix.h5ad <span className="file-comment"># Main data file</span>
                                                        <br/>
                                                        ├── metadata.csv <span className="file-comment"># Cell/sample metadata</span>
                                                        <br/>
                                                        ├── features.csv <span className="file-comment"># Gene/feature information</span>
                                                        <br/>
                                                        ├── spatial/ <span className="file-comment"># Spatial data (if applicable)</span>
                                                        <br/>│ ├── coordinates.csv
                                                        <br/>│ └── tissue_image.png
                                                        <br/>
                                                        └── config.json <span className="file-comment"># Dataset configuration</span>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </CardContent>
                                    </Card>

                                    <Typography variant="h4" className="data-requirements-title">
                                        Data Requirements
                                    </Typography>

                                    <Alert severity="success" icon={<CheckCircle color="success"/>}
                                           className="requirements-alert">
                                        <AlertTitle className="alert-title">Expression Matrix
                                            Requirements</AlertTitle>
                                        <List dense>
                                            <ListItem>
                                                <ListItemText
                                                    primary="Genes as rows, cells as columns (or vice versa with proper annotation)"/>
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText
                                                    primary="Unique gene identifiers (Ensembl IDs or gene symbols)"/>
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="Unique cell barcodes"/>
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="Raw or normalized counts accepted"/>
                                            </ListItem>
                                        </List>
                                    </Alert>

                                    <Grid container spacing={3} className="format-examples-grid">
                                        <Grid item xs={12} md={6}>
                                            <Card className="format-card">
                                                <CardContent>
                                                    <Typography variant="h6"
                                                                className="format-title format-title--primary">
                                                        Metadata Format (CSV)
                                                    </Typography>
                                                    <Paper className="format-content format-content--primary">
                                                        cell_id,cell_type,condition,batch
                                                        <br/>
                                                        CELL_001,T_cell,control,batch1
                                                        <br/>
                                                        CELL_002,B_cell,treatment,batch1
                                                        <br/>
                                                        CELL_003,NK_cell,control,batch2
                                                    </Paper>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card className="format-card">
                                                <CardContent>
                                                    <Typography variant="h6"
                                                                className="format-title format-title--secondary">
                                                        Features Format (CSV)
                                                    </Typography>
                                                    <Paper className="format-content format-content--secondary">
                                                        gene_id,gene_symbol,gene_type
                                                        <br/>
                                                        ENSG00000000003,TSPAN6,protein_coding
                                                        <br/>
                                                        ENSG00000000005,TNMD,protein_coding
                                                        <br/>
                                                        ENSG00000000419,DPM1,protein_coding
                                                    </Paper>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    <Card className="config-card">
                                        <CardContent>
                                            <Typography variant="h5" className="config-title">
                                                Dataset Configuration
                                            </Typography>
                                            <Paper className="config-content">
                                                {"{"}
                                                <br/>
                                                &nbsp;&nbsp;"name": "My Dataset",
                                                <br/>
                                                &nbsp;&nbsp;"description": "Single-cell RNA-seq of brain tissue",
                                                <br/>
                                                &nbsp;&nbsp;"data_type": "single_cell_rna_seq",
                                                <br/>
                                                &nbsp;&nbsp;"organism": "homo_sapiens",
                                                <br/>
                                                &nbsp;&nbsp;"tissue": "brain",
                                                <br/>
                                                &nbsp;&nbsp;"technology": "10x_genomics",
                                                <br/>
                                                &nbsp;&nbsp;"has_spatial": false,
                                                <br/>
                                                &nbsp;&nbsp;"preprocessing": {"{"}
                                                <br/>
                                                &nbsp;&nbsp;&nbsp;&nbsp;"normalized": true,
                                                <br/>
                                                &nbsp;&nbsp;&nbsp;&nbsp;"log_transformed": false
                                                <br/>
                                                &nbsp;&nbsp;{"}"}
                                                <br/>
                                                {"}"}
                                            </Paper>
                                        </CardContent>
                                    </Card>
                                </Container>
                            </TabPanel>

                            {/* Usage Section */}
                            <TabPanel value={value} index={3}>
                                <Container maxWidth="lg">
                                    <Box className="section-header">
                                        <Typography variant="h3" component="h2" gutterBottom>
                                            How to Use the Application
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary"
                                                    className="section-description">
                                            Complete guide to using {import.meta.env.VITE_APP_TITLE} for data analysis and
                                            visualization of single-cell and
                                            spatial transcriptomics data.
                                        </Typography>
                                    </Box>

                                    <Typography variant="h4" className="getting-started-title">
                                        Getting Started
                                    </Typography>

                                    <Grid container spacing={3} className="getting-started-grid">
                                        <Grid item xs={12} md={6}>
                                            <Card className="getting-started-card getting-started-card--primary">
                                                <CardContent className="getting-started-content">
                                                    <Box
                                                        className="getting-started-icon getting-started-icon--primary">
                                                        <CloudUpload className="upload-icon"/>
                                                    </Box>
                                                    <Typography variant="h5" align="center" gutterBottom>
                                                        1. Upload Your Data
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        align="center"
                                                        className="getting-started-description"
                                                    >
                                                        Navigate to the "Upload" section and select your prepared
                                                        dataset files.
                                                    </Typography>
                                                    <Box className="getting-started-features">
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="div"
                                                            className="feature-item"
                                                        >
                                                            <CheckCircle className="feature-check"/>
                                                            Drag and drop files or use the file browser
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="div"
                                                            className="feature-item"
                                                        >
                                                            <CheckCircle className="feature-check"/>
                                                            Validate data format automatically
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="div"
                                                            className="feature-item"
                                                        >
                                                            <CheckCircle className="feature-check"/>
                                                            Preview data before processing
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card className="getting-started-card getting-started-card--secondary">
                                                <CardContent className="getting-started-content">
                                                    <Box
                                                        className="getting-started-icon getting-started-icon--secondary">
                                                        <Analytics className="analytics-icon"/>
                                                    </Box>
                                                    <Typography variant="h5" align="center" gutterBottom>
                                                        2. Data Processing
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        align="center"
                                                        className="getting-started-description"
                                                    >
                                                        Configure preprocessing parameters and run quality control.
                                                    </Typography>
                                                    <Box className="getting-started-features">
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="div"
                                                            className="feature-item"
                                                        >
                                                            <CheckCircle className="feature-check"/>
                                                            Set filtering thresholds
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="div"
                                                            className="feature-item"
                                                        >
                                                            <CheckCircle className="feature-check"/>
                                                            Choose normalization methods
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="div"
                                                            className="feature-item"
                                                        >
                                                            <CheckCircle className="feature-check"/>
                                                            Run dimensionality reduction
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    <Typography variant="h4" className="main-features-title">
                                        Main Features
                                    </Typography>

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <FeatureCard
                                                icon={<Visibility className="feature-icon"/>}
                                                title="Data Exploration"
                                                description="Interactive visualizations including UMAP, t-SNE, violin plots, and heatmaps. Filter and subset data based on various criteria."
                                                color="primary"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FeatureCard
                                                icon={<Timeline className="feature-icon"/>}
                                                title="Differential Expression Analysis"
                                                description="Compare gene expression between different conditions, cell types, or clusters. Statistical testing with multiple correction methods."
                                                color="secondary"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FeatureCard
                                                icon={<Layers className="feature-icon"/>}
                                                title="Pathway Analysis"
                                                description="Gene set enrichment analysis (GSEA) and pathway visualization. Integration with GO, KEGG, and Reactome databases."
                                                color="info"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FeatureCard
                                                icon={<Memory className="feature-icon"/>}
                                                title="Spatial Analysis"
                                                description="Spatial gene expression patterns, neighborhood analysis, and tissue architecture visualization for spatial transcriptomics data."
                                                color="success"
                                            />
                                        </Grid>
                                    </Grid>

                                    <Card className="workflow-card">
                                        <div className="workflow-pattern"/>
                                        <CardContent className="workflow-content">
                                            <Typography variant="h5" gutterBottom>
                                                Typical Analysis Workflow
                                            </Typography>
                                            <Box className="workflow-steps">
                                                {[{
                                                    step: "1",
                                                    title: "Data Upload & Validation",
                                                    desc: "Upload your dataset and verify data integrity",
                                                }, {
                                                    step: "2",
                                                    title: "Quality Control",
                                                    desc: "Filter low-quality cells and genes, detect doublets",
                                                }, {
                                                    step: "3",
                                                    title: "Normalization & Scaling",
                                                    desc: "Apply normalization and scaling methods",
                                                }, {
                                                    step: "4",
                                                    title: "Dimensionality Reduction",
                                                    desc: "PCA, UMAP, t-SNE for visualization and clustering",
                                                }, {
                                                    step: "5",
                                                    title: "Analysis & Visualization",
                                                    desc: "Clustering, differential expression, pathway analysis",
                                                },].map((item, i) => (<Box key={i} className="workflow-step">
                                                    <Box className="workflow-step__number">{item.step}</Box>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="body2"
                                                                    className="workflow-step__description">
                                                            {item.desc}
                                                        </Typography>
                                                    </Box>
                                                </Box>))}
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    <Alert severity="info" icon={<Info color="info"/>} className="pro-tips-alert">
                                        <AlertTitle className="alert-title">Pro Tips</AlertTitle>
                                        <Grid container spacing={2} className="pro-tips-grid">
                                            <Grid item xs={12} sm={6}>
                                                <Paper className="pro-tip-item">
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Save Analysis Sessions
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Save your work to resume later
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Paper className="pro-tip-item">
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Export Results
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Download in CSV, PDF, or PNG formats
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Paper className="pro-tip-item">
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        API Access
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Use the API for programmatic data access
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Paper className="pro-tip-item">
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Advanced Features
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Check documentation for advanced capabilities
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </Alert>
                                </Container>
                            </TabPanel>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    </ThemeProvider>)
}
