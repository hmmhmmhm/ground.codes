import type { CelestialBody } from "@/lib/map/celestial-bodies";

export type CesiumModule = typeof import("cesium");
export type CesiumViewer = import("cesium").Viewer;
export type CesiumEntity = import("cesium").Entity;
export type CesiumEventHandler = import("cesium").ScreenSpaceEventHandler;

const CESIUM_BASE_URL = "https://unpkg.com/cesium@1.141.0/Build/Cesium/";
const CESIUM_SCRIPT_URL = `${CESIUM_BASE_URL}Cesium.js`;

export const INITIAL_CAMERA_HEIGHT_METERS_BY_BODY: Record<
  Exclude<CelestialBody, "earth">,
  number
> = {
  moon: 6500000,
  mars: 9500000,
};
export const MIN_CAMERA_HEIGHT_METERS = 2000;
export const PLANETARY_GLOBE_MAXIMUM_SCREEN_SPACE_ERROR = 1;
export const PLANETARY_IMAGERY_TILE_SIZE = 2048;
export const MARS_IMAGERY_CONTRAST = 1.05;
export const MARS_IMAGERY_SATURATION = 1.08;
export const MARKER_ALTITUDE_METERS = 120;
export const PLANETARY_FALLBACK_LABELS: Record<
  Exclude<CelestialBody, "earth">,
  string
> = {
  moon: "USGS Moon imagery",
  mars: "USGS Mars imagery",
};

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const normalizeHeading = (heading: number) =>
  ((heading % 360) + 360) % 360;

export const getHeadingDelta = (a: number, b: number) => {
  const delta = Math.abs(normalizeHeading(a) - normalizeHeading(b));
  return Math.min(delta, 360 - delta);
};

export const getSignedHeadingDelta = (from: number, to: number) => {
  const delta = normalizeHeading(to) - normalizeHeading(from);
  if (delta > 180) return delta - 360;
  if (delta < -180) return delta + 360;
  return delta;
};

declare global {
  interface Window {
    Cesium?: CesiumModule;
    CESIUM_BASE_URL?: string;
  }
}

let cesiumLoadPromise: Promise<CesiumModule> | null = null;

export const loadCesium = () => {
  if (window.Cesium) return Promise.resolve(window.Cesium);
  if (cesiumLoadPromise) return cesiumLoadPromise;

  window.CESIUM_BASE_URL = CESIUM_BASE_URL;
  cesiumLoadPromise = new Promise<CesiumModule>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${CESIUM_SCRIPT_URL}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.Cesium) resolve(window.Cesium);
        else reject(new Error("Cesium script loaded without window.Cesium"));
      });
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Cesium script")),
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = CESIUM_SCRIPT_URL;
    script.onload = () => {
      if (window.Cesium) resolve(window.Cesium);
      else reject(new Error("Cesium script loaded without window.Cesium"));
    };
    script.onerror = () => reject(new Error("Failed to load Cesium script"));
    document.head.append(script);
  });

  return cesiumLoadPromise;
};

export const getAssetId = (body: Exclude<CelestialBody, "earth">) => {
  const value =
    body === "moon"
      ? process.env.NEXT_PUBLIC_CESIUM_MOON_ASSET_ID
      : process.env.NEXT_PUBLIC_CESIUM_MARS_ASSET_ID;
  const assetId = Number(value);
  return Number.isFinite(assetId) && assetId > 0 ? assetId : null;
};

export const getEllipsoid = (
  Cesium: CesiumModule,
  body: Exclude<CelestialBody, "earth">,
) => (body === "moon" ? Cesium.Ellipsoid.MOON : Cesium.Ellipsoid.MARS);

export const getScreenNorthHeading = (
  viewer: CesiumViewer,
  Cesium: CesiumModule,
  body: Exclude<CelestialBody, "earth">,
) => {
  const canvas = viewer.scene.canvas;
  const screenCenter = new Cesium.Cartesian2(
    canvas.clientWidth / 2,
    canvas.clientHeight / 2,
  );
  const ellipsoid = getEllipsoid(Cesium, body);
  const centerCartesian = viewer.camera.pickEllipsoid(screenCenter, ellipsoid);
  if (!centerCartesian) return null;

  const centerCartographic = Cesium.Cartographic.fromCartesian(
    centerCartesian,
    ellipsoid,
  );
  const northCartographic = new Cesium.Cartographic(
    centerCartographic.longitude,
    Math.min(
      Cesium.Math.toRadians(89.5),
      centerCartographic.latitude + Cesium.Math.toRadians(0.25),
    ),
    0,
  );
  const northCartesian = Cesium.Cartographic.toCartesian(
    northCartographic,
    ellipsoid,
  );
  const centerWindow = Cesium.SceneTransforms.worldToWindowCoordinates(
    viewer.scene,
    centerCartesian,
  );
  const northWindow = Cesium.SceneTransforms.worldToWindowCoordinates(
    viewer.scene,
    northCartesian,
  );
  if (!centerWindow || !northWindow) return null;

  const dx = northWindow.x - centerWindow.x;
  const dy = northWindow.y - centerWindow.y;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return null;

  return normalizeHeading((Math.atan2(dx, -dy) * 180) / Math.PI);
};
