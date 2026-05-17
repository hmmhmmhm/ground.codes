import { ApiInputError } from "./api-error.js";
import { supportedLanguages } from "./language.js";

const supportedBodies = ["earth", "moon", "mars"] as const;

export type ApiLanguage = (typeof supportedLanguages)[number];
export type ApiBody = (typeof supportedBodies)[number];

const isFiniteNumber = (value: number) => Number.isFinite(value);

export const validateLanguage = (language: string): ApiLanguage => {
  if (supportedLanguages.includes(language as ApiLanguage)) {
    return language as ApiLanguage;
  }

  throw new ApiInputError(
    `Unsupported language "${language}". Use one of: ${supportedLanguages.join(", ")}.`,
  );
};

export const validateBody = (body: string): ApiBody => {
  if (supportedBodies.includes(body as ApiBody)) return body as ApiBody;

  throw new ApiInputError(
    `Unsupported body "${body}". Use one of: ${supportedBodies.join(", ")}.`,
  );
};

export const validateCoordinates = ({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) => {
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
    throw new ApiInputError("Latitude must be a finite number between -90 and 90.");
  }

  if (!isFiniteNumber(lng) || lng < -360 || lng > 360) {
    throw new ApiInputError(
      "Longitude must be a finite number between -360 and 360.",
    );
  }
};

export const validatePrecisionMeters = (precisionMeters?: number) => {
  if (precisionMeters === undefined) return;
  if (!isFiniteNumber(precisionMeters) || precisionMeters <= 0) {
    throw new ApiInputError("precisionMeters must be a positive number.");
  }
};

export const validateRegionLevel = ({
  body,
  regionLevel,
}: {
  body: ApiBody;
  regionLevel: number;
}) => {
  const allowed =
    body === "moon" ? [2] : body === "mars" ? [2, 3] : [1, 2, 3];
  if (!Number.isInteger(regionLevel) || !allowed.includes(regionLevel)) {
    throw new ApiInputError(
      `${body} supports regionLevel values: ${allowed.join(", ")}.`,
    );
  }
};

export const validateMaxResults = (maxResults: number) => {
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new ApiInputError("maxResults must be an integer between 1 and 100.");
  }
};

export const validateSearchQuery = (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) throw new ApiInputError("query is required.");
  if (trimmed.length > 160) {
    throw new ApiInputError("query must be 160 characters or fewer.");
  }
  return trimmed;
};
