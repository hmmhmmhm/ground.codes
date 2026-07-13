import type { Locale } from "@/i18n";
import { getGroundCodeLanguage } from "@/lib/i18n/ground-code-language";
import {
  type CelestialBody,
  METERS_PER_DEGREE_BY_BODY,
  PLANETARY_LANDMARK_LABELS,
} from "@/lib/map/celestial-bodies";
import { PLANETARY_LANDMARK_LOCALIZED_LABELS } from "@/lib/map/planetary-landmark-labels";
import type { Coordinates } from "./types";
import {
  type CesiumModule,
  type CesiumViewer,
  getEllipsoid,
} from "./planetary-cesium";

const GRID_COLOR_ALPHA = 0.06;
const GRID_ALTITUDE_METERS = 1200;
const MAX_GRID_LINE_COUNT = 96;
const LANDMARK_LABEL_ALTITUDE_METERS = 6000;
const LANDMARK_LABEL_NEAR_DISTANCE_METERS = 100000;
const LANDMARK_LABEL_FAR_DISTANCE_METERS = 32000000;
const LANDMARK_LABEL_COLORS: Record<Exclude<CelestialBody, "earth">, string> = {
  moon: "#d8eefb",
  mars: "#ffd0a3",
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

export const createLandmarkLabels = (
  viewer: CesiumViewer,
  Cesium: CesiumModule,
  body: Exclude<CelestialBody, "earth">,
  locale: Locale,
) => {
  const ellipsoid = getEllipsoid(Cesium, body);
  const fillColor = Cesium.Color.fromCssColorString(
    LANDMARK_LABEL_COLORS[body],
  );
  const language = getGroundCodeLanguage(locale);
  const localizedLabels =
    PLANETARY_LANDMARK_LOCALIZED_LABELS[language]?.[body] ??
    PLANETARY_LANDMARK_LOCALIZED_LABELS.english?.[body] ??
    {};
  const distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
    LANDMARK_LABEL_NEAR_DISTANCE_METERS,
    LANDMARK_LABEL_FAR_DISTANCE_METERS,
  );
  const scaleByDistance = new Cesium.NearFarScalar(
    500000,
    1.02,
    14000000,
    0.72,
  );
  const translucencyByDistance = new Cesium.NearFarScalar(
    1200000,
    1,
    LANDMARK_LABEL_FAR_DISTANCE_METERS,
    0.72,
  );

  return PLANETARY_LANDMARK_LABELS[body].map((landmark) =>
    viewer.entities.add({
      id: `planetary-landmark-${body}-${landmark.id}`,
      position: Cesium.Cartesian3.fromDegrees(
        landmark.lng,
        landmark.lat,
        LANDMARK_LABEL_ALTITUDE_METERS,
        ellipsoid,
      ),
      point: {
        color: fillColor.withAlpha(0.82),
        distanceDisplayCondition,
        pixelSize: 5,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
        outlineWidth: 1,
        scaleByDistance,
        translucencyByDistance,
      },
      label: {
        text: localizedLabels[landmark.id] ?? landmark.name,
        fillColor,
        font: "600 12px sans-serif",
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.42),
        backgroundPadding: new Cesium.Cartesian2(7, 4),
        distanceDisplayCondition,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.9),
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        scaleByDistance,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        translucencyByDistance,
      },
    }),
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
    return { east: 180, north: 85, south: -85, step, west: -180 };
  }

  return {
    east: Math.min(180, snapUp(center.lng + span / 2, step)),
    north: Math.min(85, snapUp(center.lat + span / 2, step)),
    south: Math.max(-85, snapDown(center.lat - span / 2, step)),
    step,
    west: Math.max(-180, snapDown(center.lng - span / 2, step)),
  };
};

export const createGridEntities = (
  viewer: CesiumViewer,
  Cesium: CesiumModule,
  body: Exclude<CelestialBody, "earth">,
  selectedArea: Coordinates | null,
) => {
  const ellipsoid = getEllipsoid(Cesium, body);
  const cartographic = viewer.camera.positionCartographic;
  const cameraCenter = selectedArea ?? {
    lat: Cesium.Math.toDegrees(cartographic.latitude),
    lng: Cesium.Math.toDegrees(cartographic.longitude),
  };
  const bounds = getGridBounds(body, cameraCenter, cartographic.height);
  const color = Cesium.Color.WHITE.withAlpha(GRID_COLOR_ALPHA);
  const entities = [];

  for (const lat of createGridValues(bounds.south, bounds.north, bounds.step)) {
    const positions = createGridValues(
      bounds.west,
      bounds.east,
      bounds.step,
    ).map((lng) =>
      Cesium.Cartesian3.fromDegrees(lng, lat, GRID_ALTITUDE_METERS, ellipsoid),
    );
    entities.push(
      viewer.entities.add({
        polyline: { positions, width: 1, material: color },
      }),
    );
  }

  for (const lng of createGridValues(bounds.west, bounds.east, bounds.step)) {
    const positions = createGridValues(
      bounds.south,
      bounds.north,
      bounds.step,
    ).map((lat) =>
      Cesium.Cartesian3.fromDegrees(lng, lat, GRID_ALTITUDE_METERS, ellipsoid),
    );
    entities.push(
      viewer.entities.add({
        polyline: { positions, width: 1, material: color },
      }),
    );
  }

  return entities;
};
