import { useEffect, useRef, useState } from "react";
import { Coordinates } from "./types";

type Earth3DMapProps = {
  center: Coordinates;
};

type Maps3DLibrary = {
  Map3DElement: new (options: Record<string, unknown>) => HTMLElement & {
    center?: { lat: number; lng: number; altitude: number };
  };
  MapMode: {
    SATELLITE: string;
  };
};

const Earth3DMap = ({ center }: Earth3DMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<(HTMLElement & { center?: unknown }) | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container || !window.google?.maps?.importLibrary) return;

    const initialize = async () => {
      try {
        const { Map3DElement, MapMode } = (await google.maps.importLibrary(
          "maps3d",
        )) as unknown as Maps3DLibrary;

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
          mode: MapMode.SATELLITE,
          defaultUIHidden: true,
          gestureHandling: "GREEDY",
        });

        map3d.style.width = "100%";
        map3d.style.height = "100%";

        containerRef.current.replaceChildren(map3d);
        mapRef.current = map3d;
      } catch (error) {
        console.error("Failed to initialize 3D map:", error);
        if (!cancelled) setLoadFailed(true);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      mapRef.current = null;
      container.replaceChildren();
    };
  }, [center.lat, center.lng]);

  return (
    <div className="absolute inset-0 bg-black" ref={containerRef}>
      {loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
          3D map unavailable
        </div>
      )}
    </div>
  );
};

export default Earth3DMap;
