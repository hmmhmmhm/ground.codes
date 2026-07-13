import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";

/**
 * Fetches Google Places details for the given placeId whenever it changes.
 * Resets all derived state when the panel is hidden or a new place is selected.
 */
export const usePlaceDetails = (
  map: google.maps.Map | null,
  placeId: string | null,
  visible: boolean,
  onResetPhotoState: () => void,
) => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeDetails, setPlaceDetails] =
    useState<google.maps.places.PlaceResult | null>(null);

  // Reset everything when the panel is hidden
  useEffect(() => {
    if (!visible) {
      setPlaceDetails(null);
      setError(null);
      setIsLoading(false);
    }
  }, [visible]);

  // Fetch details when placeId changes
  useEffect(() => {
    if (!visible || !map || !placeId) return;

    setPlaceDetails(null);
    onResetPhotoState();

    const fetchPlaceDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const service = new google.maps.places.PlacesService(map);

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
              setPlaceDetails(result);
            } else {
              setError(t("common.error.placeDetails"));
            }
            setIsLoading(false);
          },
        );
      } catch (err) {
        console.error("Error fetching place details:", err);
        setError(t("common.error.placeDetails"));
        setIsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [map, onResetPhotoState, placeId, t, visible]);

  return { isLoading, error, placeDetails };
};
