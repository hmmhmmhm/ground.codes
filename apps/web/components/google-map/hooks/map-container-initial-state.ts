import { parseGroundCodeSharePath } from "@/lib/code/share-url";
import {
  type CelestialBody,
  getDefaultPlanetaryLayerId,
  getDefaultViewForBody,
  parseCelestialBody,
} from "@/lib/map/celestial-bodies";

export const libraries: "places"[] = ["places"];
export type EarthMapType = "roadmap" | "satellite" | "earth3d" | "planetary3d";

const getMapTypeFromCookie = (): EarthMapType => {
  try {
    if (typeof window === "undefined") return "roadmap";

    const params = new URLSearchParams(window.location.search);
    const queryBody = parseCelestialBody(params.get("body"));
    const queryMapType = params.get("map") ?? params.get("view");
    if (
      queryMapType === "planetary3d" ||
      (queryMapType === "3d" && queryBody !== "earth")
    ) {
      return "planetary3d";
    }
    if (
      queryMapType === "earth3d" ||
      (queryMapType === "3d" && queryBody === "earth")
    ) {
      return "earth3d";
    }
    if (queryMapType === "satellite") return "satellite";
    if (queryMapType === "roadmap" || queryMapType === "2d") return "roadmap";

    const cookieMapTypeMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("MAP_TYPE="));

    const cookieMapType = cookieMapTypeMatch
      ? cookieMapTypeMatch.split("=")[1]
      : undefined;

    if (
      cookieMapType &&
      (cookieMapType === "roadmap" ||
        cookieMapType === "satellite" ||
        cookieMapType === "earth3d" ||
        cookieMapType === "planetary3d")
    ) {
      return cookieMapType;
    }

    return "roadmap";
  } catch (error) {
    console.error("Error getting map type from cookie:", error);
    return "roadmap";
  }
};

export const getDefaultMapTypeForBody = (body: CelestialBody): EarthMapType =>
  body === "earth" ? "earth3d" : "planetary3d";

export const getInitialMapType = (body: CelestialBody): EarthMapType => {
  try {
    if (typeof window === "undefined") return getDefaultMapTypeForBody(body);

    const params = new URLSearchParams(window.location.search);
    if (params.has("map") || params.has("view")) {
      return getMapTypeFromCookie();
    }

    return getDefaultMapTypeForBody(body);
  } catch (error) {
    console.error("Error getting initial map type:", error);
    return getDefaultMapTypeForBody(body);
  }
};

export const getInitialBody = (): CelestialBody => {
  if (typeof window === "undefined") return "earth";
  const sharedCode = parseGroundCodeSharePath(window.location.pathname);
  if (sharedCode) return sharedCode.body;

  return parseCelestialBody(
    new URLSearchParams(window.location.search).get("body"),
  );
};

export const getInitialPlanetaryLayerId = (body: CelestialBody) => {
  if (body === "earth") return getDefaultPlanetaryLayerId("moon");

  return getDefaultPlanetaryLayerId(body);
};

export const getInitialCenter = (
  body: CelestialBody,
): google.maps.LatLngLiteral => {
  const defaultView = getDefaultViewForBody(body);
  if (typeof window === "undefined") return defaultView.center;

  const params = new URLSearchParams(window.location.search);
  if (!params.has("lat") || !params.has("lng")) return defaultView.center;

  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

  return defaultView.center;
};

export const getInitialZoom = (body: CelestialBody): number => {
  const defaultView = getDefaultViewForBody(body);
  if (typeof window === "undefined") return defaultView.zoom;

  const params = new URLSearchParams(window.location.search);
  if (!params.has("zoom")) return defaultView.zoom;

  const zoom = Number(params.get("zoom"));
  return Number.isFinite(zoom) ? zoom : defaultView.zoom;
};
