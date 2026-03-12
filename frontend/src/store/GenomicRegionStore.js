import { create } from "zustand";
import {
    getBWDataExists,
    getRegionSignalData,
    getCellTypeList,
    getGeneLocationsInChromosome,
    getGwasInChromosome,
    getGeneList,
    getSnpList,
    getExonStructureInChromosome,
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

export const checkBWDataExists = async (dataset) => {
    try {
        const response = await getBWDataExists(dataset);
        const hasBWData = response.data.hasBWData;
        return hasBWData;
    } catch (error) {
        console.error("Error checking BW data exists:", error);
    }
};

const useSignalStore = create((set, get) => ({
    dataset: null,
    hasBWData: false,
    selectedChromosome: null,
    selectedRange: null,
    availableCellTypes: [],
    signalData: {},
    loading: false,
    error: null,
    geneList: [],
    snpList: [],
    exonStructure: [],
    exonStructureTruncated: false,

    setDataset: (dataset) => {
        set({ dataset: dataset });
    },

    setSelectedChromosome: (chromosome) => {
        set({ selectedChromosome: chromosome });
    },

    setSelectedRange: (start, end) => {
        set({ selectedRange: { start: start, end: end } });
    },

    setHasBWData: (hasBWData) => {
        set({ hasBWData: hasBWData });
    },

    fetchBWDataExists: async (dataset) => {
        dataset = dataset ?? get().dataset;
        if (!dataset || dataset === "all") {
            set({
                error: "fetchBWDataExists: No dataset selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });

        try {
            const response = await getBWDataExists(dataset);
            const hasBWData = response.data.hasBWData;
            set({ hasBWData: hasBWData, loading: false });
        } catch (error) {
            console.error("Error fetching BW data exists:", error);
            throw error;
        }
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
            const cellTypes = response.data;
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
                hasBWData: false,
                loading: false,
            });
            return;
        }
        set({ loading: true, snpData: {} });

        const promises = get().availableCellTypes.map(async (c) => {
            const response = await getRegionSignalData(
                dataset,
                chromosome,
                start,
                end,
                c,
                binSize,
            );
            const hasBWData = response.hasBWData;
            set({ hasBWData });
            if (!hasBWData) {
                return [c, []];
            }
            const signalData = response.data;

            if (signalData.plus && signalData.minus) {
                const plusRows = columnToRow(signalData.plus);
                const minusRows = columnToRow(signalData.minus);

                return [
                    c,
                    {
                        plus: plusRows,
                        minus: minusRows,
                    },
                ];
            }

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

    fetchExonStructure: async (dataset, start, end) => {
        dataset = dataset ?? get().dataset;
        const chromosome = get().selectedChromosome;
        if (!dataset || dataset === "all" || !chromosome) {
            set({
                error: "fetchExonStructure: No dataset or chromosome selected",
                loading: false,
            });
            return;
        }
        set({ loading: true });
        try {
            const resp = await getExonStructureInChromosome(
                dataset,
                chromosome,
                start,
                end,
            );
            const data = resp.data;

            if (typeof data === "string" && data.startsWith("Error")) {
                set({ exonStructure: [], loading: false });
                return [];
            }

            const exonRows = columnToRow(data).filter(
                (row) =>
                    row.transcript_id != null &&
                    row.exon_start != null &&
                    row.exon_end != null,
            );

            // group by transcript_id
            const byTx = new Map();
            for (const r of exonRows) {
                const tx = r.transcript_id;
                if (!byTx.has(tx)) byTx.set(tx, []);
                byTx.get(tx).push(r);
            }

            // rebuild the original nested transcript structure
            const transcripts = [];
            for (const [tx, rows] of byTx.entries()) {
                if (!rows || rows.length === 0) continue;
                const r0 = rows[0];
                const exons = rows
                    .map((r) => ({
                        exon_start: r.exon_start,
                        exon_end: r.exon_end,
                        exon_index: r.exon_index,
                        exon_count: r.exon_count,
                    }))
                    .sort((a, b) => a.exon_start - b.exon_start);

                transcripts.push({
                    chrom: r0.chrom,
                    transcript_id: tx,
                    gene_id: r0.gene_id,
                    gene_symbol: r0.gene_symbol,
                    strand: r0.strand,
                    biotype: r0.biotype,
                    tx_start: r0.tx_start,
                    tx_end: r0.tx_end,
                    exons,
                });
            }

            const truncated = !!data._truncated;

            set({
                exonStructure: transcripts,
                exonStructureTruncated: truncated,
                loading: false,
            });
            return transcripts;
        } catch (error) {
            console.error("Error fetching exon structure:", error);
            set({
                exonStructure: [],
                exonStructureTruncated: false,
                loading: false,
            });
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
