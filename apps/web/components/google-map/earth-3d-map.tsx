import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Coordinates } from "./types";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  DEFAULT_GROUND_CODE_PRECISION_METERS,
  formatPrecisionMeters,
} from "@/lib/code/ground-codes";
import {
  appendGrid,
  getGridSignature,
  getGridViewport,
  INITIAL_CAMERA_RANGE_METERS,
  type Map3DElementInstance,
} from "./earth-3d-grid";

type Earth3DMapProps = {
  center: Coordinates;
  encodedCoordinates: string;
  isEncoding: boolean;
  mapHeading: number;
  onCameraHeadingChange: (heading: number) => void;
  selectedArea: Coordinates | null;
  showGrid: boolean;
  setSelectedArea: Dispatch<SetStateAction<Coordinates | null>>;
  userLocation: Coordinates | null;
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

const USER_LOCATION_CAMERA_RANGE_METERS = 25;

const getMarkerLabel = (isEncoding: boolean, encodedCoordinates: string) =>
  isEncoding || !encodedCoordinates ? "Encoding..." : encodedCoordinates;

const normalizeHeading = (heading: number) => ((heading % 360) + 360) % 360;

const getHeadingDelta = (a: number, b: number) => {
  const delta = Math.abs(normalizeHeading(a) - normalizeHeading(b));
  return Math.min(delta, 360 - delta);
};

const Earth3DMap = ({
  center,
  encodedCoordinates,
  isEncoding,
  mapHeading,
  onCameraHeadingChange,
  selectedArea,
  showGrid,
  setSelectedArea,
  userLocation,
}: Earth3DMapProps) => {
  const { t } = useI18n();
  const groundCodePrecisionLabel = t("map.coordinates.precision", {
    precision: formatPrecisionMeters(DEFAULT_GROUND_CODE_PRECISION_METERS),
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const maps3dRef = useRef<Maps3DLibrary | null>(null);
  const mapRef = useRef<Map3DElementInstance | null>(null);
  const gridRef = useRef<HTMLElement[]>([]);
  const markerRef = useRef<HTMLElement | null>(null);
  const markerPopoverRef = useRef<PopoverElementInstance | null>(null);
  const userLocationMarkerRef = useRef<HTMLElement | null>(null);
  const appliedHeadingRef = useRef(mapHeading);
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
    const map3d = mapRef.current;
    if (!map3d) return;

    const normalizedHeading = normalizeHeading(mapHeading);
    if (getHeadingDelta(appliedHeadingRef.current, normalizedHeading) < 0.5) {
      return;
    }

    map3d.heading = normalizedHeading;
    appliedHeadingRef.current = normalizedHeading;
  }, [mapHeading]);

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
          const heading = normalizeHeading(map3d.heading ?? 0);
          if (getHeadingDelta(appliedHeadingRef.current, heading) >= 0.5) {
            appliedHeadingRef.current = heading;
            onCameraHeadingChange(heading);
          }
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
  }, [center.lat, center.lng, onCameraHeadingChange, setSelectedArea]);

  useEffect(() => {
    if (!mapReady) return;

    const interval = window.setInterval(() => {
      const map3d = mapRef.current;
      if (!map3d) return;

      const heading = normalizeHeading(map3d.heading ?? 0);
      if (getHeadingDelta(appliedHeadingRef.current, heading) < 0.5) return;

      appliedHeadingRef.current = heading;
      onCameraHeadingChange(heading);
    }, 120);

    return () => window.clearInterval(interval);
  }, [mapReady, onCameraHeadingChange]);

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
    content.style.minWidth = "180px";
    content.style.padding = "10px 12px";
    content.style.wordBreak = "break-word";
    content.style.fontSize = "13px";
    content.style.fontWeight = "600";
    content.style.lineHeight = "1.35";
    const label = document.createElement("div");
    label.textContent = markerLabel;
    const precision = document.createElement("div");
    precision.style.marginTop = "2px";
    precision.style.fontSize = "11px";
    precision.style.fontWeight = "500";
    precision.style.opacity = "0.72";
    precision.textContent = groundCodePrecisionLabel;
    content.append(label, precision);
    popover.append(content);
    map3d.append(popover);
    markerPopoverRef.current = popover;
  }, [
    encodedCoordinates,
    groundCodePrecisionLabel,
    isEncoding,
    mapReady,
    selectedArea,
  ]);

  useEffect(() => {
    if (!markerRef.current || !markerPopoverRef.current) return;

    const markerLabel = getMarkerLabel(isEncoding, encodedCoordinates);
    markerRef.current.setAttribute("title", markerLabel);
    const content = markerPopoverRef.current
      .firstElementChild as HTMLElement | null;
    const label = content?.firstElementChild;
    const precision = content?.lastElementChild;
    if (label) {
      label.textContent = markerLabel;
    }
    if (precision && precision !== label) {
      precision.textContent = groundCodePrecisionLabel;
    }
    markerPopoverRef.current.open = true;
  }, [encodedCoordinates, groundCodePrecisionLabel, isEncoding]);

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
    <div className="earth-3d-map absolute inset-0 bg-black" ref={containerRef}>
      {loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
          3D map unavailable
        </div>
      )}
    </div>
  );
};

export default Earth3DMap;
