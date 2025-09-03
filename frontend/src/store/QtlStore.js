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
    getGwasInChromosome,
} from "../api/qtl.js";

function columnToRow(data) {
    const keys = Object.keys(data);
    const length = data[keys[0]].length;

    const rows = [];
    for (let i = 0; i < length; i++) {
        const row = {};
        for (const key of keys) {
            row[key] = data[key][i];
        }
        rows.push(row);
    }

    return rows;
}

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
            throw error;
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
            throw error;
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
            throw error;
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
            throw error;
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
            throw error;
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
            throw error;
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
        const gene = get().selectedGene;
        // const loadingMap = new Map();
        // cellTypes.forEach((c) => loadingMap.set(c, true));
        // set({ loadingCellTypes: loadingMap, loading: false });
        const promises = get().selectedCellTypes.map(async (c) => {
            const response = await getSnpDataForGene(dataset, gene, c);
            const snpData = response.data;
            const snpDataRows = columnToRow(snpData);
            return [c, snpDataRows];
        });

        try {
            const results = await Promise.all(promises);

            const newSnpData = Object.fromEntries(results);
            set({ snpData: newSnpData, loading: false });
        } catch (error) {
            console.error("Error fetching SNP data for gene:", error);
            throw error;
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
        const snp = get().selectedSnp;
        // const loadingMap = new Map();
        // cellTypes.forEach((c) => loadingMap.set(c, true));
        // set({ loadingCellTypes: loadingMap, loading: false });

        const promises = get().selectedCellTypes.map(async (c) => {
            const response = await getGeneDataForSnp(dataset, snp, c);
            const geneData = response.data;
            const geneDataRows = columnToRow(geneData);
            return [c, geneDataRows];
        });

        try {
            const results = await Promise.all(promises);

            const newGeneData = Object.fromEntries(results);
            set({ geneData: newGeneData, loading: false });
        } catch (error) {
            console.error("Error fetching gene data for SNP:", error);
            throw error;
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
            const genesRows = columnToRow(genes);
            return genesRows;
        } catch (error) {
            console.error("Error fetching gene locations:", error);
            throw error;
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
            const snpsRows = columnToRow(snps);
            return snpsRows;
        } catch (error) {
            console.error("Error fetching SNP locations:", error);
            throw error;
        }
    },

    fetchGwasForGene: async (dataset, radius) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGwas: No dataset selected",
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

            const response = await getGwasInChromosome(
                dataset,
                get().selectedChromosome,
                startPosition - radius,
                endPosition + radius,
            );
            const hasGwas = response.data.hasGwas;
            if (!hasGwas) {
                return [];
            }
            const gwas = response.data.data;
            const gwasRows = columnToRow(gwas);
            return gwasRows;
        } catch (error) {
            console.error("Error fetching GWAS data:", error);
            throw error;
        }
    },

    fetchGwasForSnp: async (dataset, radius) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGwas: No dataset selected",
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

            const response = await getGwasInChromosome(
                dataset,
                get().selectedChromosome,
                position - radius,
                position + radius,
            );
            const hasGwas = response.data.hasGwas;
            if (!hasGwas) {
                return [];
            }
            const gwas = response.data.data;
            const gwasRows = columnToRow(gwas);
            return gwasRows;
        } catch (error) {
            console.error("Error fetching GWAS data:", error);
            throw error;
        }
    },

    resetQtlState: () => {
        set({
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
            error: null,
        });
    },
}));

export default useQtlStore;
