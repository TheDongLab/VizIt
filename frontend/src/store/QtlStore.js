import { create } from "zustand";
import {
    getGeneList,
    getSnpList,
    getGeneCellTypes,
    getSnpCellTypes,
    getSnpDataForGene,
    getGeneDataForSnp,
    getGeneChromosome,
    getSnpChromosome,
    getGeneLocation,
    getSnpLocation,
    getGeneLocationsInChromosome,
    getSnpLocationsInChromosome,
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
    loading: false,
    // loadingCellTypes: new Map(),
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
        set({ loading: true });

        try {
            const response = await getGeneList(dataset, query_str);
            const geneList = response.data;
            set({ geneList: geneList, loading: false });
            return geneList;
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
        set({ loading: true });

        try {
            const response = await getSnpList(dataset, query_str);
            const snpList = response.data;
            set({ snpList: snpList, loading: false });
            return snpList;
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
        set({ loading: true });

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
        set({ loading: true });

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
        set({ loading: true });

        try {
            const response = await getGeneCellTypes(
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
        set({ loading: true });

        try {
            const response = await getSnpCellTypes(dataset, get().selectedSnp);
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
        set({ loading: true, snpData: {} });
        const cellTypes = get().selectedCellTypes;
        // const loadingMap = new Map();
        // cellTypes.forEach((c) => loadingMap.set(c, true));
        // set({ loadingCellTypes: loadingMap, loading: false });

        try {
            for (const c of cellTypes) {
                const response = await getSnpDataForGene(
                    dataset,
                    get().selectedGene,
                    c,
                );
                const snpData = response.data;

                // loadingMap.set(c, false);

                set((state) => ({
                    snpData: {
                        ...state.snpData,
                        [c]: snpData,
                    },
                    // loadingCellTypes: loadingMap,
                }));
            }
            set({ loading: false });
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
        set({ loading: true, geneData: {} });
        const cellTypes = get().selectedCellTypes;
        // const loadingMap = new Map();
        // cellTypes.forEach((c) => loadingMap.set(c, true));
        // set({ loadingCellTypes: loadingMap, loading: false });

        try {
            for (const c of cellTypes) {
                const response = await getGeneDataForSnp(
                    dataset,
                    get().selectedSnp,
                    c,
                );
                const geneData = response.data;

                // loadingMap.set(c, false);

                set((state) => ({
                    geneData: {
                        ...state.geneData,
                        [c]: geneData,
                    },
                    // loadingCellTypes: loadingMap,
                }));
            }
            set({ loading: false });
        } catch (error) {
            console.error("Error fetching gene data for SNP:", error);
        }
    },

    fetchGeneLocations: async (dataset, radius) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGeneLocations: No dataset selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });

        try {
            const positionResponse = await getGeneLocation(
                dataset,
                get().selectedGene,
            );
            const startPosition = positionResponse.data.start;
            const endPosition = positionResponse.data.end;

            const response = await getGeneLocationsInChromosome(
                dataset,
                get().selectedChromosome,
                startPosition - radius,
                endPosition + radius,
            );
            const genes = response.data;
            return genes;
        } catch (error) {
            console.error("Error fetching gene locations:", error);
        }
    },

    fetchSnpLocations: async (dataset, radius) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchSnpLocations: No dataset selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });

        try {
            const positionResponse = await getSnpLocation(
                dataset,
                get().selectedSnp,
            );
            const position = positionResponse.data.position;

            const response = await getSnpLocationsInChromosome(
                dataset,
                get().selectedChromosome,
                position - radius,
                position + radius,
            );
            const snps = response.data;
            return snps;
        } catch (error) {
            console.error("Error fetching SNP locations:", error);
        }
    },
}));

export default useQtlStore;
