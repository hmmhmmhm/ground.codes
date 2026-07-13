import { useEffect } from "react";
import { parseGroundCodeSharePath } from "@/lib/code/share-url";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import {
  type CelestialBody,
  createPlanetaryMapType,
} from "@/lib/map/celestial-bodies";
import type { EarthMapType } from "./map-container-initial-state";

type UseMapPresentationOptions = {
  body: CelestialBody;
  center: google.maps.LatLngLiteral;
  clearAllGridLines: () => void;
  drawGrid: (map: google.maps.Map) => void;
  map: google.maps.Map | null;
  mapType: EarthMapType;
  planetaryLayerId: string;
  showGrid: boolean;
  zoom: number;
};

export const useMapPresentation = ({
  body,
  center,
  clearAllGridLines,
  drawGrid,
  map,
  mapType,
  planetaryLayerId,
  showGrid,
  zoom,
}: UseMapPresentationOptions) => {
  useEffect(() => {
    if (!map) return;

    if (body === "earth") {
      if (mapType === "earth3d" || mapType === "planetary3d") {
        clearAllGridLines();
        return;
      }
      map.setOptions({ clickableIcons: true });
      if (mapType === "roadmap") {
        map.setOptions({
          styles: googleMapDarkTheme,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });
      } else {
        map.setOptions({
          styles: [],
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.HYBRID],
          },
        });
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
      }
      return;
    }

    if (mapType === "planetary3d") {
      clearAllGridLines();
      return;
    }

    const planetaryMapType = createPlanetaryMapType(body, planetaryLayerId);
    map.mapTypes.set(body, planetaryMapType);
    map.setOptions({
      clickableIcons: false,
      styles: [],
      backgroundColor: "#050505",
      mapTypeControlOptions: { mapTypeIds: [body] },
    });
    map.setMapTypeId(body);
    if (showGrid) window.requestAnimationFrame(() => drawGrid(map));
  }, [
    body,
    clearAllGridLines,
    drawGrid,
    map,
    mapType,
    planetaryLayerId,
    showGrid,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (parseGroundCodeSharePath(window.location.pathname)) return;

    const params = new URLSearchParams(window.location.search);
    if (body === "earth") {
      params.delete("body");
      params.delete("layer");
      params.delete("lat");
      params.delete("lng");
      params.delete("zoom");
      if (mapType === "earth3d") {
        params.delete("map");
        params.delete("view");
      } else {
        params.delete("view");
        params.set("map", mapType);
      }
    } else {
      params.set("body", body);
      params.delete("map");
      params.delete("layer");
      params.set("lat", center.lat.toFixed(5));
      params.set("lng", center.lng.toFixed(5));
      params.set("zoom", String(zoom));
      params.set("view", mapType === "planetary3d" ? "3d" : "2d");
    }

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [body, center, mapType, zoom]);
};
