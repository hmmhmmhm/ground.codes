import { useState, useCallback } from "react";
import { encode } from "@/lib/code/ground-codes";
import { useI18n } from "@/lib/i18n/i18n-context";

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMapCoordinates = (selectedArea: Coordinates | null) => {
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
      // Map locale to language for the API
      let language = "english"; // Default value
      if (currentLocale === "ko") {
        language = "korean";
      } else if (currentLocale === "cn") {
        language = "chinese";
      }

      const encoded = await encode({
        lat: selectedArea.lat,
        lng: selectedArea.lng,
        language,
      });
      setEncodedCoordinates(encoded);
    } catch (error) {
      console.error(`Error encoding coordinates (${locale}):`, error);
      setEncodedCoordinates("Encoding error");
    } finally {
      setIsEncoding(false);
    }
  }, [selectedArea]); // Locale dependency removed

  return {
    encodedCoordinates,
    isEncoding,
    encodeSelectedAreaCoordinates,
  };
};
