import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Replace with your backend URL
// const BASE_URL = "http://10.168.236.29:8000"; // Replace with your backend URL

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

export const getCellTypesForGene = async (dataset, gene) => {
    try {
        const response = await axios.get(`${QTL_URL}/getcelltypesforgene`, {
            params: { dataset: dataset, gene: gene },
        });
        return response;
    } catch (error) {
        console.error("Error getCellTypesForGene:", error);
        throw error;
    }
};

export const getCellTypesForSnp = async (dataset, snp) => {
    try {
        const response = await axios.get(`${QTL_URL}/getcelltypesforsnp`, {
            params: { dataset: dataset, snp: snp },
        });
        return response;
    } catch (error) {
        console.error("Error getCellTypesForSnp:", error);
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

export const getGeneDataForSnp = async (dataset, snp, celltype) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgenedataforsnp`, {
            params: { dataset: dataset, snp: snp, celltype: celltype },
        });
        return response;
    } catch (error) {
        console.error("Error getGeneDataForSnp:", error);
        throw error;
    }
};

export const getGeneLocationsInChromosome = async (dataset, chromosome) => {
    try {
        const response = await axios.get(`${QTL_URL}/getgenelocationsinchromosome`, {
            params: { dataset: dataset, chromosome: chromosome },
        });
        return response;
    } catch (error) {
        console.error("Error getGeneLocationsInChromosome:", error);
        throw error;
    }
}

export const getSnpLocationsInChromosome = async (dataset, chromosome) => {
    try {
        const response = await axios.get(`${QTL_URL}/getsnplocationsinchromosome`, {
            params: { dataset: dataset, chromosome: chromosome },
        });
        return response;
    } catch (error) {
        console.error("Error getSnpLocationsInChromosome:", error);
        throw error;
    }
};
