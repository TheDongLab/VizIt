import {create} from 'zustand'
import axios from 'axios'
import {toast} from "react-toastify";

const BASE_URL = "http://localhost:8000"; // Replace with your backend URL
// const BASE_URL = "http://10.168.236.29:8000"; // Replace with your backend URL

const dmURL = `${BASE_URL}/datasetmanage`;

const useDatasetManageStore = create((set, get) => ({
    // Seurat objects
    seuratObjects: [],
    selectedSeurat: '',

    // Dataset name
    datasetName: '',
    datasetType: '',
    isNameUnique: null,
    isCheckingName: false,

    // Processing
    isProcessing: false,
    processingStatus: {
        status: 'idle',
        log: '',
    },

    datasetMetaFeatures: [],

    // Messages
    error: null,
    success: null,

    // Setters
    setSelectedSeurat: (seurat) => set({selectedSeurat: seurat}),
    setDatasetName: (name) => set({datasetName: name}),

    // Actions
    fetDatasetInfo: async (dataset) => {
        set({isLoading: true, error: null});
        try {
            const response = await axios.get(`${dmURL}/getdatasetinfo?dataset=${dataset}`);
            set({datasetInfo: response.data});
        } catch (error) {
            set({
                error: error.response?.data?.error || 'Failed to load dataset info. Please try again later.'
            });
            console.error('Error fetching dataset info:', error);
        } finally {
            set({isLoading: false});
        }
    },

    fetchSeuratObjects: async () => {
        set({isLoading: true, error: null});
        try {
            const response = await axios.get(`${dmURL}/getseuratobjects`);
            set({seuratObjects: response.data});
        } catch (error) {
            set({
                error: error.response?.data?.error || 'Failed to load Seurat objects. Please try again later.'
            });
            console.error('Error fetching Seurat objects:', error);
        } finally {
            set({isLoading: false});
        }
    },

    checkDatasetName: async (name) => {
        if (!name || name.length < 3) {
            set({isNameUnique: null});
            return;
        }

        set({isCheckingName: true});
        try {
            const response = await axios.get(`${dmURL}/checkdatasetname?name=${encodeURIComponent(name)}`);
            set({isNameUnique: response.data.isUnique});
        } catch (error) {
            console.error('Error checking dataset name:', error);
        } finally {
            set({isCheckingName: false});
        }
    },

    extractSeuratData: async (payload) => {
        const {selectedSeurat, datasetName} = get();

        if (!selectedSeurat || !datasetName) {
            set({error: 'Please select a Seurat object and provide a unique dataset name'});
            return;
        }

        set({
            isProcessing: true,
            error: null,
            success: null,
            processingStatus: {
                status: 'processing',
                log: 'Starting dataset processing...',
            }
        });

        try {
            const response = await axios.post(`${dmURL}/extractseuratdata`, payload);
            return response.data;

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An error occurred while running extractseuratdata.';
            set({
                error: errorMessage,
                isProcessing: false,
                processingStatus: {
                    status: 'failed',
                    log: get().processingStatus.log + '\n\n' + errorMessage,
                }
            });
        }
    },

    fetchProcessingStatus: async (dataset,task="extract_seurat") => {
        try {
            const response = await axios.get(`${dmURL}/getprocessingstatus?dataset=${dataset}&task=${task}`);
            const data = response.data;

            set({processingStatus: data});

            // If processing is complete or failed, stop polling
            if (data.status === 'completed' || data.status === 'failed') {
                if (data.status === 'completed') {
                    set({
                        success: `Dataset "${get().datasetName}" has been successfully processed!`,
                        isProcessing: false
                    });
                } else {
                    set({
                        error: 'Processing failed. Please check the output log for details.',
                        isProcessing: false
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching processing status:', error);
        }
    },

    fetchMetaFeatures: async (dataset) => {
        try {
            const response = await axios.get(`${dmURL}/getdatasetfeatures?dataset=${dataset}`);
            set({datasetMetaFeatures: response.data});
        } catch (error) {
            console.error('Error fetching meta features:', error);
        }
    },

    prepareMetaData: async (payload) => {
        try {
            console.log(payload);
            const response = await axios.post(`${dmURL}/preparemetafeatures`, payload);
            return response.data;
        } catch (error) {
            console.error('Error fetching meta features:', error);
            return null;
        }
    },

    resetProcessingState: () => {
        set({
            error: null,
            success: null,
            isProcessing: false,
            processingStatus: {
                status: 'idle',
                log: '',
            }
        });
    },

    refreshDatabase: async () => {
        try {
            const response = await axios.get(`${dmURL}/refreshdatabase`);
            if(response.data.success){
                toast.success(response.data.message);
            }else{
                toast.error(response.data.message);
            }
            return response.data;
        } catch (error) {
            console.error('Error refreshing database:', error);
            toast.error('Error while refreshing database.');
            return null;
        }
    }
}));

export default useDatasetManageStore;
