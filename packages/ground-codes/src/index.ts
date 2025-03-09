import { findClosestRegion } from "./region.js";
import {
  calculateCoordinateDiff,
  reconstructCoordinateDiff,
} from "./spherical.js";
import { getCoordinates, getNFromCoordinates } from "./spiral.js";
import { encodeByWordSet, SupportedLanguage } from "./wordset.js";

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
 * Decodes an encoded string back into a target point based on a center point.
 *
 * @param {Object} options - The options object.
 * @param {string} options.encoded - The encoded string.
 * @param {Object} options.center - The center point {lat, lng}.
 * @returns {Object} The target point {lat, lng}.
 */
export const decode = ({
  encoded,
  center,
}: {
  encoded: string;
  center: { lat: number; lng: number };
}) => {
  // Get n from encoded
  const n = parseInt(encoded, 32);

  const diff = getCoordinates(n);

  // Convert back to coordinate
  return reconstructCoordinateDiff({
    center,
    diff: {
      lat: diff.x,
      lng: diff.y,
    },
  });
};
