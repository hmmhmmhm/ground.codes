import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import enPlaceTypes from "@/messages/en/placeTypes.json";
import koPlaceTypes from "@/messages/ko/placeTypes.json";
import cnPlaceTypes from "@/messages/cn/placeTypes.json";
import { Locale } from "@/i18n";

interface PlaceDetailsProps {
  map: google.maps.Map | null;
  visible: boolean;
  placeId: string | null;
  location: google.maps.LatLng | null;
  onClose: () => void;
}

const PlaceDetails: React.FC<PlaceDetailsProps> = ({
  map,
  visible,
  placeId,
  location,
  onClose,
}) => {
  const { t, locale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeDetails, setPlaceDetails] = useState<any>(null);

  // Fetch place details when placeId changes
  useEffect(() => {
    if (!visible || !map || !placeId) {
      return;
    }

    const fetchPlaceDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Fetching place details for:", placeId);

        // Create a PlacesService instance
        const service = new google.maps.places.PlacesService(map);

        // Request place details
        service.getDetails(
          {
            placeId,
            fields: [
              "name",
              "formatted_address",
              "formatted_phone_number",
              "rating",
              "user_ratings_total",
              "website",
              "photos",
              "opening_hours",
              "types",
              "url",
              "vicinity",
            ],
          },
          (result, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              console.log("Place details received:", result);
              setPlaceDetails(result);
            } else {
              console.error("Failed to fetch place details:", status);
              setError(t("common.error.placeDetails"));
            }
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error("Error fetching place details:", err);
        setError(t("common.error.placeDetails"));
        setIsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [map, placeId, visible]);

  if (!visible) return null;

  // 타입 정의를 위한 인터페이스
  type PlaceTypesRecord = Record<string, string>;
  
  const placeTypes: Record<Locale, PlaceTypesRecord> = {
    en: enPlaceTypes as PlaceTypesRecord,
    ko: koPlaceTypes as PlaceTypesRecord,
    cn: cnPlaceTypes as PlaceTypesRecord,
  };

  // 현재 장소 유형의 번역된 이름 가져오기
  const getPlaceTypeName = (type: string): string => {
    if (!type) return "";
    
    // 현재 로케일에 맞는 번역 찾기
    const translatedType = placeTypes[locale as Locale][type];
    
    // 번역이 없으면 기본 형식으로 변환 (언더스코어를 공백으로)
    return translatedType || type.replace(/_/g, " ");
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 z-20 w-full md:w-[400px] overflow-auto">
      <div className="h-auto bg-black/60 backdrop-blur-md p-4 border-r border-white/20 min-h-screen">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          aria-label={t("common.close")}
        >
          ×
        </button>

        {isLoading && (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {error && (
          <div className="text-white bg-red-500/20 p-4 rounded-md mt-4 backdrop-blur-sm border border-red-500/30">
            {error}
          </div>
        )}

        {placeDetails && (
          <div className="text-white mt-4">
            <h2 className="text-xl font-bold mb-2">{placeDetails.name}</h2>

            {placeDetails.types && placeDetails.types.length > 0 && (
              <div className="mb-3">
                <span className="text-gray-300 text-sm">
                  {getPlaceTypeName(placeDetails.types[0])}
                </span>
              </div>
            )}

            {placeDetails.rating && (
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-yellow-400 mr-1">
                      {i < Math.floor(placeDetails.rating) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm">
                  {placeDetails.rating} ({placeDetails.user_ratings_total}{" "}
                  {t("common.reviews")})
                </span>
              </div>
            )}

            {placeDetails.formatted_address && (
              <div className="mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <h3 className="text-sm font-medium text-gray-300 mb-1">
                  {t("common.address")}
                </h3>
                <p>{placeDetails.formatted_address}</p>
              </div>
            )}

            {placeDetails.formatted_phone_number && (
              <div className="mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <h3 className="text-sm font-medium text-gray-300 mb-1">
                  {t("common.phone")}
                </h3>
                <p>{placeDetails.formatted_phone_number}</p>
              </div>
            )}

            {placeDetails.opening_hours && (
              <div className="mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <h3 className="text-sm font-medium text-gray-300 mb-1">
                  {t("common.hours")}
                </h3>
                <p
                  className={
                    placeDetails.opening_hours.isOpen()
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {placeDetails.opening_hours.isOpen()
                    ? t("common.openNow")
                    : t("common.closedNow")}
                </p>
                <div className="mt-1 text-sm">
                  {placeDetails.opening_hours.weekday_text &&
                    placeDetails.opening_hours.weekday_text.map(
                      (day: string, index: number) => <p key={index}>{day}</p>
                    )}
                </div>
              </div>
            )}

            {placeDetails.website && (
              <div className="mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <h3 className="text-sm font-medium text-gray-300 mb-1">
                  {t("common.website")}
                </h3>
                <a
                  href={placeDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {placeDetails.website
                    .replace(/^https?:\/\//, "")
                    .replace(/\/$/, "")}
                </a>
              </div>
            )}

            {placeDetails.photos && placeDetails.photos.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <h3 className="text-sm font-medium text-gray-300 mb-1">
                  {t("common.photos")}
                </h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {placeDetails.photos
                    .slice(0, 4)
                    .map((photo: any, index: number) => (
                      <div
                        key={index}
                        className="aspect-square overflow-hidden rounded-md"
                      >
                        <img
                          src={photo.getUrl({ maxWidth: 200, maxHeight: 200 })}
                          alt={`${placeDetails.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <a
                href={placeDetails.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black py-2 px-4 rounded-md transition-colors backdrop-blur-sm border"
              >
                {t("common.viewOnGoogleMaps")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceDetails;
