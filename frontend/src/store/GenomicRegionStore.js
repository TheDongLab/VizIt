import { create } from "zustand";
import {
    getRegionSignalData,
    getCellTypeList,
    getGeneLocationsInChromosome,
    getGwasInChromosome,
} from "../api/signal.js";

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

const useSignalStore = create((set, get) => ({
    dataset: null,
    selectedChromosome: null,
    selectedRange: null,
    availableCellTypes: [],
    signalData: {},
    loading: false,
    error: null,

    setDataset: (dataset) => {
        set({ dataset: dataset });
    },

    setSelectedChromosome: (chromosome) => {
        set({ selectedChromosome: chromosome });
    },

    setSelectedRange: (start, end) => {
        set({ selectedRange: { start: start, end: end } });
    },

    fetchCellTypes: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchCellTypes: No dataset selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });

        try {
            const response = await getCellTypeList(dataset);
            const acellTypes = response.data;
            // remove astrocytes and oligodendrocytes
            const cellTypes = acellTypes.filter(
                (c) => c !== "Astrocytes" && c !== "Oligodendrocytes",
            );
            set({ availableCellTypes: cellTypes, loading: false });
        } catch (error) {
            console.error("Error fetching cell types:", error);
            throw error;
        }
    },

    fetchSignalData: async (dataset, start, end, binSize) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchSignalData: No dataset selected",
                loading: false,
            });
            return;
        }
        const chromosome = get().selectedChromosome;

        if (
            !chromosome ||
            start === null ||
            start === undefined ||
            end === null ||
            end === undefined
        ) {
            set({
                error: "fetchSignalData: No chromosome or range selected",
                loading: false,
            });
            return;
        }
        set({ loading: true, snpData: {} });

        const promises = get().availableCellTypes.map(async (c) => {
            console.log(
                `Fetching signal data for ${dataset}, chromosome ${chromosome}, range ${start}-${end}, cell type ${c}, bin size ${binSize}`,
            );

            const response = await getRegionSignalData(
                dataset,
                chromosome,
                start,
                end,
                c,
                binSize,
            );
            const signalData = response.data;
            const signalDataRows = columnToRow(signalData);
            return [c, signalDataRows];
        });

        try {
            const results = await Promise.all(promises);

            const newSignalData = Object.fromEntries(results);
            set({ signalData: newSignalData, loading: false, error: null });
        } catch (error) {
            console.error("Error fetching signal data:", error);
            throw error;
        }
    },

    fetchGeneLocations: async (dataset, start, end) => {
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
            const response = await getGeneLocationsInChromosome(
                dataset,
                get().selectedChromosome,
                start,
                end,
            );
            const genes = response.data;
            const genesRows = columnToRow(genes);
            return genesRows;
        } catch (error) {
            console.error("Error fetching gene locations:", error);
            throw error;
        }
    },

    fetchGwas: async (dataset, start, end) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchGwas: No dataset selected",
                loading: false,
            });
            return;
        }

        const chromosome = get().selectedChromosome;

        if (
            !chromosome ||
            start === null ||
            start === undefined ||
            end === null ||
            end === undefined
        ) {
            set({
                error: "fetchGwas: No chromosome or range selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });

        try {
            const response = await getGwasInChromosome(
                dataset,
                chromosome,
                start,
                end,
            );
            const gwas = response.data;
            const gwasRows = columnToRow(gwas);
            return gwasRows;
        } catch (error) {
            console.error("Error fetching GWAS data:", error);
            throw error;
        }
    },

    // resetQtlState: () => {
    //     set({
    //         dataset: null,
    //         selectedGene: null,
    //         selectedSnp: null,
    //         geneList: [],
    //         snpList: [],
    //         selectedChromosome: null,
    //         selectedCellTypes: [],
    //         snpData: {},
    //         geneData: {},
    //         loading: false,
    //         error: null,
    //     });
    // },
}));

export default useSignalStore;
