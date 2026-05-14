export type CelestialBody = "earth" | "moon" | "mars";

export type PlanetaryBody = Exclude<CelestialBody, "earth">;

export type PlanetaryLayerConfig = {
  id: string;
  label: string;
  layer: string;
  attribution: string;
};

type PlanetaryBodyConfig = {
  body: PlanetaryBody;
  label: string;
  center: google.maps.LatLngLiteral;
  zoom: number;
  wmsBaseUrl: string;
  defaultLayerId: string;
  layers: [PlanetaryLayerConfig, ...PlanetaryLayerConfig[]];
};

type LegacyPlanetaryLayerConfig = {
  body: Exclude<CelestialBody, "earth">;
  label: string;
  center: google.maps.LatLngLiteral;
  zoom: number;
  wmsBaseUrl: string;
  layer: string;
  attribution: string;
};

export const BODY_OPTIONS: Array<{ body: CelestialBody; label: string }> = [
  { body: "earth", label: "Earth" },
  { body: "moon", label: "Moon" },
  { body: "mars", label: "Mars" },
];

export const EARTH_DEFAULT_VIEW = {
  center: { lat: 37.5665, lng: 126.978 },
  zoom: 18,
};

export const METERS_PER_DEGREE_BY_BODY: Record<CelestialBody, number> = {
  earth: 111000,
  moon: 30323,
  mars: 59158,
};

export const PLANETARY_BODY_CONFIGS: Record<
  PlanetaryBody,
  PlanetaryBodyConfig
> = {
  moon: {
    body: "moon",
    label: "Moon",
    center: { lat: 8.3487, lng: 30.8346 },
    zoom: 5,
    wmsBaseUrl:
      "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map",
    defaultLayerId: "KaguyaTC_Ortho",
    layers: [
      {
        id: "LROC_WAC",
        label: "LRO WAC Global Mosaic",
        layer: "LROC_WAC",
        attribution: "USGS Astrogeology / LRO WAC",
      },
      {
        id: "LOLA_color",
        label: "LOLA Color Relief",
        layer: "LOLA_color",
        attribution: "USGS Astrogeology / LOLA Color Relief",
      },
      {
        id: "LOLA_bw",
        label: "LOLA Grayscale Relief",
        layer: "LOLA_bw",
        attribution: "USGS Astrogeology / LOLA Grayscale Relief",
      },
      {
        id: "LOLA_Kaguya_Shade",
        label: "LOLA + Kaguya Relief",
        layer: "LOLA_Kaguya_Shade",
        attribution: "USGS Astrogeology / LOLA and Kaguya Relief",
      },
      {
        id: "KaguyaTC_Ortho",
        label: "Kaguya TC Ortho Mosaic",
        layer: "KaguyaTC_Ortho",
        attribution: "USGS Astrogeology / Kaguya TC",
      },
    ],
  },
  mars: {
    body: "mars",
    label: "Mars",
    center: { lat: 18.6528, lng: -133.8025 },
    zoom: 5,
    wmsBaseUrl:
      "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map",
    defaultLayerId: "MOLA_THEMIS_blend",
    layers: [
      {
        id: "MDIM21_color",
        label: "MDIM 2.1 Color Mosaic",
        layer: "MDIM21_color",
        attribution: "USGS Astrogeology / Mars MDIM 2.1",
      },
      {
        id: "MOLA_THEMIS_blend",
        label: "MOLA + THEMIS Blend",
        layer: "MOLA_THEMIS_blend",
        attribution: "USGS Astrogeology / MOLA and THEMIS",
      },
      {
        id: "THEMIS",
        label: "THEMIS IR Day",
        layer: "THEMIS",
        attribution: "USGS Astrogeology / THEMIS IR Day",
      },
      {
        id: "MOLA_color",
        label: "MOLA Color Relief",
        layer: "MOLA_color",
        attribution: "USGS Astrogeology / MOLA Color Relief",
      },
      {
        id: "MOLA_bw",
        label: "MOLA Grayscale Relief",
        layer: "MOLA_bw",
        attribution: "USGS Astrogeology / MOLA Grayscale Relief",
      },
      {
        id: "HRSC_MOLA_Blend_Hillshade",
        label: "HRSC + MOLA Relief",
        layer: "HRSC_MOLA_Blend_Hillshade",
        attribution: "USGS Astrogeology / HRSC and MOLA Relief",
      },
    ],
  },
};

