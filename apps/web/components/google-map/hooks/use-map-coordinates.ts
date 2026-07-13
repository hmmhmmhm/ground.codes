import { useState, useCallback } from "react";
import { encode } from "@/lib/code/ground-codes";
import { useI18n } from "@/lib/i18n/i18n-context";
import { getGroundCodeLanguage } from "@/lib/i18n/ground-code-language";
import { CelestialBody } from "@/lib/map/celestial-bodies";

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMapCoordinates = (
  selectedArea: Coordinates | null,
  body: CelestialBody = "earth",
) => {
  const { locale } = useI18n();
  const [encodedCoordinates, setEncodedCoordinates] = useState<string>("");
  const [isEncoding, setIsEncoding] = useState(false);

  // Locale to be captured in a closure
  const encodeSelectedAreaCoordinates = useCallback(async () => {
    if (!selectedArea) return;

    try {
      setIsEncoding(true);
      // Locale to be captured in a closure
      const currentLocale = locale;
      const language = getGroundCodeLanguage(currentLocale);

      const encoded = await encode({
        lat: selectedArea.lat,
        lng: selectedArea.lng,
        language,
        body,
      });
      setEncodedCoordinates(encoded);
    } catch (error) {
      console.error(`Error encoding coordinates (${locale}):`, error);
      setEncodedCoordinates("Encoding error");
    } finally {
      setIsEncoding(false);
    }
  }, [selectedArea, body, locale]);

  return {
    encodedCoordinates,
    isEncoding,
    encodeSelectedAreaCoordinates,
  };
};
