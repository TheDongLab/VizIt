import { create } from "zustand";
import {getHomeData} from "../api/api.js";

const useHomeStore = create((set) => ({
  homeData: {},
  side: "outer",
  region: null,
  assays: [],
  selectedRegion: null,

  setSide: (newSide) => set(() => ({ side: newSide })),
  setRegion: (side, region, assays) => set({ selectedRegion: side, region, assays }),

  setHomeData: (homeData) => set(() => ({ homeData: homeData })),

  fetchHomeData: async () => {
    try {
      const response = await getHomeData();
      set({ homeData: response.data });
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  },


}));

export default useHomeStore;
