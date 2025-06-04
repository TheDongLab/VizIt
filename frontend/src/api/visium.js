import axios from "axios";

const BASE_URL = "http://localhost:8000";
// const BASE_URL = "http://10.168.236.29:8000"; // Replace with your backend URL

const VISIUM_URL = `${BASE_URL}/visium`;


export const getCoordinates = async (dataset,sample) => {
    try {
        const response = await axios.get(`${VISIUM_URL}/getcoordinates`,
            {params: {dataset: dataset, sample: sample}});
        return response;
    } catch (error) {
        console.error("Error getCoordinates: ", error);
        throw error;
    }
}


export const getImage = async (dataset,sample) => {
    try {
        const response = await axios.get(`${VISIUM_URL}/getimage`,
            {params: {dataset: dataset, sample: sample}, responseType: 'blob'});
        return response;
    } catch (error) {
        console.error("Error reading image data:", error);
        throw error;
    }
}

export const getVisiumDefaults = async (dataset) => {
    try {
        const response = await axios.get(`${VISIUM_URL}/getvisiumdefaults`,
            {params: {dataset: dataset}});
        return response;
    } catch (error) {
        console.error("Error reading image data:", error);
        throw error;
    }

}