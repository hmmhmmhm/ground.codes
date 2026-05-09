export type CelestialBody = "earth" | "moon" | "mars";

/**
 * Meters per one latitude degree for the supported spherical body model.
 * Earth intentionally preserves the historical approximation to keep existing
 * codes stable.
 */
export const BODY_METERS_PER_DEGREE: Record<CelestialBody, number> = {
  earth: 111000,
  moon: (Math.PI * 1737400) / 180,
  mars: (Math.PI * 3389500) / 180,
};

/**
 * Approximately 111 km corresponds to 1 degree on Earth, thus 1 meter
 * corresponds to approximately 1/111000 degrees.
 */
export const DEG_PER_METER = BODY_METERS_PER_DEGREE.earth;

export const getBodyMetersPerDegree = (body: CelestialBody = "earth") => {
  const metersPerDegree = BODY_METERS_PER_DEGREE[body];
  if (!metersPerDegree) throw new Error(`Invalid celestial body: ${body}`);
  return metersPerDegree;
};

export const normalizeLongitudeForBody = (
  lng: number,
  body: CelestialBody = "earth",
) => {
  if (body === "earth") return lng;
  return ((((lng + 180) % 360) + 360) % 360) - 180;
};

/**
 * Converts a target coordinate to an diff based on a reference center coordinate.
 * Useful for creating a grid diff system for spatial data.
 *
 * @param {Object} center - The reference coordinate with latitude and longitude.
 * @param {Object} target - The target coordinate to convert into diff form.
 * @param {number} precisionMeters - The precision, in meters, for the conversion.
 * @param {number} degreePerMeter - Conversion factor from meters to degrees. Default is 111000.
 * @returns {Object} The calculated diff for latitude and longitude.
 */
export function calculateCoordinateDiff({
  center,
  target,
  precisionMeters = 3,
  degreePerMeter,
  body = "earth",
}: {
  center: { lat: number; lng: number };
  target: { lat: number; lng: number };
  precisionMeters?: number;
  degreePerMeter?: number;
  body?: CelestialBody;
}): { lat: number; lng: number } {
  const metersPerDegree = degreePerMeter ?? getBodyMetersPerDegree(body);
  const centerLng = normalizeLongitudeForBody(center.lng, body);
  const targetLng = normalizeLongitudeForBody(target.lng, body);
  // Convert latitude difference from degrees to meters.
  const latDiff = (target.lat - center.lat) * metersPerDegree;

  // Convert longitude difference from degrees to meters, adjusting for latitude.
  const lngDiff =
    (targetLng - centerLng) *
    metersPerDegree *
    Math.cos((center.lat * Math.PI) / 180);

  // Calculate index by dividing the meter difference by the specified precision.
  return {
    lat: Math.round(latDiff / precisionMeters),
    lng: Math.round(lngDiff / precisionMeters),
  };
}

/**
 * Converts a grid diff back into a coordinate based on a reference center coordinate.
 * This reverses the operation done by `calculateCoordinateDiff`.
 *
 * @param {Object} center - The reference coordinate with latitude and longitude.
 * @param {Object} diff - The grid diff representing the position related to the center.
 * @param {number} precisionMeters - The precision, in meters, used in the conversion process.
 * @param {number} degreePerMeter - Conversion factor from meters to degrees. Default is 111000.
 * @returns {Object} The calculated target coordinate.
 */
export function reconstructCoordinateDiff({
  center,
  diff,
  precisionMeters = 3,
  degreePerMeter,
  body = "earth",
}: {
  center: { lat: number; lng: number };
  diff: { lat: number; lng: number };
  precisionMeters?: number;
  degreePerMeter?: number;
  body?: CelestialBody;
}): { lat: number; lng: number } {
  const metersPerDegree = degreePerMeter ?? getBodyMetersPerDegree(body);
  // Convert the latitude index back to degrees difference.
  const latDiff = (diff.lat * precisionMeters) / metersPerDegree;

  // Convert the longitude index back to degrees difference, adjusting for latitude.
  const lngDiff =
    (diff.lng * precisionMeters) /
    (metersPerDegree * Math.cos((center.lat * Math.PI) / 180));

  // Add the differences to the center coordinates to get the target coordinates.
  const targetLat = center.lat + latDiff;
  const targetLng = normalizeLongitudeForBody(center.lng + lngDiff, body);

  return { lat: targetLat, lng: targetLng };
}
