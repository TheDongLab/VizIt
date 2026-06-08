import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        has_bw: hasBw,
        is_remote: true,
    };
};

const useRemoteDatasetStore = create(
    persist(
        (set) => ({
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
