import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import {
  CelestialBody,
  getPlanetaryLayerConfig,
  METERS_PER_DEGREE_BY_BODY,
  PLANETARY_BODY_CONFIGS,
} from "@/lib/map/celestial-bodies";
import {
  DEFAULT_GROUND_CODE_PRECISION_METERS,
  formatPrecisionMeters,
} from "@/lib/code/ground-codes";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Coordinates } from "./types";

type Planetary3DMapProps = {
  body: Exclude<CelestialBody, "earth">;
  center: Coordinates;
  encodedCoordinates: string;
  isEncoding: boolean;
  mapHeading: number;
  onCameraHeadingChange: (heading: number) => void;
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
const INITIAL_CAMERA_HEIGHT_METERS_BY_BODY: Record<
  Exclude<CelestialBody, "earth">,
  number
> = {
  moon: 6500000,
  mars: 9500000,
};
const MIN_CAMERA_HEIGHT_METERS = 2000;
const PLANETARY_GLOBE_MAXIMUM_SCREEN_SPACE_ERROR = 1;
const PLANETARY_IMAGERY_TILE_SIZE = 2048;
const MARS_IMAGERY_CONTRAST = 1.05;
const MARS_IMAGERY_SATURATION = 1.08;
const GRID_COLOR_ALPHA = 0.06;
const GRID_ALTITUDE_METERS = 1200;
const MARKER_ALTITUDE_METERS = 120;
const MAX_GRID_LINE_COUNT = 96;
const PLANETARY_FALLBACK_LABELS: Record<
  Exclude<CelestialBody, "earth">,
  string
> = {
  moon: "USGS Moon imagery",
  mars: "USGS Mars imagery",
};
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const normalizeHeading = (heading: number) => ((heading % 360) + 360) % 360;

const getHeadingDelta = (a: number, b: number) => {
  const delta = Math.abs(normalizeHeading(a) - normalizeHeading(b));
  return Math.min(delta, 360 - delta);
};

const getSignedHeadingDelta = (from: number, to: number) => {
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

const getScreenNorthHeading = (
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

const getGridStepDegrees = (
  body: Exclude<CelestialBody, "earth">,
  cameraHeight: number,
) => {
  if (cameraHeight > 6000000) return 5;
  if (cameraHeight > 2000000) return 2.5;
  if (cameraHeight > 600000) return 0.5;
  if (cameraHeight > 180000) return 0.1;
  if (cameraHeight > 60000) return 0.025;
  if (cameraHeight > 20000) return 0.005;
  if (cameraHeight > 5000) return 0.001;
  if (cameraHeight > 1000) return 0.00025;
  if (cameraHeight > 250) return 0.0001;
  if (cameraHeight > 75) return 0.00005;

  return 3 / METERS_PER_DEGREE_BY_BODY[body];
};

const getGridSpanDegrees = (cameraHeight: number) => {
  if (cameraHeight > 6000000) return 360;
  if (cameraHeight > 2000000) return 140;
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

const normalizeGridStep = (step: number, span: number) => {
  let normalizedStep = step;
  while (span / normalizedStep > MAX_GRID_LINE_COUNT) {
    normalizedStep *= 2;
  }

  return normalizedStep;
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
  const span = getGridSpanDegrees(cameraHeight);
  const step = normalizeGridStep(getGridStepDegrees(body, cameraHeight), span);

  if (span >= 360) {
    return {
      east: 180,
      north: 85,
      south: -85,
      step,
      west: -180,
    };
  }

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
  mapHeading,
  onCameraHeadingChange,
  selectedArea,
  showGrid,
  setSelectedArea,
}: Planetary3DMapProps) => {
  const { t } = useI18n();
  const groundCodePrecisionLabel = t("map.coordinates.precision", {
    precision: formatPrecisionMeters(DEFAULT_GROUND_CODE_PRECISION_METERS),
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const handlerRef = useRef<CesiumEventHandler | null>(null);
  const cameraListenerRef = useRef<(() => void) | null>(null);
  const gridEntitiesRef = useRef<CesiumEntity[]>([]);
  const markerRef = useRef<CesiumEntity | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const mapHeadingRef = useRef(mapHeading);
  const appliedCompassHeadingRef = useRef(0);
  const headingSyncIntervalRef = useRef<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [usesIonAsset, setUsesIonAsset] = useState(false);
  const [gridRevision, setGridRevision] = useState(0);

  useEffect(() => {
    mapHeadingRef.current = mapHeading;
  }, [mapHeading]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const initialize = async () => {
      try {
        setUsesIonAsset(false);
        const Cesium = await loadCesium();
        cesiumRef.current = Cesium;
        const ellipsoid = getEllipsoid(Cesium, body);
        Cesium.Ellipsoid.default = ellipsoid;

        if (cancelled || !containerRef.current) return;

        const initialCameraHeight = INITIAL_CAMERA_HEIGHT_METERS_BY_BODY[body];
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
          // Render at native device pixel ratio so mobile 3D planets and grid lines stay crisp.
          useBrowserRecommendedResolution: false,
          globe: new Cesium.Globe(ellipsoid),
          mapProjection: new Cesium.GeographicProjection(ellipsoid),
          terrainProvider: new Cesium.EllipsoidTerrainProvider({ ellipsoid }),
        });
        viewer.camera.percentageChanged = 0.001;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.maximumScreenSpaceError =
          PLANETARY_GLOBE_MAXIMUM_SCREEN_SPACE_ERROR;
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = false;
        }
        viewer.scene.fog.enabled = false;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance =
          MIN_CAMERA_HEIGHT_METERS;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance =
          initialCameraHeight * 3;

        const bodyConfig = PLANETARY_BODY_CONFIGS[body];
        const layerConfig = getPlanetaryLayerConfig(body, undefined);
        viewer.imageryLayers.removeAll();
        const createWmsProvider = (layers: string) =>
          new Cesium.WebMapServiceImageryProvider({
            url: bodyConfig.wmsBaseUrl,
            layers,
            parameters: {
              format: "image/jpeg",
              transparent: false,
              styles: "",
            },
            tileHeight: PLANETARY_IMAGERY_TILE_SIZE,
            tileWidth: PLANETARY_IMAGERY_TILE_SIZE,
            tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid }),
          });

        const baseImageryLayer = viewer.imageryLayers.addImageryProvider(
          createWmsProvider(layerConfig.layer),
        );
        if (body === "mars") {
          baseImageryLayer.contrast = MARS_IMAGERY_CONTRAST;
          baseImageryLayer.saturation = MARS_IMAGERY_SATURATION;
        }

        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
        const assetId = getAssetId(body);
        if (ionToken && assetId) {
          try {
            Cesium.Ion.defaultAccessToken = ionToken;
            const tileset =
              await Cesium.Cesium3DTileset.fromIonAssetId(assetId);
            if (!cancelled) {
              viewer.scene.primitives.add(tileset);
              setUsesIonAsset(true);
            }
          } catch (error) {
            console.warn(
              `Failed to load Cesium ${body} asset ${assetId}; falling back to USGS imagery ellipsoid:`,
              getErrorMessage(error),
            );
          }
        }

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            center.lng,
            center.lat,
            initialCameraHeight,
            ellipsoid,
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
          },
        });
        appliedCompassHeadingRef.current = 0;
        if (mapHeadingRef.current !== 0) {
          viewer.camera.twistRight(
            Cesium.Math.toRadians(mapHeadingRef.current),
          );
          appliedCompassHeadingRef.current = mapHeadingRef.current;
        }

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
        setGridRevision((revision) => revision + 1);
        let lastGridRefresh = 0;
        let lastHeadingRefresh = 0;
        cameraListenerRef.current = viewer.camera.changed.addEventListener(
          () => {
            const now = performance.now();
            if (now - lastHeadingRefresh >= 80) {
              lastHeadingRefresh = now;
              const nextHeading = getScreenNorthHeading(viewer, Cesium, body);
              if (
                nextHeading !== null &&
                getHeadingDelta(
                  appliedCompassHeadingRef.current,
                  nextHeading,
                ) >= 0.5
              ) {
                appliedCompassHeadingRef.current = nextHeading;
                mapHeadingRef.current = nextHeading;
                onCameraHeadingChange(nextHeading);
              }
            }

            if (now - lastGridRefresh < 500) return;

            lastGridRefresh = now;
            setGridRevision((revision) => revision + 1);
          },
        );
        headingSyncIntervalRef.current = window.setInterval(() => {
          if (!viewer.isDestroyed()) {
            const nextHeading = getScreenNorthHeading(viewer, Cesium, body);
            if (
              nextHeading !== null &&
              getHeadingDelta(appliedCompassHeadingRef.current, nextHeading) >=
                0.5
            ) {
              appliedCompassHeadingRef.current = nextHeading;
              mapHeadingRef.current = nextHeading;
              onCameraHeadingChange(nextHeading);
            }
          }
        }, 160);
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
      if (headingSyncIntervalRef.current !== null) {
        window.clearInterval(headingSyncIntervalRef.current);
        headingSyncIntervalRef.current = null;
      }
      viewerRef.current?.destroy();
      viewerRef.current = null;
      cesiumRef.current = null;
      gridEntitiesRef.current = [];
      markerRef.current = null;
      container.replaceChildren();
    };
  }, [body, center.lat, center.lng, onCameraHeadingChange, setSelectedArea]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    const delta = getSignedHeadingDelta(
      appliedCompassHeadingRef.current,
      mapHeading,
    );
    if (Math.abs(delta) < 0.01) return;

    viewer.camera.twistRight(Cesium.Math.toRadians(delta));
    const nextHeading = normalizeHeading(mapHeading);
    appliedCompassHeadingRef.current = nextHeading;
    mapHeadingRef.current = nextHeading;
  }, [mapHeading]);

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

    for (const lat of createGridValues(
      bounds.south,
      bounds.north,
      bounds.step,
    )) {
      const positions = createGridValues(
        bounds.west,
        bounds.east,
        bounds.step,
      ).map((lng) =>
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
          width: 1,
          material: color,
        },
      });
      gridEntitiesRef.current.push(entity);
    }

    for (const lng of createGridValues(bounds.west, bounds.east, bounds.step)) {
      const positions = createGridValues(
        bounds.south,
        bounds.north,
        bounds.step,
      ).map((lat) =>
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
          width: 1,
          material: color,
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
    const markerLabel =
      isEncoding || !encodedCoordinates ? "Encoding..." : encodedCoordinates;
    markerRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        selectedArea.lng,
        selectedArea.lat,
        MARKER_ALTITUDE_METERS,
        ellipsoid,
      ),
      point: {
        color: Cesium.Color.fromCssColorString("#f97316").withAlpha(0.96),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        pixelSize: 15,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.95),
        outlineWidth: 3,
        scaleByDistance: new Cesium.NearFarScalar(2000, 1.15, 6500000, 0.72),
      },
      label: {
        text: `${markerLabel}\n${groundCodePrecisionLabel}`,
        fillColor: Cesium.Color.WHITE,
        font: "600 13px sans-serif",
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.58),
        backgroundPadding: new Cesium.Cartesian2(12, 8),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(0, -58),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }, [
    body,
    encodedCoordinates,
    groundCodePrecisionLabel,
    isEncoding,
    selectedArea,
  ]);

  return (
    <div
      className={`planetary-3d-map absolute inset-0 bg-black ${selectedArea ? "has-selected-area" : ""} ${usesIonAsset ? "" : "hide-cesium-ion-credit"}`}
    >
      <div className="absolute inset-0" ref={containerRef} />
      {loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
          3D planetary map unavailable
        </div>
      )}
      <div
        className={`absolute left-3 z-10 rounded-md border border-white/15 bg-black/45 px-2 py-1 text-[11px] text-white/70 backdrop-blur-md ${
          selectedArea
            ? "bottom-[calc(86px+env(safe-area-inset-bottom,0px))]"
            : "bottom-3"
        }`}
      >
        {PLANETARY_FALLBACK_LABELS[body]}
      </div>
    </div>
  );
};

export default Planetary3DMap;
