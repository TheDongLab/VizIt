import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Radio,
    RadioGroup,
    FormControlLabel,
    Paper,
    Alert,
    AlertTitle,
    Link,
    Divider,
} from "@mui/material";
import PropTypes from "prop-types";

import RemoteUrlForm from "./RemoteUrlForm.jsx";
import useServerConfigStore from "../../store/ServerConfigStore.js";

const REFRESH_DB_COMMAND = "python -m backend.db_utils.refresh_db";

const LOCAL = "local";
const SERVER = "server";

const CodeBlock = ({ children }) => (
    <Box
        component="pre"
        sx={{
            m: 0,
            mt: 1,
            p: 1.5,
            bgcolor: "grey.100",
            borderRadius: 1,
            fontSize: "0.85rem",
            overflowX: "auto",
        }}
    >
        {children}
    </Box>
);

CodeBlock.propTypes = { children: PropTypes.node };

const InlineCode = ({ children }) => (
    <Box
        component="code"
        sx={{
            px: 0.6,
            py: 0.2,
            mx: 0.25,
            bgcolor: "grey.100",
            border: 1,
            borderColor: "divider",
            borderRadius: 0.75,
            fontFamily: "monospace",
            fontSize: "0.85em",
            whiteSpace: "nowrap",
        }}
    >
        {children}
    </Box>
);

InlineCode.propTypes = { children: PropTypes.node };

