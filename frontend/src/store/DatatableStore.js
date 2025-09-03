import {create} from "zustand";
import {toast} from "react-toastify";
import {getDatatable_get, getDatasetList, getSampletable_get} from "../api/api.js";
import {checkBWDataExists} from "./GenomicRegionStore.js";

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
        try {
            const response = await getDatasetList();
            // console.log(response);
            if (response.status === 200) {
                const data = await response.data;

                // Add has_bw property to each record
                const recordsWithBW = await Promise.all(
                    data[0].map(async (record) => {
                        const hasBW = await checkBWDataExists(record.dataset_id);
                        return {...record, has_bw: hasBW};
                    })
                );

                await set({datasetRecords: recordsWithBW, datasetFilters: data[1], datasetfetchStatus: "success"});
                // toast.success("Sample loaded successfully!");
            } else {
                console.error("Error fetching data:", response.data);
                await set({datasetRecords: [], datasetfetchStatus: "failed"});
                toast.error("Failed to fetch datasets.");
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            await set({datasetRecords: [], datasetfetchStatus: "error"});
            toast.info(error.response.data.detail);
        }
    },

}));

export default useDatatableStore;
