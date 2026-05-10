import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { encode } from "@/lib/code/ground-codes";
import { getGroundCodeLanguage } from "@/lib/i18n/ground-code-language";
import { CelestialBody } from "@/lib/map/celestial-bodies";

/**
 * Generates (and caches) a ground code for the given lat/lng location.
 * Re-runs whenever location, locale, or visibility changes.
 */
export const useGroundCode = (
  location: google.maps.LatLng | null,
  visible: boolean,
  body: CelestialBody = "earth"
) => {
  const { locale } = useI18n();
  const [groundCode, setGroundCode] = useState<string>("");
  const [isLoadingGroundCode, setIsLoadingGroundCode] = useState(false);

  const generateGroundCode = useCallback(async () => {
    if (!location) return;
    try {
      setIsLoadingGroundCode(true);
      const code = await encode({
        lat: location.lat(),
        lng: location.lng(),
        language: getGroundCodeLanguage(locale),
        body,
      });
      setGroundCode(code);
    } catch (err) {
      console.error("Error generating ground code:", err);
      setGroundCode("");
    } finally {
      setIsLoadingGroundCode(false);
    }
  }, [location, locale, body]);

  useEffect(() => {
    if (location && visible) {
      generateGroundCode();
    }
  }, [location, locale, visible, generateGroundCode]);

  // Reset when panel hides
  useEffect(() => {
    if (!visible) {
      setGroundCode("");
    }
  }, [visible]);

  return { groundCode, isLoadingGroundCode };
};
