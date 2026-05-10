import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Coordinates } from "./types";

type Earth3DMapProps = {
  center: Coordinates;
  encodedCoordinates: string;
  isEncoding: boolean;
  selectedArea: Coordinates | null;
  showGrid: boolean;
  setSelectedArea: Dispatch<SetStateAction<Coordinates | null>>;
};

type Map3DElementInstance = HTMLElement & {
  center?: { lat: number; lng: number; altitude?: number };
};

type Maps3DLibrary = {
  AltitudeMode: {
    CLAMP_TO_GROUND?: string;
    RELATIVE_TO_GROUND?: string;
  };
  Map3DElement: new (options: Record<string, unknown>) => Map3DElementInstance;
  MapMode: {
    HYBRID: string;
    SATELLITE: string;
  };
  Polyline3DElement: new (options: Record<string, unknown>) => HTMLElement;
};

type LocationClickEventLike = Event & {
  position?: { lat?: number; lng?: number; altitude?: number };
};

const GRID_STEP_DEGREES = 15;

const createLatitudePath = (lat: number) =>
  Array.from({ length: 73 }, (_, index) => ({
    lat,
    lng: -180 + index * 5,
  }));

const createLongitudePath = (lng: number) =>
  Array.from({ length: 37 }, (_, index) => ({
    lat: -90 + index * 5,
    lng,
  }));

const appendGrid = (map3d: Map3DElementInstance, maps3d: Maps3DLibrary) => {
  const overlays: HTMLElement[] = [];
  const altitudeMode =
    maps3d.AltitudeMode.CLAMP_TO_GROUND ??
    maps3d.AltitudeMode.RELATIVE_TO_GROUND;

  for (let lat = -75; lat <= 75; lat += GRID_STEP_DEGREES) {
    const line = new maps3d.Polyline3DElement({
      path: createLatitudePath(lat),
      strokeColor: lat === 0 ? "#8FD3FF" : "#EAF2FF",
      strokeWidth: lat === 0 ? 3 : 2,
      outerColor: "#101820",
      outerWidth: 0.25,
      altitudeMode,
      drawsOccludedSegments: false,
    });
    map3d.append(line);
    overlays.push(line);
  }

  for (let lng = -180; lng < 180; lng += GRID_STEP_DEGREES) {
    const line = new maps3d.Polyline3DElement({
      path: createLongitudePath(lng),
      strokeColor: lng === 0 ? "#8FD3FF" : "#EAF2FF",
      strokeWidth: lng === 0 ? 3 : 2,
      outerColor: "#101820",
      outerWidth: 0.25,
      altitudeMode,
      drawsOccludedSegments: false,
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
}: Earth3DMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const maps3dRef = useRef<Maps3DLibrary | null>(null);
  const mapRef = useRef<Map3DElementInstance | null>(null);
  const gridRef = useRef<HTMLElement[]>([]);
  const markerRef = useRef<HTMLElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

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
          range: 32000000,
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
      markerRef.current?.remove();
      markerRef.current = null;
      maps3dRef.current = null;
      mapRef.current = null;
      setMapReady(false);
      container.replaceChildren();
    };
  }, [center.lat, center.lng, setSelectedArea]);

  useEffect(() => {
    const map3d = mapRef.current;
    const maps3d = maps3dRef.current;
    if (!map3d || !maps3d) return;

    gridRef.current.forEach((overlay) => overlay.remove());
    gridRef.current = showGrid ? appendGrid(map3d, maps3d) : [];
  }, [mapReady, showGrid]);

  useEffect(() => {
    const map3d = mapRef.current;
    const maps3d = maps3dRef.current;
    if (!map3d || !maps3d) return;

    markerRef.current?.remove();
    markerRef.current = null;
    if (!selectedArea) return;

    const marker = document.createElement("gmp-marker-3d");
    marker.setAttribute(
      "position",
      `${selectedArea.lat},${selectedArea.lng},0`,
    );
    marker.setAttribute("label", "Ground Code");
    map3d.append(marker);
    markerRef.current = marker;
  }, [mapReady, selectedArea]);

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
