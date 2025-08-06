import {create} from "zustand"
import {getClusterList, getMarkerGenes, getCellCounts, getMainClusterInfo, getDEGsOfCluster,} from "../api/api.js";
import {toast} from "react-toastify";
import {transformSplitFormatToArray} from "../utils/funcs.js";

const useClusterStore = create((set, get) => ({
    // State
    mainCluster: "",
    clusterList: [],
    selectedClusters: [],
    cellCounts: null,

    markerGenes: null,
    diffExpGenes: {},

    loading: false,
    error: null,

    // Actions

    setSelectedClusters: (clusters) => set({selectedClusters: clusters}),

    setMainCluster: async (cluster) => await set({mainCluster: cluster}),
    getMainCluster: async () => await get().mainCluster,

    fetchMainClusterInfo: async (dataset_id) => {
        if (!dataset_id || dataset_id === "all") {
            set({error: "fetchMainClusterInfo: No dataset selected"});
            return [];
        }
        try {
            set({loading: true})
            const response = await getMainClusterInfo(dataset_id);
            if (response.status === 200) {
                const data = await response.data;
                await set({mainCluster: data, loading: false, error: null});
                return data
            } else {
                const error_message = "Error fetching main cluster info: " + response.message;
                await set({mainCluster: [], error: error_message, loading: false});
                toast.error(response.message);
                return []
            }
        } catch (error) {
            console.log("Error fetching main cluster info:", error);
            set({error: error.message, loading: false})
            return []
        }
    },

    fetchClusterList: async (dataset_id) => {
        if (!dataset_id || dataset_id === "all") {
            console.log("fetchClusterList:", dataset_id);
            set({error: "fetchClusterList: No dataset selected"});
            return;
        }
        try {
            set({loading: true})
            // Mock API call - replace with actual API
            const response = await getClusterList(dataset_id);
            if (response.status === 200) {
                const data = await response.data;
                await set({clusterList: data, loading: false, error: null});

            } else {
                const error_message = "Error fetching cluster list: " + response.message;
                await set({clusterList: [], error: error_message, loading: false});
                toast.error(response.message);
            }
        } catch (error) {
            console.log("Error fetching cluster list:", error);
            set({error: error.message, loading: false})
        }
    },

    fetchMarkerGenes: async (dataset_id) => {
        if (!dataset_id || dataset_id === "all") {
            set({error: "fetchMarkerGenes: No dataset selected"});
            return;
        }
        try {
            set({loading: true})
            const response = await getMarkerGenes(dataset_id);
            if (response.status === 200) {
                const data = await response.data;
                await set({
                    markerGenes: transformSplitFormatToArray(data),
                    loading: false,
                    error: null
                });

            } else {
                const error_message = "Error fetching cell type list: " + response.message;
                await set({markerGenes: [], error: error_message, loading: false});
                toast.error(response.message);
            }
        } catch (error) {
            console.log("Error fetching marker genes:", error);
            set({error: error.message, loading: false})
        }
    },

    fetchCellCounts: async (dataset_id) => {
        if (!dataset_id || dataset_id === "all") {
            set({error: "fetchMarkerGenes: No dataset selected"});
            return;
        }
        try {
            set({loading: true})
            const response = await getCellCounts(dataset_id);
            if (response.status === 200) {
                const data = await response.data;
                await set({cellCounts: data, loading: false, error: null});

            } else {
                const error_message = "Error fetching cell counts: " + response.message;
                await set({cellCounts: [], error: error_message, loading: false});
                toast.error(response.message);
            }
        } catch (error) {
            console.log("Error fetching cell counts:", error);
            set({error: error.message, loading: false})
        }
    },

    fetchDiffExpGenes: async (dataset_id) => {
        if (!dataset_id || dataset_id === "all") {
            set({error: "fetchDiffExpGenes: No dataset selected"});
            return;
        }
        try {
            set({loading: true})

            const selectedClusters = get().selectedClusters

            if (selectedClusters.length === 0) {
                set({diffExpGenes: {}, loading: false});
                return;
            }

            for (var cluster of selectedClusters) {
                if (!get().diffExpGenes[cluster]) {
                    const response = await getDEGsOfCluster(dataset_id, cluster);
                    set({diffExpGenes: {...get().diffExpGenes, [cluster]: response.data}});
                }
            }

            // remove cell type item if it is not selected
            for (var key in get().diffExpGenes) {
                if (!selectedClusters.includes(key)) {
                    delete get().diffExpGenes[key];
                }
            }
            console.log("diffExpGenes:", get().diffExpGenes)
        } catch (error) {
            console.error("Error fetching diff exp genes:", error)
            set({error: error.message, loading: false})
        }
    },
}))

export default useClusterStore

