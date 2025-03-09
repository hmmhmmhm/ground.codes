import { findClosestRegion, findRegionByCodeOrName } from "./region.js";
import {
  calculateCoordinateDiff,
  reconstructCoordinateDiff,
} from "./spherical.js";
import { getCoordinates, getNFromCoordinates } from "./spiral.js";
import {
  decodeByWordSet,
  encodeByWordSet,
  SupportedLanguage,
} from "./wordset.js";

/**
 * Encodes a target point based on a center point using the spiral algorithm.
 *
 * @param {Object} options - The options object.
 * @param {Object} options.center - The center point {lat, lng}.
 * @param {Object} options.target - The target point {lat, lng}.
 * @returns {string} The encoded string.
 */
export const encode = async (
  target: { lat: number; lng: number },
  options?: {
    center?: { lat: number; lng: number };
    regionLevel?: number;
    precisionMeters?: number;
    language?: SupportedLanguage;
  }
) => {
  let { center, precisionMeters, regionLevel, language } = options ?? {};

  let code: string | null = null;
  let encoded = "";

  // If center is provided, encode based on the center
  if (!center) {
    // If center is not provided, find the closest region
    const region = await findClosestRegion(target, { regionLevel, language });
    if (!region) throw new Error("Could not find closest region");

    if (regionLevel === 1) {
      // Use code for region 1
      code = region.code;
    } else {
      // Use name for region 2 and above
      code = region.name;
    }
    center = { lat: region.lat, lng: region.lng };
  }

  // Get index (will be a small number since points are close)
  const diff = calculateCoordinateDiff({ center, target, precisionMeters });

  // Get n from diff
  const n = getNFromCoordinates(diff.lat, diff.lng);

  if (regionLevel === 1) {
    // Encoded (Base 32)
    encoded = n.toString(32).toUpperCase();
  } else {
    // Encoded By Word Set
    encoded = await encodeByWordSet({ n, language });
  }

  // Add code if provided
  if (code && code.length > 0) encoded = `${code}-${encoded}`;

  return encoded;
};

/**
 * Decodes an encoded string back into a target point.
 *
 * @param {string} encoded - The encoded string.
 * @param {Object} options - The options object.
 * @param {Object} options.center - Optional center point {lat, lng}. If not provided, it will be derived from the region code/name.
 * @param {number} options.regionLevel - Optional region level for finding the center point.
 * @param {SupportedLanguage} options.language - Optional language for word set decoding.
 * @returns {Object} The target point {lat, lng}.
 */
export const decode = async (
  encoded: string,
  options?: {
    center?: { lat: number; lng: number };
    regionLevel?: number;
    language?: SupportedLanguage;
  }
) => {
  let { center, regionLevel, language } = options ?? {};

  // Split the encoded string to get region code/name and the actual encoded value
  const parts = encoded.split("-");
  let actualEncoded = encoded;
  let code: string | undefined = undefined;

  // If there's a region code/name in the encoded string
  if (parts.length > 1) {
    code = parts[0];
    actualEncoded = parts.slice(1).join("-"); // Join all parts after the first one

    // If center is not provided, find the region by code/name
    if (!center && code) {
      // This would require implementing a function to find a region by code/name
      // For now, we'll throw an error if center is not provided and there's a region code
      if (!regionLevel) {
        // Try to determine if it's a region code (level 1) or name (level 2+)
        regionLevel = code.length <= 4 ? 1 : 2; // Simple heuristic, adjust as needed
      }

      // Find region by code or name based on regionLevel
      // This is a placeholder and should be implemented based on your region lookup logic
      const region = await findRegionByCodeOrName(code, {
        regionLevel,
        language,
      });
      if (!region)
        throw new Error(`Could not find region with code/name: ${code}`);

      center = { lat: region.lat, lng: region.lng };
    }
  }

  if (!center) {
    throw new Error(
      "Center point is required for decoding when no region code/name is provided"
    );
  }

  let n: number;

  // Decode based on region level
  if (regionLevel === 1 || !regionLevel) {
    // Try to parse as base32 first (for region level 1 or when level is not specified)
    try {
      n = parseInt(actualEncoded, 32);
    } catch (e) {
      // If parsing fails, try word set decoding
      n = await decodeByWordSet({ encoded: actualEncoded, language });
    }
  } else {
    // For region level 2 and above, use word set decoding
    n = await decodeByWordSet({ encoded: actualEncoded, language });
  }

  // Get coordinates from n
  const coordinates = getCoordinates(n);

  // Reconstruct the target coordinates
  return reconstructCoordinateDiff({
    center,
    diff: {
      lat: coordinates.x,
      lng: coordinates.y,
    },
  });
};

export {
  getCoordinates,
  getNFromCoordinates,
  findClosestRegion,
  findRegionByCodeOrName,
  encodeByWordSet,
  decodeByWordSet,
  calculateCoordinateDiff,
  reconstructCoordinateDiff,
};

export type { SupportedLanguage };
