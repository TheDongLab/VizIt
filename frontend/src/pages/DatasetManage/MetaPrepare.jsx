import {useState, useEffect} from "react";
import {
    Box, Chip,
    Typography,
    Card,
    CardContent,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Checkbox,
    ListItemText,
    Grid
} from "@mui/material";
import useDatasetManageStore from "../../store/DatasetManageStore.js";


const MetaPrepare = ({ onMetaDataChange }) => {
    const {datasetName, datasetMetaFeatures, fetchMetaFeatures} = useDatasetManageStore();
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [majorClusterColumn, setMajorClusterColumn] = useState("");
    const [conditionColumn, setConditionColumn] = useState("");
    const [sampleIDColumn, setSampleIDColumn] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch the meta features list when the page loads
    useEffect(() => {
        if (datasetName) {
            setLoading(true);
            fetchMetaFeatures(datasetName).finally(() => setLoading(false));
        }
    }, [datasetName, fetchMetaFeatures]);

    const handleFeatureChange = (event) => {
        const {value} = event.target;
        if (value.length <= 10) {
            setSelectedFeatures(value);
        }
    };

    useEffect(() => {
        if (onMetaDataChange) {
            onMetaDataChange({
                dataset: datasetName,
                selected_features: selectedFeatures,
                sample_id_column: sampleIDColumn,
                major_cluster_column: majorClusterColumn,
                condition_column: conditionColumn,
            });
        }
    }, [datasetName, selectedFeatures, sampleIDColumn, majorClusterColumn, conditionColumn, onMetaDataChange]);


    return (
        <Box sx={{pb: 4}}>
            <Typography variant="h5" gutterBottom>Meta Preparation</Typography>

            {/* Dataset Selection */}
            <Card elevation={0} sx={{m: 0, p: 0}}>
                <CardContent sx={{pl: 2}}>
                    <Typography variant="p" gutterBottom>Select dataset</Typography>
                    <FormControl fullWidth>
                        <InputLabel id="dataset-select-label">Dataset</InputLabel>
                        <Select
                            labelId="dataset-select-label"
                            value={datasetName}
                            size={"small"}
                            label="Dataset"
                            disabled
                        >
                            <MenuItem value={datasetName}>{datasetName}</MenuItem>
                        </Select>
                    </FormControl>
                </CardContent>
            </Card>

            {/* Meta Features Selection */}
            <Card elevation={0} sx={{mb: 0}}>
                <CardContent>
                    <Typography variant="p" gutterBottom>Select meta features (up to 10)</Typography>
                    <FormControl fullWidth>
                        <Select
                            multiple
                            size={"small"}
                            value={selectedFeatures}
                            onChange={handleFeatureChange}
                            renderValue={(selected) => (
                                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                    {selected.map((value) => (<Chip key={value} label={value}/>))}
                                </Box>
                            )}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 400,
                                    },
                                },
                            }}
                        >
                            {datasetMetaFeatures.map((feature) => (
                                <MenuItem key={feature} value={feature} sx={{py: "4px"}}>
                                    <Checkbox sx={{py: 0}} checked={selectedFeatures.indexOf(feature) > -1}/>
                                    <ListItemText sx={{py: 0}} primary={feature}/>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </CardContent>
            </Card>

            {/* Major Cell Type and Condition Column Selection */}
            <Grid container spacing={2} sx={{mb: 6}}>
                <Grid item xs={4}>
                    <Card elevation={0}>
                        <CardContent>
                            <Typography variant="p" gutterBottom>SampleID column</Typography>
                            <FormControl fullWidth>
                                <Select
                                    value={sampleIDColumn}
                                    size={"small"}
                                    onChange={(e) => setSampleIDColumn(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {datasetMetaFeatures.map((feature) => (
                                        <MenuItem key={feature} value={feature}>{feature}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={4}>
                    <Card elevation={0}>
                        <CardContent>
                            <Typography variant="p" gutterBottom>Main cluster column</Typography>
                            <FormControl fullWidth>
                                <Select
                                    value={majorClusterColumn}
                                    size={"small"}
                                    onChange={(e) => setMajorClusterColumn(e.target.value)}
                                    displayEmpty

                                >
                                    <MenuItem value="">None</MenuItem>
                                    {datasetMetaFeatures.map((feature) => (
                                        <MenuItem key={feature} value={feature}>{feature}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={4}>
                    <Card elevation={0}>
                        <CardContent>
                            <Typography variant="p" gutterBottom>Condition column</Typography>
                            <FormControl fullWidth>
                                <Select
                                    value={conditionColumn}
                                    size={"small"}
                                    onChange={(e) => setConditionColumn(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {datasetMetaFeatures.map((feature) => (
                                        <MenuItem key={feature} value={feature}>{feature}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MetaPrepare;
