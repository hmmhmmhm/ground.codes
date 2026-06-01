import {
  findClosestRegion,
  findRegionByCodeOrName,
  findRegionsByQuery,
  getRegionStore,
  setRegionStore,
} from "./region.js";
import {
  CelestialBody,
  calculateCoordinateDiff,
  getBodyMetersPerDegree,
  normalizeLongitudeForBody,
  reconstructCoordinateDiff,
} from "./spherical.js";
import {
  clearSpiralCache,
  getCoordinates,
  getNFromCoordinates,
  isSpiralCacheEnabled,
  setSpiralCacheEnabled,
} from "./spiral.js";
import {
  decodeByWordSet,
  encodeByWordSet,
  SupportedLanguage,
} from "./wordset.js";

const BASE_32_DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

const encodeBase32 = (n: number | bigint) => {
  if (typeof n === "number") return n.toString(32).toUpperCase();
  if (n === 0n) return "0";

  let value = n;
  let encoded = "";
  while (value > 0n) {
    const digit = Number(value % 32n);
    encoded = BASE_32_DIGITS[digit] + encoded;
    value /= 32n;
  }
  return encoded;
};

const decodeBase32 = (encoded: string) => {
  let value = 0n;
  for (const char of encoded.toUpperCase()) {
    const digit = BASE_32_DIGITS.indexOf(char);
    if (digit === -1) throw new Error(`Invalid base32 digit: ${char}`);
    value = value * 32n + BigInt(digit);
  }

  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value;
};

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
    body?: CelestialBody;
  },
) => {
  let {
    center,
    precisionMeters,
    regionLevel = 2,
    language,
    body = "earth",
  } = options ?? {};
  const requestedRegionLevel = regionLevel;

  let code: string | null = null;
  let encoded = "";

  // If center is provided, encode based on the center
  if (!center) {
    // If center is not provided, find the closest region
    const region = await findClosestRegion(target, {
      regionLevel,
      language,
      body,
    });
    if (!region) throw new Error("Could not find closest region");

    regionLevel = region.regionLevel ?? regionLevel;

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
  const diff = calculateCoordinateDiff({
    center,
    target,
    precisionMeters,
    body,
  });

  // Get n from diff
  const n = getNFromCoordinates(diff.lat, diff.lng);

  if (regionLevel === 1 && requestedRegionLevel === 1) {
    // Encoded (Base 32)
    encoded = encodeBase32(n);
  } else {
    if (typeof n === "bigint") {
      throw new Error(
        "Encoded coordinate index exceeds the supported word-set range.",
      );
    }
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
    body?: CelestialBody;
  },
) => {
  let { center, regionLevel = 2, language, body = "earth" } = options ?? {};
  const requestedRegionLevel = regionLevel;

  // Split the encoded string to get region code/name and the actual encoded value
  const parts = encoded.split("-");
  let actualEncoded = encoded;
  let code: string | undefined = undefined;

  // * Detect language by actualEncoded with unicode
  if (!language) {
    // Check if the text contains Korean characters (Hangul)
    // Hangul syllables range: U+AC00-U+D7A3
    // Hangul Jamo range: U+1100-U+11FF
    const koreanPattern = /[\u1100-\u11FF\uAC00-\uD7A3]/;

    // Check if the text contains Japanese kana.
    // Hiragana range: U+3040-U+309F
    // Katakana range: U+30A0-U+30FF
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;

    // Check if the text contains Chinese characters
    // CJK Unified Ideographs range: U+4E00-U+9FFF
    // CJK Unified Ideographs Extension A: U+3400-U+4DBF
    // CJK Unified Ideographs Extension B: U+20000-U+2A6DF
    // CJK Compatibility Ideographs: U+F900-U+FAFF
    const chinesePattern =
      /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]|[\uD840-\uD869][\uDC00-\uDFFF]/;
    const thaiPattern = /[\u0E00-\u0E7F]/;
    const vietnamesePattern = /[ĂăÂâĐđÊêÔôƠơƯư]/;
    const hindiPattern = /[\u0900-\u097F]/;
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const russianPattern = /[\u0400-\u04FF]/;

    // Test if the text contains Korean or Chinese characters
    if (koreanPattern.test(actualEncoded)) {
      language = "korean";
    } else if (japanesePattern.test(actualEncoded)) {
      language = "japanese";
    } else if (chinesePattern.test(actualEncoded)) {
      language = "chinese";
    } else if (thaiPattern.test(actualEncoded)) {
      language = "thai";
    } else if (vietnamesePattern.test(actualEncoded)) {
      language = "vietnamese";
    } else if (hindiPattern.test(actualEncoded)) {
      language = "hindi";
    } else if (arabicPattern.test(actualEncoded)) {
      language = "arabic";
    } else if (russianPattern.test(actualEncoded)) {
      language = "russian";
    } else {
      // Default to English if no Korean or Chinese characters are detected
      language = "english";
    }
  }

  // If there's a region code/name in the encoded string
  if (parts.length > 1) {
    code = parts[0];
    actualEncoded = parts.slice(1).join("-"); // Join all parts after the first one

    // If center is not provided, find the region by code/name
    if (!center && code) {
      // Find region by code or name based on regionLevel
      // This is a placeholder and should be implemented based on your region lookup logic
      const region = await findRegionByCodeOrName(code, {
        regionLevel,
        language,
        body,
      });
      if (!region)
        throw new Error(`Could not find region with code/name: ${code}`);

      regionLevel = region.regionLevel ?? regionLevel;
      center = { lat: region.lat, lng: region.lng };
    }
  }

  if (!center) {
    throw new Error(
      "Center point is required for decoding when no region code/name is provided",
    );
  }

  let n: number | bigint;

  // Decode based on region level
  if (regionLevel === 1 && requestedRegionLevel === 1) {
    n = decodeBase32(actualEncoded);
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
      lat: Number(coordinates.x),
      lng: Number(coordinates.y),
    },
    body,
  });
};

export {
  getCoordinates,
  getNFromCoordinates,
  clearSpiralCache,
  isSpiralCacheEnabled,
  setSpiralCacheEnabled,
  findClosestRegion,
  findRegionByCodeOrName,
  findRegionsByQuery,
  encodeByWordSet,
  decodeByWordSet,
  calculateCoordinateDiff,
  reconstructCoordinateDiff,
  getBodyMetersPerDegree,
  normalizeLongitudeForBody,
  getRegionStore,
  setRegionStore,
};

export type { CelestialBody, SupportedLanguage };
export type { RegionSearchResult, RegionStore } from "./region.js";
