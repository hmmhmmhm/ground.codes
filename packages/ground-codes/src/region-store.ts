import type { RegionStore } from "./region-types.js";

let configuredRegionStore: RegionStore | null = null;

export const setRegionStore = (store: RegionStore | null) => {
  configuredRegionStore = store;
};

export const getRegionStore = () => configuredRegionStore;
