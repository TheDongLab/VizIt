"use client"

import {useEffect, useRef, useState} from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    AlertTitle,
    Box,
    Container,
    CircularProgress,
    FormHelperText,
    Paper,
    Tabs,
    Tab,
    LinearProgress,
    Snackbar,
} from "@mui/material"
import {
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    FolderOpen as FolderIcon,
    Terminal as TerminalIcon,
    Info as InfoIcon,
} from "@mui/icons-material"
import useDatasetManageStore from "../../store/DatasetManageStore.js"

export default function DatasetManagePage() {
    const outputEndRef = useRef(null)
    const [activeTab, setActiveTab] = useState(0)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState("")
    const [snackbarSeverity, setSnackbarSeverity] = useState("success")

    // Get state and actions from Zustand store
    const {seuratObjects, selectedSeurat,setSelectedSeurat,
        datasetName, setDatasetName, checkDatasetName,
        isNameUnique,isCheckingName,
        isLoading, isProcessing,
        error, success,
        processingStatus, processDataset, resetState,
        fetchSeuratObjects,
    } = useDatasetManageStore()

    // Fetch available Seurat objects on component mount
    useEffect(() => {
        fetchSeuratObjects()

        // Cleanup on unmount
        return () => {
            resetState()
        }
    }, [fetchSeuratObjects, resetState])

    // Check if dataset name is unique when it changes
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (datasetName) {
                checkDatasetName(datasetName)
            }
        }, 500)

        return () => clearTimeout(debounceTimer)
    }, [datasetName, checkDatasetName])

    // Scroll to bottom of output when new messages arrive
    useEffect(() => {
        if (outputEndRef.current) {
            outputEndRef.current.scrollIntoView({behavior: "smooth"})
        }
    }, [processingStatus.outputs])

    // Show snackbar when error or success changes
    useEffect(() => {
        if (error) {
            showSnackbar(error, "error")
        }
    }, [error])

    useEffect(() => {
        if (success) {
            showSnackbar(success, "success")
        }
    }, [success, processingStatus.result])

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message)
        setSnackbarSeverity(severity)
        setSnackbarOpen(true)
    }

    const handleSnackbarClose = () => {
        setSnackbarOpen(false)
    }

    const handleTabChange = (_event, newValue) => {
        setActiveTab(newValue)
    }

    const getMessageColor = (type) => {
        switch (type) {
            case "error":
                return "error.main"
            case "warning":
                return "warning.main"
            case "success":
                return "success.main"
            default:
                return "text.primary"
        }
    }

    // Switch to output tab when processing starts
    useEffect(() => {
        if (isProcessing) {
            setActiveTab(1)
        }
    }, [isProcessing])

    return (
        <Container maxWidth="md" sx={{pb:8, pt:2}}>
            <Typography variant="h4" gutterBottom>Dataset Management</Typography>

            <Card elevation={3}>
                <CardHeader title="Process Seurat Object"
                            subheader="Select a Seurat object from the backend and assign a unique name to create a new dataset"
                />
                <CardContent sx={{pb: 1}}>
                    <Box sx={{display: "flex", flexDirection: "column", gap: 3}}>
                        {error && (<Alert severity="error" icon={<ErrorIcon/>}><AlertTitle>Error</AlertTitle>{error}</Alert>)}
                        {success && (<Alert severity="success" icon={<CheckCircleIcon/>}><AlertTitle>Success</AlertTitle>{success}</Alert>)}

                        <FormControl fullWidth disabled={isLoading || isProcessing}>
                            <InputLabel id="seurat-select-label">Select Seurat Object</InputLabel>
                            <Select
                                labelId="seurat-select-label"
                                id="seurat-select"
                                value={selectedSeurat}
                                label="Select Seurat Object"
                                onChange={(e) => setSelectedSeurat(e.target.value)}
                                startAdornment={isLoading ? <CircularProgress size={20} sx={{mr: 1}}/> : null}
                            >
                                {isLoading ? (
                                    <MenuItem disabled>
                                        <Box sx={{display: "flex", alignItems: "center"}}>
                                            <CircularProgress size={20} sx={{mr: 1}}/>
                                            Loading...
                                        </Box>
                                    </MenuItem>
                                ) : seuratObjects.length === 0 ? (
                                    <MenuItem disabled>No Seurat objects available</MenuItem>
                                ) : (
                                    seuratObjects.map((obj) => (
                                        <MenuItem key={obj.id} value={obj.path}>
                                            <Box sx={{display: "flex", alignItems: "center"}}>
                                                <FolderIcon fontSize="small" sx={{mr: 1}}/>
                                                <span>{obj.name}</span>
                                                <Typography variant="caption" color="text.secondary" sx={{ml: 1}}>
                                                    ({obj.size})
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth error={isNameUnique === false}>
                            <TextField
                                id="dataset-name"
                                label="Dataset Name"
                                placeholder="Enter a unique dataset name"
                                value={datasetName}
                                onChange={(e) => setDatasetName(e.target.value)}
                                disabled={isProcessing}
                                error={isNameUnique === false}
                                InputProps={{
                                    endAdornment: isCheckingName ? (
                                        <CircularProgress size={20}/>
                                    ) : isNameUnique === true ? (
                                        <CheckCircleIcon color="success"/>
                                    ) : isNameUnique === false ? (
                                        <ErrorIcon color="error"/>
                                    ) : null,
                                }}
                            />
                            <FormHelperText>
                                {isNameUnique === false
                                    ? "This name is already in use"
                                    : "The dataset name must be unique and will be used to identify this dataset in the system"}
                            </FormHelperText>
                        </FormControl>
                    </Box>
                </CardContent>
                <CardActions sx={{p: 3, pt: 0}}>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={processDataset}
                        disabled={isProcessing || isLoading || !selectedSeurat || !datasetName || isNameUnique === false}
                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit"/> : null}
                    >
                        {isProcessing ? "Processing..." : "Process Dataset"}
                    </Button>
                </CardActions>
            </Card>

            {/* Processing Output Section */}
            <Card elevation={3} sx={{mt: 4}}>
                <Box sx={{borderBottom: 1, borderColor: "divider"}}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="processing tabs">
                        <Tab icon={<InfoIcon/>} iconPosition="start" label="Information"/>
                        <Tab
                            icon={<TerminalIcon/>}
                            iconPosition="start"
                            label="Output"
                            disabled={processingStatus.status === "idle" && processingStatus.outputs.length === 0}
                        />
                    </Tabs>
                </Box>

                <CardContent>
                    {activeTab === 0 ? (
                        <Box sx={{p: 2}}>
                            <Typography variant="h6" gutterBottom>
                                Dataset Processing Information
                            </Typography>
                            <Typography paragraph>
                                This page allows you to process Seurat objects into datasets that can be analyzed in the
                                portal. The
                                processing may take several minutes depending on the size of the Seurat object.
                            </Typography>
                            <Typography paragraph>
                                <strong>Steps:</strong>
                            </Typography>
                            <ol>
                                <Typography component="li">Select a Seurat object from the dropdown</Typography>
                                <Typography component="li">Enter a unique name for your dataset</Typography>
                                <Typography component="li">Click &#34;Process Dataset&#34; to start processing</Typography>
                                <Typography component="li">View real-time processing output in the Output
                                    tab</Typography>
                                <Typography component="li">
                                    Once processing is complete, you&#39;ll be redirected to the dataset view
                                </Typography>
                            </ol>
                        </Box>
                    ) : (
                        <Box sx={{p: 0}}>
                            {processingStatus.status !== "idle" && (
                                <Box sx={{width: "100%", mb: 2}}>
                                    <Box sx={{display: "flex", alignItems: "center", mb: 1}}>
                                        <Typography variant="body2" sx={{mr: 1}}>
                                            {processingStatus.status === "processing"
                                                ? "Processing:"
                                                : processingStatus.status === "completed"
                                                    ? "Completed:"
                                                    : "Failed:"}
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {processingStatus.currentStep}
                                        </Typography>
                                        <Box sx={{flexGrow: 1}}/>
                                        <Typography variant="body2">{processingStatus.progress}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={processingStatus.progress}
                                        color={
                                            processingStatus.status === "completed"
                                                ? "success"
                                                : processingStatus.status === "failed"
                                                    ? "error"
                                                    : "primary"
                                        }
                                    />
                                </Box>
                            )}

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                    bgcolor: "grey.900",
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                    color: "common.white",
                                }}
                            >
                                {processingStatus.outputs.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary"
                                                sx={{fontStyle: "italic", color: "grey.500"}}>
                                        No output available. Start processing to see output here.
                                    </Typography>
                                ) : (
                                    processingStatus.outputs.map((output) => (
                                        <Box key={output.id} sx={{mb: 1}}>
                                            <Typography component="span" variant="body2"
                                                        sx={{color: "grey.500", mr: 1}}>
                                                [{new Date(output.timestamp).toLocaleTimeString()}]
                                            </Typography>
                                            <Typography component="span" variant="body2"
                                                        sx={{color: getMessageColor(output.type)}}>
                                                {output.message}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                                <div ref={outputEndRef}/>
                            </Paper>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{vertical: "bottom", horizontal: "center"}}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{width: "100%"}}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    )
}