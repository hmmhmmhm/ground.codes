import { Locale } from "@/i18n";
import enPlaceTypes from "@/messages/en/placeTypes.json";
import koPlaceTypes from "@/messages/ko/placeTypes.json";
import cnPlaceTypes from "@/messages/cn/placeTypes.json";
import jaPlaceTypes from "@/messages/ja/placeTypes.json";
import esPlaceTypes from "@/messages/es/placeTypes.json";
import frPlaceTypes from "@/messages/fr/placeTypes.json";
import dePlaceTypes from "@/messages/de/placeTypes.json";
import ptPlaceTypes from "@/messages/pt/placeTypes.json";
import idPlaceTypes from "@/messages/id/placeTypes.json";
import thPlaceTypes from "@/messages/th/placeTypes.json";
import viPlaceTypes from "@/messages/vi/placeTypes.json";
import hiPlaceTypes from "@/messages/hi/placeTypes.json";
import arPlaceTypes from "@/messages/ar/placeTypes.json";
import ruPlaceTypes from "@/messages/ru/placeTypes.json";
import swPlaceTypes from "@/messages/sw/placeTypes.json";
import filPlaceTypes from "@/messages/fil/placeTypes.json";
import haPlaceTypes from "@/messages/ha/placeTypes.json";
import bnPlaceTypes from "@/messages/bn/placeTypes.json";
import urPlaceTypes from "@/messages/ur/placeTypes.json";
import amPlaceTypes from "@/messages/am/placeTypes.json";

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
  ja: jaPlaceTypes as PlaceTypesRecord,
  es: esPlaceTypes as PlaceTypesRecord,
  fr: frPlaceTypes as PlaceTypesRecord,
  de: dePlaceTypes as PlaceTypesRecord,
  pt: ptPlaceTypes as PlaceTypesRecord,
  id: idPlaceTypes as PlaceTypesRecord,
  th: thPlaceTypes as PlaceTypesRecord,
  vi: viPlaceTypes as PlaceTypesRecord,
  hi: hiPlaceTypes as PlaceTypesRecord,
  ar: arPlaceTypes as PlaceTypesRecord,
  ru: ruPlaceTypes as PlaceTypesRecord,
  sw: swPlaceTypes as PlaceTypesRecord,
  fil: filPlaceTypes as PlaceTypesRecord,
  ha: haPlaceTypes as PlaceTypesRecord,
  bn: bnPlaceTypes as PlaceTypesRecord,
  ur: urPlaceTypes as PlaceTypesRecord,
  am: amPlaceTypes as PlaceTypesRecord,
};
