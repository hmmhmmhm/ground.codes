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

  const encodeSelectedAreaCoordinates = useCallback(async () => {
    if (!selectedArea) return;

    try {
      setIsEncoding(true);
      // Map locale to language for the API
      const language = locale === 'ko' ? 'Korean' : 'English';
      
      const encoded = await encode({
        lat: selectedArea.lat,
        lng: selectedArea.lng,
        language,
      });
      setEncodedCoordinates(encoded);
    } catch (error) {
      console.error(`Error encoding coordinates (${locale}):`, error);
      setEncodedCoordinates("인코딩 오류");
    } finally {
      setIsEncoding(false);
    }
  }, [selectedArea, locale]);

  return {
    encodedCoordinates,
    isEncoding,
    encodeSelectedAreaCoordinates,
  };
};
