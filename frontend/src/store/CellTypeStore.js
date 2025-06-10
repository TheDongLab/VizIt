import {create} from "zustand"
import {getCellTypeList, getMarkerGenes, getCellCounts, getMainClusterInfo, getDEGsOfCellType,} from "../api/api.js";
import {toast} from "react-toastify";
import {transformSplitFormatToArray} from "../utils/funcs.js";

const useCellTypeStore = create((set, get) => ({
    // State
    mainCluster: "",
    cellTypeList: [],
    selectedCellTypes: [],
    cellCounts: null,

    markerGenes: null,
    diffExpGenes: {},

    loading: false,
    error: null,

    // Actions

    setSelectedCellTypes: (cellTypes) => set({selectedCellTypes: cellTypes}),

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
            set({error: error.message, loading: false})
            return []
        }
    },

    fetchCellTypeList: async (dataset_id) => {
        if (!dataset_id || dataset_id === "all") {
            set({error: "fetchCellTypeList: No dataset selected"});
            return;
        }
        try {
            set({loading: true})
            // Mock API call - replace with actual API
            const response = await getCellTypeList(dataset_id);
            if (response.status === 200) {
                const data = await response.data;
                await set({cellTypeList: data, loading: false, error: null});

            } else {
                const error_message = "Error fetching cell type list: " + response.message;
                await set({cellTypeList: [], error: error_message, loading: false});
                toast.error(response.message);
            }
        } catch (error) {
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

            const selectedCellTypes = get().selectedCellTypes

            if (selectedCellTypes.length === 0) {
                set({diffExpGenes: {}, loading: false});
                return;
            }

            for (var cellType of selectedCellTypes) {
                if (!get().diffExpGenes[cellType]) {
                    const response = await getDEGsOfCellType(dataset_id, cellType);
                    set({diffExpGenes: {...get().diffExpGenes, [cellType]: response.data}});
                }
            }

            // remove cell type item if it is not selected
            for (var key in get().diffExpGenes) {
                if (!selectedCellTypes.includes(key)) {
                    delete get().diffExpGenes[key];
                }
            }

            console.log("diffExpGenes:", get().diffExpGenes)

            // // Mock data
            // // Define comparison types
            // const comparisons = ["PDvsHC", "PDvsILB", "ILBvsHC"]
            //
            // // Gene pools for different comparisons
            // const genePoolUp = [
            //     // Up-regulated genes
            //     "LRRK2", "SNCA", "PARK7", "PINK1", "PRKN", "GBA",
            //     "VPS35", "ATP13A2", "FBXO7", "PLA2G6", "DNAJC6", "SYNJ1", "VPS13C", "CHCHD2", "TMEM230", "MAPT", "APP", "PSEN1",
            //     "PSEN2", "APOE", "TREM2", "CD33", "ABCA7", "CLU", "CR1", "BIN1", "SORL1", "TREM2", "PLCG2", "ABI3", "INPP5D",
            // ]
            //
            // const genePoolDown = [
            //     // Down-regulated genes
            //     "TH", "SLC6A3", "SLC18A2", "DDC", "DBH", "ALDH1A1",
            //     "NR4A2", "PITX3", "EN1", "LMX1B", "FOXA2", "OTX2", "MSX1", "NEUROD1",
            //     "NEUROG2", "BDNF", "NGF", "GDNF", "NTRK1", "NTRK2", "NTRK3", "GRIN1",
            //     "GRIN2A", "GRIN2B", "GRIA1", "GRIA2", "DRD1", "DRD2", "HTR1A", "HTR2A", "CHRNA7",
            // ]
            //
            // const mockDiffExpGenes = {}
            //
            // // For each selected cell type
            // selectedCellTypes.forEach((cellType) => {
            //     mockDiffExpGenes[cellType] = {}
            //
            //     // For each comparison type
            //     comparisons.forEach((comparison) => {
            //         // Extract the two conditions from the comparison
            //         const [condition1, condition2] = comparison.split("vs")
            //
            //         // Generate DEGs for this comparison
            //         const degs = []
            //
            //         // Generate up-regulated genes (higher in condition1)
            //         for (let i = 0; i < 15; i++) {
            //             const geneIndex = Math.floor(Math.random() * genePoolUp.length)
            //             const logFC = Math.random() * 3 + 1 // LogFC between 1 and 4
            //
            //             // Generate expression data for samples
            //             const expression = []
            //
            //             // Condition1 samples (higher expression)
            //             for (let j = 0; j < 8; j++) {
            //                 expression.push({
            //                     sampleId: `${condition1}_sample_${j + 1}`,
            //                     condition: condition1,
            //                     value: Math.random() * 2 + 6, // Expression value between 6-8
            //                 })
            //             }
            //
            //             // Condition2 samples (lower expression)
            //             for (let j = 0; j < 8; j++) {
            //                 expression.push({
            //                     sampleId: `${condition2}_sample_${j + 1}`,
            //                     condition: condition2,
            //                     value: Math.random() * 2 + 2, // Expression value between 2-4
            //                 })
            //             }
            //
            //             degs.push({
            //                 gene: `${genePoolUp[geneIndex]}_${i}`,
            //                 avg_log2FC: logFC,
            //                 p_val_adj: Math.random() * 0.05,
            //                 expression: expression,
            //             })
            //         }
            //
            //         // Generate down-regulated genes (lower in condition1, higher in condition2)
            //         for (let i = 0; i < 15; i++) {
            //             const geneIndex = Math.floor(Math.random() * genePoolDown.length)
            //             const logFC = -(Math.random() * 3 + 1) // Negative LogFC between -1 and -4
            //
            //             // Generate expression data for samples
            //             const expression = []
            //
            //             // Condition1 samples (lower expression)
            //             for (let j = 0; j < 8; j++) {
            //                 expression.push({
            //                     sampleId: `${condition1}_sample_${j + 1}`,
            //                     condition: condition1,
            //                     value: Math.random() * 2 + 2, // Expression value between 2-4
            //                 })
            //             }
            //
            //             // Condition2 samples (higher expression)
            //             for (let j = 0; j < 8; j++) {
            //                 expression.push({
            //                     sampleId: `${condition2}_sample_${j + 1}`,
            //                     condition: condition2,
            //                     value: Math.random() * 2 + 6, // Expression value between 6-8
            //                 })
            //             }
            //
            //             degs.push({
            //                 gene: `${genePoolDown[geneIndex]}_${i}`,
            //                 avg_log2FC: logFC,
            //                 p_val_adj: Math.random() * 0.05,
            //                 expression: expression,
            //             })
            //         }
            //
            //         // Add the DEGs for this comparison to the cell type
            //         mockDiffExpGenes[cellType][comparison] = degs
            //     })
            // })
            //
            // set({diffExpGenes: mockDiffExpGenes, loading: false})

        } catch (error) {
            set({error: error.message, loading: false})
        }
    },
}))

export default useCellTypeStore

