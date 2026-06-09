import { create } from "zustand";

import { getServerConfig } from "../api/api.js";

// `allowRemoteDatasets` starts as null so that an older backend without a
// /serverconfig endpoint keeps the remote-dataset UI visible (backward
// compatible). The UI hides the feature only when the backend explicitly
// reports it as disabled.
const useServerConfigStore = create((set, get) => ({
    allowRemoteDatasets: null,
    remoteCapabilities: [],
    loaded: false,

    fetchServerConfig: async () => {
        if (get().loaded) return;
        try {
            const cfg = await getServerConfig();
            set({
                allowRemoteDatasets: !!cfg.allow_remote_datasets,
                remoteCapabilities: cfg.remote_capabilities || [],
                loaded: true,
            });
        } catch {
            set({ loaded: true });
        }
    },
}));

export default useServerConfigStore;
