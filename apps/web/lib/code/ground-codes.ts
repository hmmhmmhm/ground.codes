type CelestialBody = "earth" | "moon" | "mars";

export const DEFAULT_GROUND_CODE_PRECISION_METERS = 3;

export const formatPrecisionMeters = (precisionMeters: number) => {
  if (Number.isInteger(precisionMeters)) return `${precisionMeters}m`;
  return `${precisionMeters.toFixed(2).replace(/\.?0+$/, "")}m`;
};

export interface GroundCodeSearchResult {
  type: "ground-code" | "region" | "coordinates" | string;
  label: string;
  lat: number;
  lng: number;
  code?: string;
  body: CelestialBody | string;
  regionLevel: number;
}

export interface GroundCodeSearchResponse {
  query: string;
  results: GroundCodeSearchResult[];
}

const getApiBaseUrl = () => {
  const configuredApiUrl = process.env.NEXT_PUBLIC_GROUND_CODES_API_URL?.trim();
  return (configuredApiUrl || "https://api.ground.codes").replace(/\/+$/, "");
};

const postApi = async (path: string, body: unknown) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error("Ground Codes API request failed");
  return response;
};

const postApiTextWithFallback = async (
  primaryPath: string,
  fallbackPath: string,
  body: unknown,
) => {
  try {
    const response = await postApi(primaryPath, body);
    return await response.text();
  } catch (primaryError) {
    console.warn("Ground Codes primary API request failed:", primaryError);
    const response = await postApi(fallbackPath, body);
    return await response.text();
  }
};

/**
 * Encodes a set of coordinates into a ground code.
 */
export const encode = async ({
  lat,
  lng,
  language = "english",
  precisionMeters = DEFAULT_GROUND_CODE_PRECISION_METERS,
  body = "earth",
}: {
  lat: number;
  lng: number;
  language?: string;
  precisionMeters?: number;
  body?: CelestialBody;
}) => {
  return await postApiTextWithFallback("/v1/encode", "/encode", {
    lat,
    lng,
    regionLevel: 2,
    language,
    precisionMeters,
    body,
  });
};

export const searchGroundCodes = async ({
  query,
  language = "english",
  body = "earth",
  regionLevel = 2,
  maxResults = 5,
  biasLat,
  biasLng,
}: {
  query: string;
  language?: string;
  body?: CelestialBody;
  regionLevel?: number;
  maxResults?: number;
  biasLat?: number;
  biasLng?: number;
}): Promise<GroundCodeSearchResponse> => {
  const response = await postApi("/v1/search", {
    query,
    regionLevel,
    language,
    body,
    maxResults,
    ...(biasLat !== undefined && biasLng !== undefined
      ? { biasLat, biasLng }
      : {}),
  });

  return await response.json();
};
