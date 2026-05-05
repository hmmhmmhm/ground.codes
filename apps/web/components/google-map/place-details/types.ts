import { Locale } from "@/i18n";
import enPlaceTypes from "@/messages/en/placeTypes.json";
import koPlaceTypes from "@/messages/ko/placeTypes.json";
import cnPlaceTypes from "@/messages/cn/placeTypes.json";

export interface PlaceDetailsProps {
  map: google.maps.Map | null;
  visible: boolean;
  placeId: string | null;
  location: google.maps.LatLng | null;
  onClose: () => void;
}

export type PlaceTypesRecord = Record<string, string>;

export const placeTypes: Record<Locale, PlaceTypesRecord> = {
  en: enPlaceTypes as PlaceTypesRecord,
  ko: koPlaceTypes as PlaceTypesRecord,
  cn: cnPlaceTypes as PlaceTypesRecord,
};
