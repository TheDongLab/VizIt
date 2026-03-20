import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const SIGNAL_URL = `${BASE_URL}/signal`;

export const getBWDataExists = async (dataset) => {
    try {
        const response = await axios.get(`${SIGNAL_URL}/getbwdataexists`, {
            params: { dataset: dataset },
        });
        return response;
    } catch (error) {
        console.error("Error getBWDataExists:", error);
        throw error;
    }
};

export const getRegionSignalData = async (
    dataset,
    chromosome,
    start,
    end,
    celltype,
    binSize,
    strand = null,
) => {
    try {
        const response = await axios.get(`${SIGNAL_URL}/getregionsignaldata`, {
            params: {
                dataset,
                chromosome,
                start,
                end,
                celltype,
                binsize: binSize,
                ...(strand ? { strand } : {}),
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error getRegionSignalData:", error);
        throw error;
    }
};

export const getCellTypeList = async (dataset) => {
    try {
        const response = await axios.get(
            `${SIGNAL_URL}/getbigwigcelltypelist`,
            {
                params: { dataset: dataset },
            },
        );
        return response;
    } catch (error) {
        console.error("Error getCellTypeList:", error);
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
            `${SIGNAL_URL}/getgenelocationsinchromosome`,
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

export const getGeneList = async (dataset, query_str) => {
    try {
        const response = await axios.get(`${SIGNAL_URL}/getgenelist`, {
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
        const response = await axios.get(`${SIGNAL_URL}/getsnplist`, {
            params: { dataset: dataset, query_str: query_str },
        });
        return response;
    } catch (error) {
        console.error("Error getSnpList:", error);
        throw error;
    }
};

export const getExonStructureInChromosome = async (
    dataset,
    chromosome,
    start,
    end,
) => {
    try {
        const response = await axios.get(
            `${SIGNAL_URL}/getexonstructureinchromosome`,
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
        console.error("Error getExonStructureInChromosome:", error);
        throw error;
    }
};

export const getGwasDatasets = async (dataset) => {
    try {
        const response = await axios.get(`${SIGNAL_URL}/getgwasdatasets`, {
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
        const response = await axios.get(`${SIGNAL_URL}/getgwasinchromosome`, {
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
        const response = await axios.get(`${SIGNAL_URL}/getgencodeversion`, {
            params: { dataset: dataset },
        });
        console.log("Gencode version response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error getGencodeVersion:", error);
        throw error;
    }
};
