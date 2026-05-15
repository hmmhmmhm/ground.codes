import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Coordinates } from "./types";

type Earth3DMapProps = {
  center: Coordinates;
  encodedCoordinates: string;
  isEncoding: boolean;
  selectedArea: Coordinates | null;
  showGrid: boolean;
  setSelectedArea: Dispatch<SetStateAction<Coordinates | null>>;
  userLocation: Coordinates | null;
};

type Map3DElementInstance = HTMLElement & {
  center?: { lat: number; lng: number; altitude?: number };
  flyCameraTo?: (options: Record<string, unknown>) => void;
  range?: number;
  tilt?: number;
};

type PopoverElementInstance = HTMLElement & {
  open?: boolean;
  positionAnchor?: unknown;
};

type Maps3DLibrary = {
  AltitudeMode: {
    ABSOLUTE?: string;
    CLAMP_TO_GROUND?: string;
    RELATIVE_TO_GROUND?: string;
  };
  Map3DElement: new (options: Record<string, unknown>) => Map3DElementInstance;
  MapMode: {
    HYBRID: string;
    SATELLITE: string;
  };
};

type LocationClickEventLike = Event & {
  position?: { lat?: number; lng?: number; altitude?: number };
};

const GRID_ALTITUDE_METERS = 1200;
const INITIAL_CAMERA_RANGE_METERS = 32000000;
const USER_LOCATION_CAMERA_RANGE_METERS = 25;
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

const getMarkerLabel = (isEncoding: boolean, encodedCoordinates: string) =>
  isEncoding || !encodedCoordinates ? "Encoding..." : encodedCoordinates;

const createGridValues = (start: number, end: number, step: number) => {
  const count = Math.max(0, Math.round((end - start) / step));
  return Array.from({ length: count + 1 }, (_, index) =>
    Number((start + index * step).toFixed(6)),
  );
};

