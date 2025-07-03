import {useState, useRef, useEffect} from 'react';
import {useSearchParams} from "react-router-dom";

import {Box, Stepper, Step, StepLabel, Button, Paper, Typography, Divider,} from '@mui/material';

import ExtractInfo from './ExtractInfo';
import ExtractInfoProcess from "./ExtractInfoProcess.jsx";

import MetaPrepare from './MetaPrepare';

import useDatasetManageStore from "../../store/DatasetManageStore.js";
import MetaPrepareProcess from "./MetaPrepareProcess.jsx";

const steps = ['Setup dataset', 'Extracting data', 'Prepare metadata', 'Running pipeline'];

const DatasetManage = () => {
    const {setDatasetName, extractData, isProcessing} = useDatasetManageStore();
    const {prepareMetaData,refreshDatabase} = useDatasetManageStore();

    // Get all the pre-selected values
    const [queryParams, setQueryParams] = useSearchParams();
    let dataset = queryParams.get("dataset") ?? "";
    let stepidx = parseInt(queryParams.get("stepidx") ?? 0);

    useEffect(() => {
        if (dataset === "") {
            stepidx = 0;
        } else {
            setDatasetName(dataset);
        }
        if (stepidx >= steps.length) {
            stepidx = steps.length - 1;
        }
        if (stepidx < 0) {
            stepidx = 0;
        }
        const newParams = new URLSearchParams();
        newParams.set("dataset", dataset)
        newParams.set("stepidx", activeStep)
        setQueryParams(newParams);

    }, []);


    const [activeStep, setActiveStep] = useState(stepidx);
    const extractInfoRef = useRef();
    const [datasetMetaData, setDatasetMetaData] = useState(null);

    const handleNext = async () => {
        if (activeStep === 0) {
            // Validate and collect form data from ExtractInfo step
            if (extractInfoRef.current && extractInfoRef.current.validateFields()) {
                const payload = extractInfoRef.current.collectData();
                try {
                    const response = extractData(payload);
                    setActiveStep((prev) => prev + 1);
                } catch (error) {
                    console.error('Submission failed:', error);
                    alert('Failed to submit dataset info.');
                }
            } else {
                alert('Please fill all required fields.');
            }
        } else if (activeStep === 1) {
            setActiveStep((prev) => prev + 1);
        } else if (activeStep === 2) {
            try {
                const response = prepareMetaData(datasetMetaData);
                setActiveStep((prev) => prev + 1);
            } catch (error) {
                console.error('Submission failed:', error);
                alert('Failed to submit dataset info.');
            }
        } else {
            setActiveStep((prev) => prev + 1);
        }

        const newParams = new URLSearchParams();
        newParams.set("dataset", dataset)
        newParams.set("stepidx", activeStep + 1)
        setQueryParams(newParams);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        const newParams = new URLSearchParams();
        newParams.set("dataset", dataset)
        newParams.set("stepidx", activeStep - 1)
        setQueryParams(newParams);
    };
    const handleImportDataInfo = () => {
        try {
            const response = refreshDatabase();
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to submit dataset info.');
        }
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return <ExtractInfo ref={extractInfoRef}/>;
            case 1:
                return <ExtractInfoProcess/>;
            case 2:
                return <MetaPrepare onMetaDataChange={setDatasetMetaData}/>;
            case 3:
                return <MetaPrepareProcess/>;
            default:
                return 'Unknown step';
        }
    };

    return (
        <div className="dataset-manage-container" style={{display: 'flex', flexDirection: 'column', flex: 1}}>
            {/* Title Row */}
            <Box className="title-row"><Typography variant="h6">Dataset Management</Typography></Box>
            <Divider/>
            <Box sx={{display: 'flex', pb: 2, pl: 4, mb: 4}}>
                {/* Sidebar */}
                <Box sx={{width: '15%', minWidth: '200px', maxWidth: '400px', py: 2, pl: 2}}>
                    <Stepper activeStep={activeStep} orientation="vertical">
                        {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
                    </Stepper>
                    {/* Import Button */}
                    <Box sx={{mt: 4}}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleImportDataInfo}
                        >
                            Refresh DB
                        </Button>
                    </Box>
                </Box>


                {/* Main Content */}
                <Paper sx={{flex: 1, p: 4}}>
                    {getStepContent(activeStep)}
                    <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 2}}>
                        <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
                        <Button variant="contained" onClick={handleNext}
                                disabled={activeStep >= steps.length || isProcessing}>
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </div>
    );
};

export default DatasetManage;
