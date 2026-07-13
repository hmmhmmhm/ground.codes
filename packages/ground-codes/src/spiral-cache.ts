export type Shell = {
  points: [number, number][];
  indexByCoordinate: Map<string, number>;
};

export type BigIntShell = {
  points: [bigint, bigint][];
  indexByCoordinate: Map<string, bigint>;
};

export let spiralCacheEnabled = false;
export const latticePointCountCache = new Map<number, number>();
export const shellCache = new Map<number, Shell>();
export const bigIntLatticePointCountCache = new Map<bigint, bigint>();
export const bigIntShellCache = new Map<bigint, BigIntShell>();

export function setSpiralCacheEnabled(enabled: boolean): void {
  spiralCacheEnabled = enabled;
  if (!enabled) clearSpiralCache();
}

export function isSpiralCacheEnabled(): boolean {
  return spiralCacheEnabled;
}

export function clearSpiralCache(): void {
  latticePointCountCache.clear();
  shellCache.clear();
  bigIntLatticePointCountCache.clear();
  bigIntShellCache.clear();
}
