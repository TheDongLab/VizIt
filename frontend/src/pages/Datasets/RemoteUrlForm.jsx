import { forwardRef, useImperativeHandle, useState } from "react";
import {
    TextField,
    Box,
    Typography,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
    Link,
    Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PropTypes from "prop-types";
import { toast } from "react-toastify";

import useRemoteDatasetStore, {
    buildRemoteRecord,
} from "../../store/RemoteDatasetStore.js";
import useDatatableStore from "../../store/DatatableStore.js";
import { inspectDataset } from "../../api/qtl.js";

const normalizeUrl = (raw) => (raw || "").trim().replace(/\/+$/, "");

const RemoteUrlForm = forwardRef(({ disabled, onBusyChange, onAdded }, ref) => {
    const { remoteDatasets, addRemoteDataset, removeRemoteDataset } =
        useRemoteDatasetStore();
    const { fetchDatasetList } = useDatatableStore();

    const [url, setUrl] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const setBusy = (busy) => {
        if (onBusyChange) onBusyChange(busy);
    };

    const handleAdd = async () => {
        setError("");
        const cleanUrl = normalizeUrl(url);
        if (!/^https?:\/\//i.test(cleanUrl)) {
            setError("Please enter a full http:// or https:// URL.");
            return;
        }

        setBusy(true);
        try {
            const info = await inspectDataset(cleanUrl);
            if (!info || !info.reachable) {
                setError(
                    info?.error ||
                        "Could not reach a valid dataset at that URL. Check the URL, that the host is publicly reachable, and that it serves the dataset files (e.g. dataset_info.toml, celltypes/ or bigwig/).",
                );
                setBusy(false);
                return;
            }
            if (!info.has_qtl && !info.has_bw) {
                setError(
                    "The URL is reachable but does not look like a QTL or signal/peaks dataset (no celltypes/ parquet and no bigwig/ tracks found).",
                );
                setBusy(false);
                return;
            }

            const record = buildRemoteRecord(cleanUrl, name, info);
            addRemoteDataset(record);
            await fetchDatasetList();
            toast.success(`Added remote dataset "${record.dataset_name}".`);
            setUrl("");
            setName("");
            setError("");
            setBusy(false);
            if (onAdded) onAdded(record);
        } catch (e) {
            setError(
                e?.response?.data?.detail ||
                    "Failed to inspect the dataset URL. The server may have blocked it (private/loopback addresses are not allowed).",
            );
            setBusy(false);
        }
    };

    const handleRemove = async (datasetId) => {
        removeRemoteDataset(datasetId);
        await fetchDatasetList();
        toast.info("Removed remote dataset.");
    };

    useImperativeHandle(ref, () => ({ submit: handleAdd }));

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Point to the dataset directory of a remotely hosted HTTP server.
                The dataset is stored only in your browser and is not visible to
                other users.
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mb: 1,
                }}
            >
                <TextField
                    label="Dataset URL"
                    placeholder="https://data.example.org/datasets/PD5D_MTG_eQTL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={disabled}
                    autoFocus
                />
                <TextField
                    label="Display name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={disabled}
                />
                {error && <Alert severity="error">{error}</Alert>}
            </Box>

            {remoteDatasets.length > 0 && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Your remote datasets
                    </Typography>
                    <List dense>
                        {remoteDatasets.map((ds) => (
                            <ListItem
                                key={ds.dataset_id}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="remove"
                                        onClick={() =>
                                            handleRemove(ds.dataset_id)
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            {ds.dataset_name}
                                            <Chip
                                                size="small"
                                                label={ds.assay || "remote"}
                                            />
                                            {ds.has_bw && (
                                                <Chip
                                                    size="small"
                                                    color="primary"
                                                    label="Peaks"
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Link
                                            href={ds.dataset_id}
                                            target="_blank"
                                            rel="noreferrer"
                                            underline="hover"
                                        >
                                            {ds.dataset_id}
                                        </Link>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
        </>
    );
});

RemoteUrlForm.displayName = "RemoteUrlForm";

RemoteUrlForm.propTypes = {
    disabled: PropTypes.bool,
    onBusyChange: PropTypes.func,
    onAdded: PropTypes.func,
};

export default RemoteUrlForm;
