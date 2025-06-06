import { create } from "zustand";
import {
    getGeneList,
    getSnpList,
    getSnpDataForGene,
    getGeneDataForSnp,
} from "../api/qtl.js";

const useQtlStore = create((set, get) => ({
    dataset: null,
    selectedGene: null,
    selectedSnp: null,
    geneList: [],
    snpList: [],
    snpData: null,
    geneData: null,
    loading: true,
    error: null,

    setDataset: (dataset) => {
        set({ dataset: dataset });
    },

    setSelectedGene: (gene) => {
        set({ selectedGene: gene });
    },

    setSelectedSnp: (snp) => {
        set({ selectedSnp: snp });
    },

    fetchGeneList: async (dataset, query_str = "all") => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGeneList: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getGeneList(dataset, query_str);
            const geneList = response.data;
            set({ geneList: geneList, loading: false });
        } catch (error) {
            console.error("Error fetching gene list:", error);
        }
    },

    fetchSnpList: async (dataset, query_str = "all") => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchSnpList: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getSnpList(dataset, query_str);
            const snpList = response.data;
            set({ snpList: snpList, loading: false });
        } catch (error) {
            console.error("Error fetching SNP list:", error);
        }
    },

    fetchSnpData: async (dataset, celltype) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchSnpData: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getSnpDataForGene(
                dataset,
                get().selectedGene,
                celltype,
            );
            const snpData = response.data;
            set({ snpData: snpData, loading: false });
        } catch (error) {
            console.error("Error fetching SNP data for gene:", error);
        }
    },

    fetchGeneData: async (dataset, celltype) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGeneData: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getGeneDataForSnp(
                dataset,
                get().selectedSnp,
                celltype,
            );
            const geneData = response.data;
            set({ geneData: geneData, loading: false });
        } catch (error) {
            console.error("Error fetching gene data for SNP:", error);
        }
    },
}));

export default useQtlStore;