const AddDatasetDialog = ({ open, onClose }) => {
    const { allowRemoteDatasets } = useServerConfigStore();
    const remoteEnabled = allowRemoteDatasets !== false;

    const [activeStep, setActiveStep] = useState(0);
    const [choice, setChoice] = useState(remoteEnabled ? LOCAL : SERVER);
    const [busy, setBusy] = useState(false);
    const remoteFormRef = useRef();

    useEffect(() => {
        if (!remoteEnabled) setChoice(SERVER);
    }, [remoteEnabled]);

    const steps =
        choice === SERVER
            ? ["Preprocess dataset", "Add dataset", "Refresh database"]
            : ["Preprocess dataset", "Add dataset"];

    const handleClose = () => {
        setActiveStep(0);
        setChoice(remoteEnabled ? LOCAL : SERVER);
        setBusy(false);
        onClose();
    };

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Process your raw data into the VizIt dataset layout
                            using the provided{" "}
                            <Link
                                href="https://thedonglab.github.io/VizIt/prepare_dataset/"
                                underline="hover"
                                target="_blank"
                                rel="noopener"
                            >
                                scripts
                            </Link>{" "}
                            (customizable per dataset).
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            When the pipeline finishes you will have a dataset
                            folder containing <InlineCode>dataset_info.toml</InlineCode> and
                            the data files the views read (
                            <InlineCode>celltypes/</InlineCode>,{" "}
                            <InlineCode>bigwig/</InlineCode>,{" "}
                            <InlineCode>gene_jsons/</InlineCode>, …). Continue
                            once that folder is ready.
                        </Typography>
                    </>
                );
            case 1:
                return (
                    <>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Choose how the dataset should be added.
                        </Typography>
                        <RadioGroup
                            value={choice}
                            onChange={(e) => setChoice(e.target.value)}
                        >
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <FormControlLabel
                                    value={LOCAL}
                                    control={<Radio />}
                                    disabled={!remoteEnabled}
                                    label={
                                        <Box>
                                            <Typography variant="subtitle2">
                                                Load from URL
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                The dataset is hosted on an HTTP
                                                server and registered in your
                                                browser only. Nothing is
                                                uploaded and no shell access to
                                                this server is needed.
                                            </Typography>
                                        </Box>
                                    }
                                />
                                {!remoteEnabled && (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        Loading datasets from a URL is disabled
                                        on this server.
                                    </Alert>
                                )}
                                {choice === LOCAL && remoteEnabled && (
                                    <Box sx={{ mt: 2 }}>
                                        <Divider sx={{ mb: 2 }} />
                                        <Alert
                                            severity="info"
                                            sx={{ mb: 2 }}
                                            component="div"
                                        >
                                            <AlertTitle sx={{ fontSize: "0.875rem" }}>
                                                Requirements for the hosting
                                                server
                                            </AlertTitle>
                                            <Box
                                                component="ul"
                                                sx={{ m: 0, pl: 2.5 }}
                                            >
                                                <li>
                                                    It must support HTTP range
                                                    requests (nginx, Apache,
                                                    Caddy, S3, …). Python&apos;s{" "}
                                                    <InlineCode>
                                                        http.server
                                                    </InlineCode>{" "}
                                                    will not work since it ignores
                                                    Range headers.
                                                </li>
                                                <li>
                                                    The URL must be reachable
                                                    from machine running VizIt.
                                                </li>
                                                <li>
                                                    Private or loopback
                                                    addresses are rejected
                                                    unless{" "}
                                                    <InlineCode>
                                                        REMOTE_DATASET_ALLOW_PRIVATE=true
                                                    </InlineCode>{" "}
                                                    is set in{" "}
                                                    <InlineCode>
                                                        backend/.env
                                                    </InlineCode>
                                                    .
                                                </li>
                                            </Box>
                                        </Alert>
                                        <RemoteUrlForm
                                            ref={remoteFormRef}
                                            disabled={busy}
                                            onBusyChange={setBusy}
                                        />
                                    </Box>
                                )}
                            </Paper>

                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <FormControlLabel
                                    value={SERVER}
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="subtitle2">
                                                Add on the server
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                For server administrators: copy
                                                the dataset into the backend so
                                                it is listed for everyone. Needs
                                                shell access to the server.
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>
                        </RadioGroup>
                    </>
                );
            case 2:
                return (
                    <>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            On the server, place the dataset and then refresh
                            the metadata database:
                        </Typography>
                        <Typography variant="body2" component="div">
                            1. Copy the dataset folder to{" "}
                            <InlineCode>
                                backend/datasets/&lt;dataset_name&gt;/
                            </InlineCode>
                            , with its{" "}
                            <InlineCode>dataset_info.toml</InlineCode> inside.
                            <br />
                            2. Copy the sample sheet (if the dataset has one) to{" "}
                            <InlineCode>backend/SampleSheets/</InlineCode>.
                            <br />
                            3. Run this from the repository root:
                        </Typography>
                        <CodeBlock>{REFRESH_DB_COMMAND}</CodeBlock>
                        <Typography
                            variant="body2"
                            sx={{ mt: 1 }}
                        >
                            4. Reload this page. The dataset should be listed for
                            all users.
                        </Typography>
                    </>
                );
            default:
                return null;
        }
    };

    const renderPrimaryAction = () => {
        if (activeStep === 0) {
            return (
                <Button variant="contained" onClick={handleNext}>
                    Next
                </Button>
            );
        }
        if (activeStep === 1) {
            if (choice === SERVER) {
                return (
                    <Button variant="contained" onClick={handleNext}>
                        Next
                    </Button>
                );
            }
            return (
                <Button
                    variant="contained"
                    onClick={() => remoteFormRef.current?.submit()}
                    disabled={busy}
                >
                    {busy ? "Checking…" : "Detect & Add"}
                </Button>
            );
        }
        return (
            <Button variant="contained" onClick={handleClose}>
                Finish
            </Button>
        );
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Add dataset</DialogTitle>
            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                {getStepContent(activeStep)}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
                <Box sx={{ flex: 1 }} />
                <Button
                    disabled={activeStep === 0 || busy}
                    onClick={handleBack}
                >
                    Back
                </Button>
                {renderPrimaryAction()}
            </DialogActions>
        </Dialog>
    );
};

AddDatasetDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default AddDatasetDialog;
