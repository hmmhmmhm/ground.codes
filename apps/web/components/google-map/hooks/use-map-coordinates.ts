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

  // locale을 클로저로 캡처하지 않고 함수 내부에서 참조하도록 수정
  const encodeSelectedAreaCoordinates = useCallback(async () => {
    if (!selectedArea) return;

    try {
      setIsEncoding(true);
      // 함수 내부에서 직접 locale 참조
      const currentLocale = locale;
      // Map locale to language for the API
      let language = "english"; // 기본값
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
      setEncodedCoordinates("인코딩 오류");
    } finally {
      setIsEncoding(false);
    }
  }, [selectedArea]); // locale 의존성 제거

  return {
    encodedCoordinates,
    isEncoding,
    encodeSelectedAreaCoordinates,
  };
};
