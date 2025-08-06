import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BASE_URL}/api`;

export const getHomeData = async () => {
    try {
        const response = await axios.get(`${API_URL}/gethomedata`);
        return response;
    } catch (error) {
        console.error("Error getHomeData:", error);
        throw error;
    }
}

export const getGeneList = async (dataset,query_str) => {
    try {
        const response = await axios.get(`${API_URL}/getgenelist`,
            {params: {dataset:dataset,query_str:query_str}});
        return response;
    } catch (error) {
        console.error("Error getGeneList:", error);
        throw error;
    }
}

export const getSampleList = async (dataset,query_str) => {
    try {
        const response = await axios.get(`${API_URL}/getsamplelist`,
            {params: {dataset:dataset,query_str:query_str}});
        return response;
    } catch (error) {
        console.error("Error getSampleList:", error);
        throw error;
    }
}

export const getMetaList = async (dataset,query_str) => {
    try {
        const response = await axios.get(`${API_URL}/getmetalist`,
            {params: {dataset:dataset,query_str:query_str}});
        return response;
    } catch (error) {
        console.error("Error getMetaList:", error);
        throw error;
    }
}

export const getMainClusterInfo = async (dataset) => {
    try {
        const response = await axios.get(`${API_URL}/getmainclusterinfo`,
            {params: {dataset:dataset}});
        return response;
    } catch (error) {
        console.error("Error getMainClusterInfo:", error);
        throw error;
    }
}

export const getClusterList = async (dataset) => {
    try {
        const response = await axios.get(`${API_URL}/getclusterlist`,
            {params: {dataset:dataset}});
        return response;
    } catch (error) {
        console.error("Error getClusterList:", error);
        throw error;
    }
}

export const getCellCounts = async (dataset) => {
    try {
        const response = await axios.get(`${API_URL}/getcellcounts`,
            {params: {dataset:dataset}});
        return response;
    } catch (error) {
        console.error("Error getCellCounts:", error);
        throw error;
    }
}

export const getUMAPData = async (dataset) => {
    try {
        const response = await axios.get(`${API_URL}/getumapembedding`,
            {params: {dataset:dataset}});
        return response;
    } catch (error) {
        console.error("Error getUMAPData:", error);
        throw error;
    }
}

export const getExprData = async (dataset,gene) => {
    try {
        const response = await axios.get(`${API_URL}/getexprdata`,
            {params: {dataset:dataset,gene:gene}});
        return response;
    } catch (error) {
        console.error("Error getExprData:", error);
        throw error;
    }
}

export const getPseudoExprData = async (dataset,gene) => {
    try {
        const response = await axios.get(`${API_URL}/getpseudoexprdata`,
            {params: {dataset:dataset,gene:gene}});
        return response;
    } catch (error) {
        console.error("Error getPseudoExprData:", error);
        throw error;
    }
}

export const getMetaDataOfSample = async (dataset, sample) => {
    try {
        const response = await axios.get(`${API_URL}/getmetadataofsample`,
            {params: {dataset:dataset, sample:sample}});
        return response;
    } catch (error) {
        console.error("Error getMetaDataOfSample:", error);
        throw error;
    }
}

export const getAllSampleMetaData = async (dataset) => {
    try {
        const response = await axios.get(`${API_URL}/getallsamplemetadata`,
            {params: {dataset:dataset}});
        return response;
    } catch (error) {
        console.error("Error getAllSampleMetaData:", error);
        throw error;
    }
}


export const getAllMetaData = async (dataset_id="all", cols=["all"], rows=["all"]) => {
    try {
        const response = await axios.get(`${API_URL}/getallmetadata`,
            {params: {dataset_id: dataset_id, cols: cols,  rows: rows}});
        return response;
    } catch (error) {
        console.error("Error getAllMetaData:", error);
        throw error;
    }
}


export const getMarkerGenes = async (dataset) => {
    try {
        const response = await axios.get(`${API_URL}/getmarkergenes`,
            {params: {dataset:dataset}});
        return response;
    } catch (error) {
        console.error("Error getMarkerGenes:", error);
        throw error;
    }
}

export const getDEGsOfCluster = async (dataset,cluster) => {
    try {
        const response = await axios.get(`${API_URL}/getdegsofcluster`,
            {params: {dataset:dataset,cluster:cluster}});
        return response;
    } catch (error) {
        console.error("Error getDEGsOfCluster:", error);
        throw error;
    }
}


export const getDatatable_get = async (data_id="all") => {
    try {
        const response = await axios.get(`${API_URL}/getdatatable/${data_id}`);
        return response;
    } catch (error) {
        console.error("Error reading data records:", error);
        throw error;
    }
}

export const getSampletable_get = async (conditions) => {
    // console.log(conditions);
    try {
        const response = await axios.get(`${API_URL}/getsampletable`, {params: conditions});
        return response;
    } catch (error) {
        console.error("Error reading sample records:", error);
        throw error;
    }
}

export const getDatasetList = async (dataset_id="all") => {
    try {
        const response = await axios.get(`${API_URL}/getdatasetlist/${dataset_id}`);
        return response;
    } catch (error) {
        console.error("Error reading dataset records:", error);
        throw error;
    }
}