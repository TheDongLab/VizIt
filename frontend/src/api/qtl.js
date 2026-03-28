import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const QTL_URL = `${BASE_URL}/qtl`;

export const getGeneLocation = async (dataset, gene) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgenelocation`, {
            params: { dataset: dataset, gene: gene },
        });
        return response;
    } catch (error) {
        console.error("Error getGeneLocation:", error);
        throw error;
    }
};

export const getSnpLocation = async (dataset, snp) => {
    try {
        const response = await axios.get(`${QTL_URL}/getsnplocation`, {
            params: { dataset: dataset, snp: snp },
        });
        return response;
    } catch (error) {
        console.error("Error getSnpLocation:", error);
        throw error;
    }
};

export const getGeneList = async (dataset, query_str) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgenelist`, {
            params: { dataset: dataset, query_str: query_str },
        });
        return response;
    } catch (error) {
        console.error("Error getGeneList:", error);
        throw error;
    }
};

export const getSnpList = async (dataset, query_str) => {
    try {
        const response = await axios.get(`${QTL_URL}/getsnplist`, {
            params: { dataset: dataset, query_str: query_str },
        });
        return response;
    } catch (error) {
        console.error("Error getSnpList:", error);
        throw error;
    }
};

export const getGeneChromosome = async (dataset, gene) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgenechromosome`, {
            params: { dataset: dataset, gene: gene },
        });
        return response;
    } catch (error) {
        console.error("Error getGeneChromosome:", error);
        throw error;
    }
};

export const getSnpChromosome = async (dataset, snp) => {
    try {
        const response = await axios.get(`${QTL_URL}/getsnpchromosome`, {
            params: { dataset: dataset, snp: snp },
        });
        return response;
    } catch (error) {
        console.error("Error getSnpChromosome:", error);
        throw error;
    }
};

export const getGeneCellTypes = async (dataset, gene) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgenecelltypes`, {
            params: { dataset: dataset, gene: gene },
        });
        return response;
    } catch (error) {
        console.error("Error getGeneCellTypes:", error);
        throw error;
    }
};

export const getSnpCellTypes = async (dataset, snp) => {
    try {
        const response = await axios.get(`${QTL_URL}/getsnpcelltypes`, {
            params: { dataset: dataset, snp: snp },
        });
        return response;
    } catch (error) {
        console.error("Error getSnpCellTypes:", error);
        throw error;
    }
};

export const getSnpDataForGene = async (dataset, gene, celltype) => {
    try {
        const response = await axios.get(`${QTL_URL}/getsnpdataforgene`, {
            params: { dataset: dataset, gene: gene, celltype: celltype },
        });
        return response;
    } catch (error) {
        console.error("Error getSnpDataForGene:", error);
        throw error;
    }
};

export const getGeneDataForSnp = async (dataset, isCaQtl, snp, celltype) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgenedataforsnp`, {
            params: {
                dataset: dataset,
                is_caqtl: isCaQtl,
                snp: snp,
                celltype: celltype,
            },
        });
        return response;
    } catch (error) {
        console.error("Error getGeneDataForSnp:", error);
        throw error;
    }
};

export const getGeneLocationsInChromosome = async (
    dataset,
    chromosome,
    start,
    end,
) => {
    try {
        const response = await axios.get(
            `${QTL_URL}/getgenelocationsinchromosome`,
            {
                params: {
                    dataset: dataset,
                    chromosome: chromosome,
                    start: start,
                    end: end,
                },
            },
        );
        return response;
    } catch (error) {
        console.error("Error getGeneLocationsInChromosome:", error);
        throw error;
    }
};

export const getSnpLocationsInChromosome = async (
    dataset,
    chromosome,
    start,
    end,
) => {
    try {
        const response = await axios.get(
            `${QTL_URL}/getsnplocationsinchromosome`,
            {
                params: {
                    dataset: dataset,
                    chromosome: chromosome,
                    start: start,
                    end: end,
                },
            },
        );
        return response;
    } catch (error) {
        console.error("Error getSnpLocationsInChromosome:", error);
        throw error;
    }
};

export const getGwasDatasets = async (dataset) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgwasdatasets`, {
            params: { dataset: dataset },
        });
        return response;
    } catch (error) {
        console.error("Error getGwasDatasets:", error);
        throw error;
    }
};

export const getGwasInChromosome = async (
    dataset,
    gwas_dataset,
    chromosome,
    start,
    end,
) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgwasinchromosome`, {
            params: {
                dataset: dataset,
                gwas_dataset: gwas_dataset,
                chromosome: chromosome,
                start: start,
                end: end,
            },
        });
        return response;
    } catch (error) {
        console.error("Error getGwasInChromosome:", error);
        throw error;
    }
};

export const getGencodeVersion = async (dataset) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgencodeversion`, {
            params: { dataset: dataset },
        });
        console.log("Gencode version response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error getGencodeVersion:", error);
        throw error;
    }
};
