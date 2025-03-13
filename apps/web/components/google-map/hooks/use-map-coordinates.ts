import { useState, useCallback } from "react";
import { encode } from "@/lib/code/ground-codes";

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMapCoordinates = (selectedArea: Coordinates | null) => {
  const [encodedCoordinatesEN, setEncodedCoordinatesEN] = useState<string>("");
  const [encodedCoordinatesKR, setEncodedCoordinatesKR] = useState<string>("");
  const [isEncodingEN, setIsEncodingEN] = useState(false);
  const [isEncodingKR, setIsEncodingKR] = useState(false);

  const encodeSelectedAreaCoordinates = useCallback(async () => {
    if (!selectedArea) return;

    const encodeCoordinatesEN = async () => {
      try {
        setIsEncodingEN(true);
        const encoded = await encode({
          lat: selectedArea.lat,
          lng: selectedArea.lng,
          language: "English",
        });
        setEncodedCoordinatesEN(encoded);
      } catch (error) {
        console.error("Error encoding coordinates (English):", error);
        setEncodedCoordinatesEN("인코딩 오류");
      } finally {
        setIsEncodingEN(false);
      }
    };

    const encodeCoordinatesKR = async () => {
      try {
        setIsEncodingKR(true);
        const encoded = await encode({
          lat: selectedArea.lat,
          lng: selectedArea.lng,
          language: "Korean",
        });
        setEncodedCoordinatesKR(encoded);
      } catch (error) {
        console.error("Error encoding coordinates (Korean):", error);
        setEncodedCoordinatesKR("인코딩 오류");
      } finally {
        setIsEncodingKR(false);
      }
    };

    await Promise.all([encodeCoordinatesEN(), encodeCoordinatesKR()]);
  }, [selectedArea]);

  return {
    encodedCoordinatesEN,
    encodedCoordinatesKR,
    isEncodingEN,
    isEncodingKR,
    encodeSelectedAreaCoordinates,
  };
};
