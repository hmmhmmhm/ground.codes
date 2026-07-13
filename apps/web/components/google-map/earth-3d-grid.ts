export type Map3DElementInstance = HTMLElement & {
  center?: { lat: number; lng: number; altitude?: number };
  flyCameraTo?: (options: Record<string, unknown>) => void;
  heading?: number;
  range?: number;
  tilt?: number;
};

const GRID_ALTITUDE_METERS = 1200;
export const INITIAL_CAMERA_RANGE_METERS = 32000000;
const METER_GRID_STEP_DEGREES = 0.000027;
const GRID_AXIS_COLOR = "rgba(32, 214, 255, 0.58)";
const GRID_LINE_COLOR = "rgba(255, 255, 255, 0.42)";
const GRID_OUTER_COLOR = "rgba(16, 24, 32, 0.38)";

type GridViewport = {
  east: number;
  north: number;
  range: number;
  south: number;
  span: number;
  step: number;
  west: number;
};

const getGridStepDegrees = (range: number) => {
  if (range > 18000000) return 15;
  if (range > 6000000) return 5;
  if (range > 2000000) return 1;
  if (range > 600000) return 0.25;
  if (range > 180000) return 0.05;
  if (range > 60000) return 0.01;
  if (range > 20000) return 0.0025;
  if (range > 5000) return 0.001;
  if (range > 1000) return 0.0005;
  if (range > 250) return 0.0001;
  if (range > 75) return 0.00005;
  return METER_GRID_STEP_DEGREES;
};

const getGridSpanDegrees = (range: number) => {
  if (range > 18000000) return 180;
  if (range > 6000000) return 70;
  if (range > 2000000) return 24;
  if (range > 600000) return 8;
  if (range > 180000) return 2;
  if (range > 60000) return 0.5;
  if (range > 20000) return 0.12;
  if (range > 5000) return 0.04;
  if (range > 1000) return 0.02;
  if (range > 250) return 0.005;
  if (range > 75) return 0.002;
  return 0.0003;
};

const getLocationValue = (
  value: unknown,
  fallback: number,
  names: string[],
) => {
  if (!value || typeof value !== "object") return fallback;

  for (const name of names) {
    const maybeValue = (value as Record<string, unknown>)[name];
    if (typeof maybeValue === "number") return maybeValue;
  }

  return fallback;
};

const snapDown = (value: number, step: number) =>
  Math.floor(value / step) * step;

const snapUp = (value: number, step: number) => Math.ceil(value / step) * step;

const formatGridCoordinate = (value: number) =>
  Number(value.toFixed(6)).toString();

const createGridValues = (start: number, end: number, step: number) => {
  const count = Math.max(0, Math.round((end - start) / step));
  return Array.from({ length: count + 1 }, (_, index) =>
    Number((start + index * step).toFixed(6)),
  );
};

export const getGridViewport = (map3d: Map3DElementInstance): GridViewport => {
  const range = map3d.range ?? INITIAL_CAMERA_RANGE_METERS;
  const step = getGridStepDegrees(range);
  const span = getGridSpanDegrees(range);
  const centerLat = getLocationValue(map3d.center, 0, ["lat", "kC", "pC"]);
  const centerLng = getLocationValue(map3d.center, 0, ["lng", "lC", "qC"]);

  return {
    east: Math.min(180, snapUp(centerLng + span / 2, step)),
    north: Math.min(85, snapUp(centerLat + span / 2, step)),
    range,
    south: Math.max(-85, snapDown(centerLat - span / 2, step)),
    span,
    step,
    west: Math.max(-180, snapDown(centerLng - span / 2, step)),
  };
};

export const getGridSignature = ({
  east,
  north,
  range,
  south,
  step,
  west,
}: GridViewport) =>
  [step, Math.round(range / 10), south, north, west, east].join(":");

const createLatitudePath = (lat: number, west: number, east: number) => {
  const segmentCount = Math.max(4, Math.min(96, Math.ceil((east - west) / 2)));
  return Array.from({ length: segmentCount + 1 }, (_, index) => ({
    lat,
    lng: west + ((east - west) * index) / segmentCount,
    altitude: GRID_ALTITUDE_METERS,
  }));
};

const createLongitudePath = (lng: number, south: number, north: number) => {
  const segmentCount = Math.max(
    4,
    Math.min(96, Math.ceil((north - south) / 2)),
  );
  return Array.from({ length: segmentCount + 1 }, (_, index) => ({
    lat: south + ((north - south) * index) / segmentCount,
    lng,
    altitude: GRID_ALTITUDE_METERS,
  }));
};

const serializeGridPath = (path: ReturnType<typeof createLatitudePath>) =>
  path
    .map(
      ({ altitude, lat, lng }) =>
        `${formatGridCoordinate(lat)},${formatGridCoordinate(lng)},${formatGridCoordinate(altitude)}`,
    )
    .join(" ");

const createGridLine = ({
  isAxis,
  path,
  strokeWidth,
}: {
  isAxis: boolean;
  path: ReturnType<typeof createLatitudePath>;
  strokeWidth: number;
}) => {
  const line = document.createElement("gmp-polyline-3d");
  line.setAttribute("path", serializeGridPath(path));
  line.setAttribute("stroke-color", isAxis ? GRID_AXIS_COLOR : GRID_LINE_COLOR);
  line.setAttribute(
    "stroke-width",
    String(isAxis ? strokeWidth + 2 : strokeWidth),
  );
  line.setAttribute("outer-color", GRID_OUTER_COLOR);
  line.setAttribute("outer-width", "1");
  line.setAttribute("altitude-mode", "relative-to-ground");
  line.setAttribute("draws-occluded-segments", "");
  return line;
};

export const appendGrid = (map3d: Map3DElementInstance) => {
  const overlays: HTMLElement[] = [];
  const { east, north, range, south, step, west } = getGridViewport(map3d);
  const strokeWidth = range > 2000000 ? 2 : 3;

  for (const lat of createGridValues(south, north, step)) {
    const line = createGridLine({
      isAxis: Math.abs(lat) < step / 2,
      path: createLatitudePath(lat, west, east),
      strokeWidth,
    });
    map3d.append(line);
    overlays.push(line);
  }

  for (const lng of createGridValues(west, east, step)) {
    const line = createGridLine({
      isAxis: Math.abs(lng) < step / 2,
      path: createLongitudePath(lng, south, north),
      strokeWidth,
    });
    map3d.append(line);
    overlays.push(line);
  }

  return overlays;
};
