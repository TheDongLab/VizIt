import {useState, forwardRef, useImperativeHandle, useEffect} from 'react';
import {
    Grid,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Typography,
    Divider, CircularProgress, FormHelperText
} from '@mui/material';
import useDatasetManageStore from "../../store/DatasetManageStore.js";
import {CheckCircle as CheckCircleIcon, Error as ErrorIcon} from "@mui/icons-material";

const requiredFields = {
    dataset: ['dataset_name', 'PI_full_name', 'PI_email', 'first_contributor', 'first_contributor_email', 'brain_super_region', 'brain_region', 'n_samples', 'assay'],
    study: ['study_name', 'team_name', 'lab_name'],
    protocol: ['protocol_id', 'protocol_name'],
};

const emailFields = ['PI_email', 'first_contributor_email', 'submitter_email'];
const numericFields = ['n_samples'];

const ExtractInfo = forwardRef((props, ref) => {
    const {
        seuratObjects,
        selectedSeurat,
        setSelectedSeurat,
        fetchSeuratObjects,
        setDatasetName
    } = useDatasetManageStore()
    const {checkDatasetName, isNameUnique, isCheckingName} = useDatasetManageStore();
    const [dataType, setDataType] = useState('');


    useEffect(() => {
        fetchSeuratObjects();
    }, []);

    const [datasetInfo, setDatasetInfo] = useState({
        dataset_name: '',
        assay: '',
        description: '',
        PI_full_name: '',
        PI_email: '',
        first_contributor: '',
        first_contributor_email: '',
        brain_super_region: '',
        brain_region: '',
        n_samples: '',
        other_contributors: '',
        support_grants: '',
        other_funding_source: '',
        publication_DOI: '',
        publication_PMID: '',
        sample_info: '',
    });

    const [studyInfo, setStudyInfo] = useState({
        study_name: '',
        description: '',
        team_name: '',
        lab_name: '',
        submitter_name: '',
        submitter_email: ''
    });

    const [protocolInfo, setProtocolInfo] = useState({
        protocol_id: '',
        protocol_name: '',
        version: '',
        github_url: '',
        sample_collection_summary: '',
        cell_extraction_summary: '',
        lib_prep_summary: '',
        data_processing_summary: '',

        protocols_io_DOI: '',
        other_reference: ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (section, setter) => (key) => (e) => {
        setter(prev => ({...prev, [key]: e.target.value}));
        setErrors(prev => ({...prev, [`${section}.${key}`]: false}));
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    useImperativeHandle(ref, () => ({
        validateFields: () => {
            const newErrors = {};

            const validateSection = (sectionName, data, required) => {
                required.forEach(key => {
                    if (!data[key] || data[key].trim() === '') {
                        newErrors[`${sectionName}.${key}`] = 'Required';
                    }
                });
            };

            validateSection('dataset', datasetInfo, requiredFields.dataset);
            validateSection('study', studyInfo, requiredFields.study);
            validateSection('protocol', protocolInfo, requiredFields.protocol);

            // Validate seurat (selectedSeurat) and datatype
            if (!selectedSeurat) {
                newErrors['seurat.seurat'] = 'Required';
            }
            if (!dataType) {
                newErrors['seurat.datatype'] = 'Required';
            }

            // Email validation
            emailFields.forEach((key) => {
                const value =
                    datasetInfo[key] ||
                    studyInfo[key] ||
                    protocolInfo[key] ||
                    '';
                if (value && !validateEmail(value)) {
                    const section = datasetInfo[key] ? 'dataset' : studyInfo[key] ? 'study' : 'protocol';
                    newErrors[`${section}.${key}`] = 'Invalid email';
                }
            });

            // Numeric validation
            numericFields.forEach((key) => {
                const value = datasetInfo[key];
                if (value !== '' && isNaN(Number(value))) {
                    newErrors[`dataset.${key}`] = 'Must be a number';
                }
            });

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        },

        collectData: () => ({
            seurat_info: {seurat: selectedSeurat, datatype: dataType},
            dataset_info: {
                ...datasetInfo,
                n_samples: datasetInfo.n_samples ? Number(datasetInfo.n_samples) : null,
            },
            study_info: studyInfo,
            protocol_info: protocolInfo
        })
    }));

    const renderFields = (section, data, setter) => (
        <Grid container spacing={2}>
            {Object.entries(data).map(([key, value]) => {
                const errorKey = `${section}.${key}`;
                const isMultiline = ['description', 'sample_info', 'sample_collection_summary', 'cell_extraction_summary', 'lib_prep_summary', 'data_processing_summary'].includes(key);
                const isFullWidth = isMultiline || ['other_contributors', 'other_reference'].includes(key);

                if (key === 'assay') {
                    return (
                        <Grid item xs={12} md={6} key={key}>
                            <FormControl fullWidth size="small" error={!!errors[errorKey]}>
                                <InputLabel id={`${key}-label`}>Assay *</InputLabel>
                                <Select
                                    labelId={`${key}-label`}
                                    value={value}
                                    label="Assay"
                                    required={requiredFields[section].includes(key)}
                                    onChange={handleChange(section, setter)(key)}
                                >
                                    <MenuItem value="scRNAseq">scRNAseq</MenuItem>
                                    <MenuItem value="VisiumST">VisiumST</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    );
                }
                if (key === 'dataset_name') {
                    return (
                        <Grid item xs={12} md={6} key={key}>
                            <FormControl fullWidth error={isNameUnique === false || !!errors[errorKey]}>
                                <TextField
                                    id="dataset-name"
                                    label="Dataset Name"
                                    required={requiredFields[section].includes(key)}
                                    placeholder="Enter a unique dataset name"
                                    value={value}
                                    size="small"
                                    onChange={handleChange(section, setter)(key)}
                                    onBlur={() => {
                                        setDatasetName(value);
                                        checkDatasetName(value);
                                    }}
                                    error={isNameUnique === false || !!errors[errorKey]}
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
                        </Grid>
                    );
                }
                if (key === 'brain_super_region') {
                    return (
                        <Grid item xs={12} md={6} key={key}>
                            <FormControl fullWidth size="small" error={!!errors[errorKey]}>
                                <InputLabel id={`${key}-label`}>Brain Super Region *</InputLabel>
                                <Select
                                    labelId={`${key}-label`}
                                    value={value}
                                    label="Brain Super Region"
                                    required={requiredFields[section].includes(key)}
                                    onChange={handleChange(section, setter)(key)}
                                >
                                    <MenuItem value="temporallobe">Temporal Lobe</MenuItem>
                                    <MenuItem value="frontallobe">Frontal Lobe</MenuItem>
                                    <MenuItem value="brainstem">Brainstem</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    );
                }

                return (
                    <Grid item xs={12} md={isFullWidth ? 12 : 6} key={key}>
                        <TextField
                            label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            fullWidth
                            size="small"
                            required={requiredFields[section].includes(key)}
                            value={value}
                            multiline={isMultiline}
                            minRows={isMultiline ? 3 : 1}
                            onChange={handleChange(section, setter)(key)}
                            error={!!errors[errorKey]}
                            helperText={errors[errorKey] || ''}
                        />
                    </Grid>
                );
            })}
        </Grid>
    );

    return (
        <>
            {/* Seurat Object and Data Type */}
            <Typography variant="h6" fontWeight="bold" mb={2}>
                Select Seurat Object
            </Typography>
            <Grid container spacing={3} sx={{mb: 4}}>
                <Grid item xs={12} md={8}>
                    <FormControl fullWidth size="small" error={!!errors['seurat.seurat']}>
                        <InputLabel id="seurat-select-label">Seurat Object *</InputLabel>
                        <Select
                            labelId="seurat-select-label"
                            value={selectedSeurat}
                            label="Seurat Object"
                            onChange={(e) => setSelectedSeurat(e.target.value)}
                        >
                            {seuratObjects.map((obj) => (
                                <MenuItem key={obj} value={obj}>
                                    {obj}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small" error={!!errors['seurat.datatype']}>
                        <InputLabel id="datatype-select-label">Data Type *</InputLabel>
                        <Select
                            labelId="datatype-select-label"
                            value={dataType}
                            label="Data Type"
                            onChange={(e) => setDataType(e.target.value)}
                        >
                            <MenuItem value="scRNAseq">scRNAseq</MenuItem>
                            <MenuItem value="VisiumST">VisiumST</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Divider sx={{my: 3}}/>
            <Typography variant="h6" gutterBottom fontWeight="bold">Dataset Info</Typography>
            {renderFields('dataset', datasetInfo, setDatasetInfo)}
            <Divider sx={{my: 3}}/>
            <Typography variant="h6" gutterBottom fontWeight="bold">Study Info</Typography>
            {renderFields('study', studyInfo, setStudyInfo)}
            <Divider sx={{my: 3}}/>
            <Typography variant="h6" gutterBottom fontWeight="bold">Protocol Info</Typography>
            {renderFields('protocol', protocolInfo, setProtocolInfo)}
        </>
    );
});

export default ExtractInfo;
