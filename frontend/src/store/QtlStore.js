import { create } from "zustand";
import {
    getGeneList,
    getSnpList,
    getCellTypesForGene,
    getCellTypesForSnp,
    getSnpDataForGene,
    getGeneDataForSnp,
    getGeneChromosome,
    getSnpChromosome,
} from "../api/qtl.js";

const useQtlStore = create((set, get) => ({
    dataset: null,
    selectedGene: null,
    selectedSnp: null,
    geneList: [],
    snpList: [],
    selectedChromosome: null,
    selectedCellTypes: [],
    snpData: {},
    geneData: {},
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

    fetchGeneChromosome: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGeneChromosome: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getGeneChromosome(
                dataset,
                get().selectedGene,
            );
            const chromosome = response.data;
            set({ selectedChromosome: chromosome, loading: false });
        } catch (error) {
            console.error("Error fetching gene chromosome:", error);
        }
    },

    fetchSnpChromosome: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchSnpChromosome: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getSnpChromosome(dataset, get().selectedSnp);
            const chromosome = response.data;
            set({ selectedChromosome: chromosome, loading: false });
        } catch (error) {
            console.error("Error fetching SNP chromosome:", error);
        }
    },

    fetchGeneCellTypes: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGeneCellTypes: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getCellTypesForGene(
                dataset,
                get().selectedGene,
            );
            const cellTypes = response.data;
            set({ selectedCellTypes: cellTypes, loading: false });
        } catch (error) {
            console.error("Error fetching cell types:", error);
        }
    },

    fetchSnpCellTypes: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchSnpCellTypes: No dataset selected",
                loading: false,
            });
            return;
        }

        try {
            const response = await getCellTypesForSnp(
                dataset,
                get().selectedSnp,
            );
            const cellTypes = response.data;
            set({ selectedCellTypes: cellTypes, loading: false });
        } catch (error) {
            console.error("Error fetching cell types:", error);
        }
    },

    fetchSnpData: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchSnpData: No dataset selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });

        try {
            for (const celltype of get().selectedCellTypes) {
                const response = await getSnpDataForGene(
                    dataset,
                    get().selectedGene,
                    celltype,
                );
                const snpData = response.data;

                set((state) => ({
                    snpData: {
                        ...state.snpData,
                        [celltype]: snpData,
                    },
                    loading: false,
                }));
            }
        } catch (error) {
            console.error("Error fetching SNP data for gene:", error);
        }
    },

    fetchGeneData: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGeneData: No dataset selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });

        try {
            for (const celltype of get().selectedCellTypes) {
                const response = await getGeneDataForSnp(
                    dataset,
                    get().selectedSnp,
                    celltype,
                );
                const geneData = response.data;

                set((state) => ({
                    geneData: {
                        ...state.geneData,
                        [celltype]: geneData,
                    },
                    loading: false,
                }));
            }
        } catch (error) {
            console.error("Error fetching gene data for SNP:", error);
        }
    },
}));

export default useQtlStore;