const getGridViewport = (map3d: Map3DElementInstance): GridViewport => {
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

const getGridSignature = ({
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

const appendGrid = (map3d: Map3DElementInstance) => {
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

const Earth3DMap = ({
  center,
  encodedCoordinates,
  isEncoding,
  selectedArea,
  showGrid,
  setSelectedArea,
  userLocation,
}: Earth3DMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const maps3dRef = useRef<Maps3DLibrary | null>(null);
  const mapRef = useRef<Map3DElementInstance | null>(null);
  const gridRef = useRef<HTMLElement[]>([]);
  const markerRef = useRef<HTMLElement | null>(null);
  const markerPopoverRef = useRef<PopoverElementInstance | null>(null);
  const userLocationMarkerRef = useRef<HTMLElement | null>(null);
  const showGridRef = useRef(showGrid);
  const gridSignatureRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const redrawGrid = (force = false) => {
    const map3d = mapRef.current;
    if (!map3d) return;

    if (!showGridRef.current) {
      gridRef.current.forEach((overlay) => overlay.remove());
      gridRef.current = [];
      gridSignatureRef.current = null;
      return;
    }

    const viewport = getGridViewport(map3d);
    const signature = getGridSignature(viewport);
    if (!force && signature === gridSignatureRef.current) return;

    gridRef.current.forEach((overlay) => overlay.remove());
    gridRef.current = appendGrid(map3d);
    gridSignatureRef.current = signature;
  };

  useEffect(() => {
    showGridRef.current = showGrid;
  }, [showGrid]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container || !window.google?.maps?.importLibrary) return;

    const initialize = async () => {
      try {
        const maps3d = (await google.maps.importLibrary(
          "maps3d",
        )) as unknown as Maps3DLibrary;
        const { Map3DElement, MapMode } = maps3d;

        if (cancelled || !containerRef.current) return;

        const map3d = new Map3DElement({
          center: {
            lat: center.lat,
            lng: center.lng,
            altitude: 0,
          },
          range: INITIAL_CAMERA_RANGE_METERS,
          tilt: 0,
          heading: 0,
          mode: MapMode.HYBRID,
          defaultUIHidden: true,
          gestureHandling: "GREEDY",
        });

        map3d.style.width = "100%";
        map3d.style.height = "100%";
        map3d.addEventListener("gmp-click", (event) => {
          const position = (event as LocationClickEventLike).position;
          if (
            typeof position?.lat !== "number" ||
            typeof position?.lng !== "number"
          ) {
            return;
          }

          setSelectedArea({ lat: position.lat, lng: position.lng });
        });
        map3d.addEventListener("steadychange", () => {
          if (!map3d.isConnected) return;

          redrawGrid();
        });

        containerRef.current.replaceChildren(map3d);
        maps3dRef.current = maps3d;
        mapRef.current = map3d;
        setMapReady(true);
      } catch (error) {
        console.error("Failed to initialize 3D map:", error);
        if (!cancelled) setLoadFailed(true);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      gridRef.current.forEach((overlay) => overlay.remove());
      gridRef.current = [];
      gridSignatureRef.current = null;
      markerRef.current?.remove();
      markerRef.current = null;
      markerPopoverRef.current?.remove();
      markerPopoverRef.current = null;
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      maps3dRef.current = null;
      mapRef.current = null;
      setMapReady(false);
      container.replaceChildren();
    };
  }, [center.lat, center.lng, setSelectedArea]);

  useEffect(() => {
    redrawGrid(true);
  }, [mapReady, showGrid]);

  useEffect(() => {
    if (!mapReady || !showGrid) return;

    const interval = window.setInterval(() => redrawGrid(), 600);
    return () => window.clearInterval(interval);
  }, [mapReady, showGrid]);

  useEffect(() => {
    const map3d = mapRef.current;
    const maps3d = maps3dRef.current;
    if (!map3d || !maps3d) return;

    markerRef.current?.remove();
    markerRef.current = null;
    markerPopoverRef.current?.remove();
    markerPopoverRef.current = null;
    if (!selectedArea) return;

    const markerPosition = {
      lat: selectedArea.lat,
      lng: selectedArea.lng,
      altitude: 0,
    };
    const marker = document.createElement("gmp-marker-3d-interactive");
    const markerLabel = getMarkerLabel(isEncoding, encodedCoordinates);
    marker.setAttribute(
      "position",
      `${markerPosition.lat},${markerPosition.lng},${markerPosition.altitude}`,
    );
    marker.setAttribute("altitude-mode", "clamp-to-ground");
    marker.setAttribute("label", markerLabel);
    marker.setAttribute("title", markerLabel);
    map3d.append(marker);
    markerRef.current = marker;

    const popover = document.createElement(
      "gmp-popover",
    ) as PopoverElementInstance;
    popover.setAttribute("altitude-mode", "clamp-to-ground");
    popover.setAttribute("light-dismiss-disabled", "");
    popover.setAttribute("open", "");
    popover.open = true;
    popover.positionAnchor = marker;
    const content = document.createElement("div");
    content.style.maxWidth = "280px";
    content.style.wordBreak = "break-word";
    content.style.fontSize = "13px";
    content.style.fontWeight = "600";
    content.style.lineHeight = "1.35";
    content.textContent = markerLabel;
    popover.append(content);
    map3d.append(popover);
    markerPopoverRef.current = popover;
  }, [encodedCoordinates, isEncoding, mapReady, selectedArea]);

  useEffect(() => {
    if (!markerRef.current || !markerPopoverRef.current) return;

    const markerLabel = getMarkerLabel(isEncoding, encodedCoordinates);
    markerRef.current.setAttribute("label", markerLabel);
    markerRef.current.setAttribute("title", markerLabel);
    const content = markerPopoverRef.current.firstElementChild;
    if (content) {
      content.textContent = markerLabel;
    } else {
      markerPopoverRef.current.textContent = markerLabel;
    }
    markerPopoverRef.current.open = true;
  }, [encodedCoordinates, isEncoding]);

  useEffect(() => {
    const map3d = mapRef.current;
    if (!map3d) return;

    userLocationMarkerRef.current?.remove();
    userLocationMarkerRef.current = null;
    if (!userLocation) return;

    const marker = document.createElement("gmp-marker-3d");
    marker.setAttribute(
      "position",
      `${userLocation.lat},${userLocation.lng},0`,
    );
    marker.setAttribute("label", "My Location");
    map3d.append(marker);
    userLocationMarkerRef.current = marker;

    const endCamera = {
      center: {
        lat: userLocation.lat,
        lng: userLocation.lng,
        altitude: 0,
      },
      range: USER_LOCATION_CAMERA_RANGE_METERS,
      tilt: 45,
      heading: 0,
    };
    if (map3d.flyCameraTo) {
      map3d.flyCameraTo({
        endCamera,
        durationMillis: 1800,
      });
    } else {
      map3d.center = endCamera.center;
      map3d.range = endCamera.range;
      map3d.tilt = endCamera.tilt;
    }
    setSelectedArea({
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
  }, [mapReady, setSelectedArea, userLocation]);

  return (
    <div className="absolute inset-0 bg-black" ref={containerRef}>
      {loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
          3D map unavailable
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

export default Earth3DMap;
