import {useEffect, useRef, useState} from "react";
import {
    Button,
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    LinearProgress,
    FormControlLabel,
    Checkbox
} from "@mui/material";
import useDatasetManageStore from "../../store/DatasetManageStore.js";

const MetaPrepareProcess = () => {
    const {
        datasetName,
        processingStatus,
        fetchProcessingStatus,
        resetProcessingState
    } = useDatasetManageStore();

    const logContainerRef = useRef(null);
    const [scrollLocked, setScrollLocked] = useState(false);
    const processingStatusRef = useRef(processingStatus);

    useEffect(() => {
        processingStatusRef.current = processingStatus;
    }, [processingStatus]);


    // Polling log status
    useEffect(() => {
        resetProcessingState();
        const interval = setInterval(() => {
            fetchProcessingStatus(datasetName,"prepare_metadata");
            const currentStatus = processingStatusRef.current;
            if (currentStatus.log && /Done!/.test(currentStatus.log)) {
                clearInterval(interval);
            }
            if (currentStatus.status === "completed" || currentStatus.status === "failed") {
                clearInterval(interval);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [datasetName]);

    // Auto-scroll only if not locked
    useEffect(() => {
        if (!scrollLocked && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [processingStatus.log, scrollLocked]);

    const getMessageColor = (type) => {
        switch (type) {
            case "failed":
                return "error.main";
            case "processing":
                return "text.primary";
            case "completed":
                return "success.main";
            default:
                return "text.primary";
        }
    };

    return (
        <Box sx={{pb: 4, pt: 0}}>
            <Typography variant="h5" gutterBottom>Running prepare metadata pipeline</Typography>
            <Card elevation={2} sx={{mt: 2}}>
                <CardContent>
                    <Box sx={{p: 0}}>
                        {processingStatus.status !== "idle" && (
                            <Box sx={{width: "100%", mb: 2}}>
                                <Box sx={{display: "flex", alignItems: "center", mb: 1}}>
                                    <Typography variant="h6"
                                                sx={{mr: 1, color: getMessageColor(processingStatus.status)}}>
                                        {processingStatus.status === "processing" ? "Processing:"
                                            : processingStatus.status === "completed" ? "Completed:" : "Failed:"}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant={processingStatus.status === "processing" ? "indeterminate" : "determinate"}
                                    value={processingStatus.status === "processing" ? 0 : 100}
                                    color={processingStatus.status === "completed" ? "success"
                                        : processingStatus.status === "failed" ? "error" : "primary"}
                                />
                            </Box>
                        )}

                        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1}}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={scrollLocked}
                                        onChange={(e) => setScrollLocked(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Lock scroll"
                            />
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    if (logContainerRef.current) {
                                        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                                    }
                                }}
                                disabled={!scrollLocked}
                                size="small"
                            >
                                Scroll to Bottom
                            </Button>
                        </Box>


                        <Paper
                            ref={logContainerRef}
                            variant="outlined"
                            sx={{
                                p: 1,
                                height: "600px",
                                overflowY: "auto",
                                bgcolor: "grey.900",
                                fontFamily: "monospace",
                                fontSize: "1.2rem",
                                color: "common.white",
                                whiteSpace: "pre-wrap",
                            }}>
                            <Box sx={{mb: 1}}>
                                <Typography component="span" variant="body1">
                                    {processingStatus.log || "Waiting for logs..."}
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default MetaPrepareProcess;
