type CelestialBody = "earth" | "moon" | "mars";

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

const getApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_GROUND_CODES_API_URL ?? "https://api.ground.codes")
    .replace(/\/+$/, "");

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
  precisionMeters = 3,
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
}: {
  query: string;
  language?: string;
  body?: CelestialBody;
  regionLevel?: number;
  maxResults?: number;
}): Promise<GroundCodeSearchResponse> => {
  const response = await postApi("/v1/search", {
    query,
    regionLevel,
    language,
    body,
    maxResults,
  });

  return await response.json();
};