export const PLANETARY_LAYER_CONFIGS: Record<
  PlanetaryBody,
  LegacyPlanetaryLayerConfig
> = {
  moon: {
    ...PLANETARY_BODY_CONFIGS.moon,
    layer: PLANETARY_BODY_CONFIGS.moon.layers[0].layer,
    attribution: PLANETARY_BODY_CONFIGS.moon.layers[0].attribution,
  },
  mars: {
    ...PLANETARY_BODY_CONFIGS.mars,
    layer: PLANETARY_BODY_CONFIGS.mars.layers[0].layer,
    attribution: PLANETARY_BODY_CONFIGS.mars.layers[0].attribution,
  },
};

export const parseCelestialBody = (
  value: string | null | undefined,
): CelestialBody => {
  if (value === "moon" || value === "mars" || value === "earth") {
    return value;
  }

  return "earth";
};

export const getDefaultViewForBody = (body: CelestialBody) => {
  if (body === "earth") return EARTH_DEFAULT_VIEW;

  const config = PLANETARY_BODY_CONFIGS[body];
  return {
    center: config.center,
    zoom: config.zoom,
  };
};

export const getDefaultPlanetaryLayerId = (body: PlanetaryBody) =>
  PLANETARY_BODY_CONFIGS[body].defaultLayerId;

export const getPlanetaryLayerConfig = (
  body: PlanetaryBody,
  layerId: string | null | undefined,
) => {
  const bodyConfig = PLANETARY_BODY_CONFIGS[body];
  return (
    bodyConfig.layers.find((layer) => layer.id === layerId) ??
    bodyConfig.layers.find((layer) => layer.id === bodyConfig.defaultLayerId) ??
    bodyConfig.layers[0]
  );
};

export const parsePlanetaryLayerId = (
  body: PlanetaryBody,
  layerId: string | null | undefined,
) => getPlanetaryLayerConfig(body, layerId).id;

const clampLatitude = (lat: number) =>
  Math.max(-85.05112878, Math.min(85.05112878, lat));

const tileXToLongitude = (x: number, zoom: number) =>
  (x / 2 ** zoom) * 360 - 180;

const tileYToLatitude = (y: number, zoom: number) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return clampLatitude((180 / Math.PI) * Math.atan(Math.sinh(n)));
};

export const createPlanetaryMapType = (
  body: PlanetaryBody,
  layerId?: string,
) => {
  const bodyConfig = PLANETARY_BODY_CONFIGS[body];
  const layerConfig = getPlanetaryLayerConfig(body, layerId);

  return new google.maps.ImageMapType({
    name: layerConfig.label,
    alt: `${bodyConfig.label} ${layerConfig.label} basemap`,
    minZoom: 1,
    maxZoom: 18,
    tileSize: new google.maps.Size(256, 256),
    getTileUrl: (coord, zoom) => {
      const scale = 2 ** zoom;
      const x = ((coord.x % scale) + scale) % scale;
      const y = Math.max(0, Math.min(scale - 1, coord.y));
      const west = tileXToLongitude(x, zoom);
      const east = tileXToLongitude(x + 1, zoom);
      const north = tileYToLatitude(y, zoom);
      const south = tileYToLatitude(y + 1, zoom);
      const params = new URLSearchParams({
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetMap",
        FORMAT: "image/jpeg",
        TRANSPARENT: "false",
        SRS: "EPSG:4326",
        STYLES: "",
        LAYERS: layerConfig.layer,
        WIDTH: "256",
        HEIGHT: "256",
        BBOX: `${west},${south},${east},${north}`,
      });

      return `${bodyConfig.wmsBaseUrl}&${params.toString()}`;
    },
  });
};
