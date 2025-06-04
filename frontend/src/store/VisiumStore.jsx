import {create} from "zustand"
import {getVisiumDefaults} from "../api/visium.js"

const useVisiumStore = create((set, get) => ({
    dataSet: null,
    defaultSamples: [],
    defaultFeatures: [],
    defaultGenes: [],

    fetchVisiumDefaults: async (dataset_id) => {
        dataset_id = dataset_id ?? get().dataSet
        if (!dataset_id || dataset_id === "all") {
            set({error: "fetchVisiumDefaults: No dataset selected", metadataLoading: false})
            return
        }

        try {
            const response = await getVisiumDefaults(dataset_id)
            const samples = response.data.samples
            const features = response.data.features
            const genes = response.data.genes
            set({defaultSamples: samples, defaultFeatures: features, defaultGenes: genes})
        } catch (error) {
            console.error('Error fetching visium defaults:', error);
        }
    },

}))

export default useVisiumStore;
