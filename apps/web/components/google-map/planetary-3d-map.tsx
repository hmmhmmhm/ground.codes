import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import {
  CelestialBody,
  getPlanetaryLayerConfig,
  METERS_PER_DEGREE_BY_BODY,
  PLANETARY_BODY_CONFIGS,
} from "@/lib/map/celestial-bodies";
import { Coordinates } from "./types";

type Planetary3DMapProps = {
  body: Exclude<CelestialBody, "earth">;
  center: Coordinates;
  encodedCoordinates: string;
  isEncoding: boolean;
  selectedArea: Coordinates | null;
  showGrid: boolean;
  setSelectedArea: Dispatch<SetStateAction<Coordinates | null>>;
};

type CesiumModule = typeof import("cesium");
type CesiumViewer = import("cesium").Viewer;
type CesiumEntity = import("cesium").Entity;
type CesiumEventHandler = import("cesium").ScreenSpaceEventHandler;

const CESIUM_BASE_URL = "https://unpkg.com/cesium@1.141.0/Build/Cesium/";
const CESIUM_SCRIPT_URL = `${CESIUM_BASE_URL}Cesium.js`;
const INITIAL_CAMERA_HEIGHT_METERS = 6500000;
const CLOSE_CAMERA_HEIGHT_METERS = 25;
const GRID_COLOR_ALPHA = 0.38;
const GRID_AXIS_ALPHA = 0.58;
const GRID_ALTITUDE_METERS = 1200;
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

declare global {
  interface Window {
    Cesium?: CesiumModule;
    CESIUM_BASE_URL?: string;
  }
}

let cesiumLoadPromise: Promise<CesiumModule> | null = null;

