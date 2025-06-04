import {create} from "zustand";

const userStore = create((set) => ({
  user: null, // Holds the logged-in user data
  token: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null, token: null }),
}));

export default userStore;
