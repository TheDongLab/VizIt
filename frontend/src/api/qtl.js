import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Replace with your backend URL
// const BASE_URL = "http://10.168.236.29:8000"; // Replace with your backend URL

const QTL_URL = `${BASE_URL}/qtl`;

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
