import { getRegionStore } from "ground-codes/src/index.ts";

const pendingLoads = new Map<string, Promise<void>>();
const regionLoadMetrics = {
  started: 0,
  completed: 0,
  failed: 0,
  deduped: 0,
  lastLoadedAt: null as string | null,
  byRegion: {} as Record<
    string,
    {
      started: number;
      completed: number;
      failed: number;
      deduped: number;
      lastDurationMs: number | null;
      lastLoadedAt: string | null;
    }
  >,
};

const getRegionMetrics = (regionName: string) =>
  (regionLoadMetrics.byRegion[regionName] ??= {
    started: 0,
    completed: 0,
    failed: 0,
    deduped: 0,
    lastDurationMs: null,
    lastLoadedAt: null,
  });

export const loadRegionDataset = async (regionName: string) => {
  let pendingLoad = pendingLoads.get(regionName);

  if (!pendingLoad) {
    const startedAt = performance.now();
    const regionMetrics = getRegionMetrics(regionName);

    regionLoadMetrics.started += 1;
    regionMetrics.started += 1;

    pendingLoad = (
      getRegionStore()
        ? Promise.resolve()
        : import("@ground-codes/geoint/src/index.ts").then(({ load }) =>
            load([regionName]),
          )
    )
      .then(() => {
        const loadedAt = new Date().toISOString();
        const durationMs =
          Math.round((performance.now() - startedAt) * 100) / 100;

        regionLoadMetrics.completed += 1;
        regionLoadMetrics.lastLoadedAt = loadedAt;
        regionMetrics.completed += 1;
        regionMetrics.lastDurationMs = durationMs;
        regionMetrics.lastLoadedAt = loadedAt;
      })
      .catch((error) => {
        regionLoadMetrics.failed += 1;
        regionMetrics.failed += 1;
        throw error;
      })
      .finally(() => pendingLoads.delete(regionName));
    pendingLoads.set(regionName, pendingLoad);
  } else {
    regionLoadMetrics.deduped += 1;
    getRegionMetrics(regionName).deduped += 1;
  }

  await pendingLoad;
};

export const getRegionLoadMetrics = () => ({
  ...regionLoadMetrics,
  inFlight: pendingLoads.size,
  byRegion: { ...regionLoadMetrics.byRegion },
});
