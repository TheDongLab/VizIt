import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const SIGNAL_URL = `${BASE_URL}/signal`;

export const getRegionSignalData = async (
  dataset,
  chromosome,
  start,
  end,
  celltype,
  binSize,
) => {
  try {
    const response = await axios.get(`${SIGNAL_URL}/getregionsignaldata`, {
      params: {
        dataset: dataset,
        chromosome: chromosome,
        start: start,
        end: end,
        celltype: celltype,
        binsize: binSize,
      },
    });
    return response;
  } catch (error) {
    console.error("Error getRegionSignalData:", error);
    throw error;
  }
};

export const getCellTypeList = async (dataset) => {
  try {
    const response = await axios.get(`${SIGNAL_URL}/getcelltypelist`, {
      params: { dataset: dataset },
    });
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

export const getGwasInChromosome = async (dataset, chromosome, start, end) => {
  try {
    const response = await axios.get(`${SIGNAL_URL}/getgwasinchromosome`, {
      params: {
        dataset: dataset,
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
