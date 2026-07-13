import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import {
  type CelestialBody,
  getPlanetaryLayerConfig,
  PLANETARY_BODY_CONFIGS,
} from "@/lib/map/celestial-bodies";
import {
  DEFAULT_GROUND_CODE_PRECISION_METERS,
  formatPrecisionMeters,
} from "@/lib/code/ground-codes";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  type CesiumEntity,
  type CesiumEventHandler,
  type CesiumModule,
  type CesiumViewer,
  getAssetId,
  getEllipsoid,
  getErrorMessage,
  getHeadingDelta,
  getScreenNorthHeading,
  getSignedHeadingDelta,
  INITIAL_CAMERA_HEIGHT_METERS_BY_BODY,
  loadCesium,
  MARKER_ALTITUDE_METERS,
  MARS_IMAGERY_CONTRAST,
  MARS_IMAGERY_SATURATION,
  MIN_CAMERA_HEIGHT_METERS,
  normalizeHeading,
  PLANETARY_FALLBACK_LABELS,
  PLANETARY_GLOBE_MAXIMUM_SCREEN_SPACE_ERROR,
  PLANETARY_IMAGERY_TILE_SIZE,
} from "./planetary-cesium";
import { createGridEntities, createLandmarkLabels } from "./planetary-grid";
import type { Coordinates } from "./types";

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
  const { locale, t } = useI18n();
  const groundCodePrecisionLabel = t("map.coordinates.precision", {
    precision: formatPrecisionMeters(DEFAULT_GROUND_CODE_PRECISION_METERS),
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const handlerRef = useRef<CesiumEventHandler | null>(null);
  const cameraListenerRef = useRef<(() => void) | null>(null);
  const gridEntitiesRef = useRef<CesiumEntity[]>([]);
  const landmarkEntitiesRef = useRef<CesiumEntity[]>([]);
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
        landmarkEntitiesRef.current = createLandmarkLabels(
          viewer,
          Cesium,
          body,
          locale,
        );

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
      landmarkEntitiesRef.current = [];
      markerRef.current = null;
      container.replaceChildren();
    };
  }, [
    body,
    center.lat,
    center.lng,
    locale,
    onCameraHeadingChange,
    setSelectedArea,
  ]);

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

    gridEntitiesRef.current = createGridEntities(
      viewer,
      Cesium,
      body,
      selectedArea,
    );
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
