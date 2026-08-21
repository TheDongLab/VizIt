import { create } from "zustand";
import { persist } from "zustand/middleware";

import { inspectDataset } from "../api/qtl.js";

export const buildRemoteRecord = (url, name, info = {}) => {
    let assay = info.assay || "";
    const hasBw = !!info.has_bw;
    const hasQtl = !!info.has_qtl;

    // Normalize the assay string so the view filters recognize it:
    //  - xQTL view lists datasets whose assay ends with "qtl"
    //  - Genomic-Region view lists datasets whose assay ends with RNAseq/ATACseq
    if (hasQtl && !assay.toLowerCase().endsWith("qtl")) {
        assay = info.is_caqtl ? "caQTL" : "eQTL";
    }
    if (hasBw && !/(RNAseq|ATACseq)$/i.test(assay)) {
        assay =
            assay && assay.toLowerCase().endsWith("qtl") ? assay : "scATACseq";
    }

    return {
        dataset_id: url,
        dataset_name: name || info.dataset_name || url,
        PI_full_name: (info.info && info.info.PI_full_name) || "—",
        first_contributor: (info.info && info.info.first_contributor) || "—",
        n_samples: (info.info && info.info.n_samples) || 0,
        brain_region: (info.info && info.info.brain_region) || "",
        brain_super_region: (info.info && info.info.brain_super_region) || "",
        disease: (info.info && info.info.disease) || "",
        organism: (info.info && info.info.organism) || "",
        tissue: (info.info && info.info.tissue) || "",
        assay: assay,
        sample_sheet: "None",
        sample_count: 0,
        has_samples: false,
        has_umap: !!info.has_umap,
        has_qtl: hasQtl,
        has_bw: hasBw,
        has_spatial: !!info.has_spatial,
        is_remote: true,
    };
};

const useRemoteDatasetStore = create(
    persist(
        (set, get) => ({
            remoteDatasets: [],

            addRemoteDataset: (record) =>
                set((state) => ({
                    remoteDatasets: [
                        ...state.remoteDatasets.filter(
                            (r) => r.dataset_id !== record.dataset_id,
                        ),
                        record,
                    ],
                })),

            ensureRemoteDataset: async (url) => {
                if (!url || !/^https?:\/\//i.test(url)) return false;
                if (get().remoteDatasets.some((r) => r.dataset_id === url)) {
                    return false;
                }
                try {
                    const info = await inspectDataset(url);
                    if (!info || !info.reachable) return false;
                    const record = buildRemoteRecord(url, "", info);
                    set((state) => ({
                        remoteDatasets: [
                            ...state.remoteDatasets.filter(
                                (r) => r.dataset_id !== url,
                            ),
                            record,
                        ],
                    }));
                    return true;
                } catch {
                    return false;
                }
            },

            removeRemoteDataset: (datasetId) =>
                set((state) => ({
                    remoteDatasets: state.remoteDatasets.filter(
                        (r) => r.dataset_id !== datasetId,
                    ),
                })),
        }),
        { name: "vizit-remote-datasets" },
    ),
);

export default useRemoteDatasetStore;