const loadCesium = () => {
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

const getAssetId = (body: Exclude<CelestialBody, "earth">) => {
  const value =
    body === "moon"
      ? process.env.NEXT_PUBLIC_CESIUM_MOON_ASSET_ID
      : process.env.NEXT_PUBLIC_CESIUM_MARS_ASSET_ID;
  const assetId = Number(value);
  return Number.isFinite(assetId) && assetId > 0 ? assetId : null;
};

const getEllipsoid = (
  Cesium: CesiumModule,
  body: Exclude<CelestialBody, "earth">,
) => (body === "moon" ? Cesium.Ellipsoid.MOON : Cesium.Ellipsoid.MARS);

const getGridStepDegrees = (
  body: Exclude<CelestialBody, "earth">,
  cameraHeight: number,
) => {
  if (cameraHeight > 6000000) return 15;
  if (cameraHeight > 2000000) return 5;
  if (cameraHeight > 600000) return 1;
  if (cameraHeight > 180000) return 0.25;
  if (cameraHeight > 60000) return 0.05;
  if (cameraHeight > 20000) return 0.01;
  if (cameraHeight > 5000) return 0.0025;
  if (cameraHeight > 1000) return 0.0005;
  if (cameraHeight > 250) return 0.0001;
  if (cameraHeight > 75) return 0.00005;

  return 3 / METERS_PER_DEGREE_BY_BODY[body];
};

const getGridSpanDegrees = (cameraHeight: number) => {
  if (cameraHeight > 6000000) return 180;
  if (cameraHeight > 2000000) return 70;
  if (cameraHeight > 600000) return 24;
  if (cameraHeight > 180000) return 8;
  if (cameraHeight > 60000) return 2;
  if (cameraHeight > 20000) return 0.5;
  if (cameraHeight > 5000) return 0.12;
  if (cameraHeight > 1000) return 0.02;
  if (cameraHeight > 250) return 0.005;
  if (cameraHeight > 75) return 0.002;
  return 0.0003;
};

const snapDown = (value: number, step: number) =>
  Math.floor(value / step) * step;

const snapUp = (value: number, step: number) => Math.ceil(value / step) * step;

const createGridValues = (start: number, end: number, step: number) => {
  const count = Math.max(0, Math.round((end - start) / step));
  return Array.from({ length: count + 1 }, (_, index) =>
    Number((start + index * step).toFixed(6)),
  );
};

const getGridBounds = (
  body: Exclude<CelestialBody, "earth">,
  center: Coordinates,
  cameraHeight: number,
) => {
  const step = getGridStepDegrees(body, cameraHeight);
  const span = getGridSpanDegrees(cameraHeight);

  return {
    east: Math.min(180, snapUp(center.lng + span / 2, step)),
    north: Math.min(85, snapUp(center.lat + span / 2, step)),
    south: Math.max(-85, snapDown(center.lat - span / 2, step)),
    step,
    west: Math.max(-180, snapDown(center.lng - span / 2, step)),
  };
};

const Planetary3DMap = ({
  body,
  center,
  encodedCoordinates,
  isEncoding,
  selectedArea,
  showGrid,
  setSelectedArea,
}: Planetary3DMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const handlerRef = useRef<CesiumEventHandler | null>(null);
  const cameraListenerRef = useRef<(() => void) | null>(null);
  const gridEntitiesRef = useRef<CesiumEntity[]>([]);
  const markerRef = useRef<CesiumEntity | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [usesFallback, setUsesFallback] = useState(false);
  const [gridRevision, setGridRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const initialize = async () => {
      try {
        const Cesium = await loadCesium();
        cesiumRef.current = Cesium;
        const ellipsoid = getEllipsoid(Cesium, body);
        Cesium.Ellipsoid.default = ellipsoid;

        if (cancelled || !containerRef.current) return;

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          navigationHelpButton: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          globe: new Cesium.Globe(ellipsoid),
          mapProjection: new Cesium.GeographicProjection(ellipsoid),
          terrainProvider: new Cesium.EllipsoidTerrainProvider({ ellipsoid }),
        });
        viewer.scene.globe.enableLighting = true;
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = false;
        }
        viewer.scene.fog.enabled = false;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 3;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance =
          INITIAL_CAMERA_HEIGHT_METERS * 3;

        const bodyConfig = PLANETARY_BODY_CONFIGS[body];
        const layerConfig = getPlanetaryLayerConfig(body, undefined);
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: bodyConfig.wmsBaseUrl,
            layers: layerConfig.layer,
            parameters: {
              format: "image/jpeg",
              transparent: false,
              styles: "",
            },
            tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid }),
          }),
        );

        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
        const assetId = getAssetId(body);
        if (ionToken && assetId) {
          try {
            Cesium.Ion.defaultAccessToken = ionToken;
            const tileset =
              await Cesium.Cesium3DTileset.fromIonAssetId(assetId);
            if (!cancelled) {
              viewer.scene.primitives.add(tileset);
              setUsesFallback(false);
            }
          } catch (error) {
            console.warn(
              `Failed to load Cesium ${body} asset ${assetId}; falling back to USGS imagery ellipsoid:`,
              getErrorMessage(error),
            );
            if (!cancelled) setUsesFallback(true);
          }
        } else {
          setUsesFallback(true);
        }

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            center.lng,
            center.lat,
            INITIAL_CAMERA_HEIGHT_METERS,
            ellipsoid,
          ),
        });

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(
          (movement: { position: import("cesium").Cartesian2 }) => {
            const picked =
              viewer.scene.pickPositionSupported &&
              viewer.scene.pickPosition(movement.position);
            const ellipsoidPicked = viewer.camera.pickEllipsoid(
              movement.position,
              ellipsoid,
            );
            const cartesian = picked || ellipsoidPicked;
            if (!cartesian) return;

            const cartographic = Cesium.Cartographic.fromCartesian(
              cartesian,
              ellipsoid,
            );
            setSelectedArea({
              lat: Cesium.Math.toDegrees(cartographic.latitude),
              lng: Cesium.Math.toDegrees(cartographic.longitude),
            });
          },
          Cesium.ScreenSpaceEventType.LEFT_CLICK,
        );

        viewerRef.current = viewer;
        handlerRef.current = handler;
        let lastGridRefresh = 0;
        cameraListenerRef.current = viewer.camera.changed.addEventListener(
          () => {
            const now = performance.now();
            if (now - lastGridRefresh < 500) return;

            lastGridRefresh = now;
            setGridRevision((revision) => revision + 1);
          },
        );
      } catch (error) {
        console.error("Failed to initialize planetary 3D map:", error);
        if (!cancelled) setLoadFailed(true);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      handlerRef.current?.destroy();
      handlerRef.current = null;
      cameraListenerRef.current?.();
      cameraListenerRef.current = null;
      viewerRef.current?.destroy();
      viewerRef.current = null;
      cesiumRef.current = null;
      gridEntitiesRef.current = [];
      markerRef.current = null;
      container.replaceChildren();
    };
  }, [body, center.lat, center.lng, setSelectedArea]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    gridEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
    gridEntitiesRef.current = [];
    if (!showGrid) return;

    const ellipsoid = getEllipsoid(Cesium, body);
    const cartographic = viewer.camera.positionCartographic;
    const cameraCenter = selectedArea ?? {
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      lng: Cesium.Math.toDegrees(cartographic.longitude),
    };
    const bounds = getGridBounds(body, cameraCenter, cartographic.height);
    const color = Cesium.Color.WHITE.withAlpha(GRID_COLOR_ALPHA);
    const axisColor = Cesium.Color.CYAN.withAlpha(GRID_AXIS_ALPHA);

    for (const lat of createGridValues(
      bounds.south,
      bounds.north,
      bounds.step,
    )) {
      const positions = createGridValues(bounds.west, bounds.east, bounds.step)
        .filter((_, index) => index % 4 === 0)
        .map((lng) =>
          Cesium.Cartesian3.fromDegrees(
            lng,
            lat,
            GRID_ALTITUDE_METERS,
            ellipsoid,
          ),
        );
      const entity = viewer.entities.add({
        polyline: {
          positions,
          width: Math.abs(lat) < bounds.step / 2 ? 2 : 1,
          material: Math.abs(lat) < bounds.step / 2 ? axisColor : color,
        },
      });
      gridEntitiesRef.current.push(entity);
    }

    for (const lng of createGridValues(bounds.west, bounds.east, bounds.step)) {
      const positions = createGridValues(
        bounds.south,
        bounds.north,
        bounds.step,
      )
        .filter((_, index) => index % 4 === 0)
        .map((lat) =>
          Cesium.Cartesian3.fromDegrees(
            lng,
            lat,
            GRID_ALTITUDE_METERS,
            ellipsoid,
          ),
        );
      const entity = viewer.entities.add({
        polyline: {
          positions,
          width: Math.abs(lng) < bounds.step / 2 ? 2 : 1,
          material: Math.abs(lng) < bounds.step / 2 ? axisColor : color,
        },
      });
      gridEntitiesRef.current.push(entity);
    }
  }, [body, gridRevision, selectedArea, showGrid]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    if (markerRef.current) {
      viewer.entities.remove(markerRef.current);
      markerRef.current = null;
    }
    if (!selectedArea) return;

    const ellipsoid = getEllipsoid(Cesium, body);
    markerRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        selectedArea.lng,
        selectedArea.lat,
        GRID_ALTITUDE_METERS,
        ellipsoid,
      ),
      point: {
        color: Cesium.Color.CYAN.withAlpha(0.9),
        pixelSize: 10,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.75),
        outlineWidth: 2,
      },
      label: {
        text:
          isEncoding || !encodedCoordinates
            ? "Encoding..."
            : encodedCoordinates,
        fillColor: Cesium.Color.WHITE,
        font: "13px sans-serif",
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        pixelOffset: new Cesium.Cartesian2(0, -24),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      },
    });

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selectedArea.lng,
        selectedArea.lat,
        CLOSE_CAMERA_HEIGHT_METERS,
        ellipsoid,
      ),
      duration: 0.8,
    });
  }, [body, encodedCoordinates, isEncoding, selectedArea]);

  return (
    <div className="absolute inset-0 bg-black" ref={containerRef}>
      {loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
          3D planetary map unavailable
        </div>
      )}
      {usesFallback && (
        <div className="absolute left-3 top-3 z-10 max-w-[320px] rounded-md border border-white/15 bg-black/50 px-3 py-2 text-xs text-white/75 backdrop-blur-md">
          Cesium ion Moon/Mars terrain is not configured. Showing 3D ellipsoid
          fallback with 2D imagery.
        </div>
      )}
      {selectedArea && (
        <div className="absolute left-1/2 bottom-[18px] z-10 w-[min(460px,calc(100%-24px))] -translate-x-1/2 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-sm text-white shadow-lg backdrop-blur-md">
          <div className="text-xs text-white/70">
            {selectedArea.lat.toFixed(6)}, {selectedArea.lng.toFixed(6)}
          </div>
          <div className="mt-1 break-words font-medium">
            {isEncoding ? "Encoding..." : encodedCoordinates}
          </div>
        </div>
      )}
    </div>
  );
};

export default Planetary3DMap;
