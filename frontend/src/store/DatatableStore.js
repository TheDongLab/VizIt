import {create} from "zustand";
import {toast} from "react-toastify";
import {getDatatable_get, getDatasetList, getSampletable_get} from "../api/api.js";
import useRemoteDatasetStore from "./RemoteDatasetStore.js";

const useDatatableStore = create((set) => ({
    dataRecords: [],
    datafetchStatus: null,

    sampleRecords: [],
    samplefetchStatus: null,

    datasetRecords: [],
    datasetfetchStatus: null,

    datasetFilters: [],

    setDatasetRecords: (records) => set({datasetRecords: records}),

    fetchDataTable: async (dataset_id = "all") => {
        try {
            const response = await getDatatable_get(dataset_id);
            // console.log(response);
            if (response.status === 200) {
                const data = await response.data;
                await set({dataRecords: data, datafetchStatus: "success"});
                // toast.success("Sample loaded successfully!");
            } else {
                console.error("Error fetching data:", response.data);
                await set({dataRecords: [], datafetchStatus: "failed"});
                toast.error("Failed to fetch data.");
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            await set({dataRecords: [], datafetchStatus: "error"});
            toast.error("Error while fetching data.");
        }
    },

    fetchSampleData: async (conditions) => {
        try {
            conditions = {dataset_id: "all", sample_id: "all", ...conditions}
            const response = await getSampletable_get(conditions);
            // console.log(response);
            if (response.status === 200) {
                const data = await response.data;
                await set({sampleRecords: data, samplefetchStatus: "success"});
                // toast.success("Sample loaded successfully!");
            } else {
                console.error("Error fetching data:", response.data);
                await set({sampleRecords: [], samplefetchStatus: "failed"});
                toast.error("Failed to fetch sample data.");
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            await set({sampleRecords: [], samplefetchStatus: "error"});
            toast.error("Error while fetching sample data.");
        }
    },

    fetchDatasetList: async () => {
        const remoteDatasets = useRemoteDatasetStore.getState().remoteDatasets || [];
        try {
            const response = await getDatasetList();
            // console.log(response);
            if (response.status === 200) {
                const data = await response.data;

                await set({datasetRecords: [...data[0], ...remoteDatasets], datasetFilters: data[1], datasetfetchStatus: "success"});
                // toast.success("Sample loaded successfully!");
            } else {
                console.error("Error fetching data:", response.data);
                await set({datasetRecords: [...remoteDatasets], datasetfetchStatus: "failed"});
                toast.error("Failed to fetch datasets.");
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            // Use browser-local remote datasets if the server dataset table is unavailable.
            await set({datasetRecords: [...remoteDatasets], datasetfetchStatus: "error"});
            if (error?.response?.data?.detail) {
                toast.info(error.response.data.detail);
            }
        }
    },

}));

// When remote datasets change, refresh the merged list so all views pick up the
// updated remote datasets.
useRemoteDatasetStore.subscribe(
    (state) => state.remoteDatasets,
    () => useDatatableStore.getState().fetchDatasetList(),
);

export default useDatatableStore;
