/// <reference path="./region-json.d.ts" />

import { createRequire } from "node:module";
import { SupportedLanguage } from "./wordset.js";
import {
  CelestialBody,
  getBodyMetersPerDegree,
  normalizeLongitudeForBody,
} from "./spherical.js";

export interface Region {
  name: string;
  code: string;
  lat: number;
  long: number;
  body?: CelestialBody;
  regionLevel?: number;
  distanceKm?: number;
  population?: number;
  countryCode?: string;
}

export interface RegionSearchResult {
  lat: number;
  lng: number;
  regionLevel?: number;
  body?: CelestialBody;
  name: string;
  code: string;
  distanceKm?: number;
  population?: number;
}

export interface RegionStore {
  findRegionsAround?(
    target: { lat: number; lng: number },
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      body?: CelestialBody;
      maxResults?: number;
      maxDistance?: number;
    },
  ): Promise<RegionSearchResult[]>;
  findClosestRegion(
    target: { lat: number; lng: number },
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      region2FallbackDistanceKm?: number;
      body?: CelestialBody;
    },
  ): Promise<RegionSearchResult | null>;
  findRegionsByQuery(
    codeOrName: string,
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      body?: CelestialBody;
      maxResults?: number;
      biasLat?: number;
      biasLng?: number;
    },
  ): Promise<RegionSearchResult[]>;
}

let configuredRegionStore: RegionStore | null = null;

export const setRegionStore = (store: RegionStore | null) => {
  configuredRegionStore = store;
};

export const getRegionStore = () => configuredRegionStore;

let requireRegionJson: ReturnType<typeof createRequire> | null = null;
const loadRegionData = (path: string) => {
  if (!requireRegionJson) {
    if (typeof import.meta.url !== "string") {
      throw new Error(
        "Local region JSON loading is unavailable in this runtime",
      );
    }
    requireRegionJson = createRequire(import.meta.url);
  }

  return requireRegionJson(path) as Region[];
};

const DEFAULT_REGION_2_FALLBACK_DISTANCE_KM = 100;
const DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM = 100;
const PROMINENT_REGION_MIN_POPULATION = 1_000_000;
const PROMINENT_REGION_POPULATION_RATIO = 3;
const PROMINENT_REGION_MAX_DISTANCE_KM = 25;
const PROMINENT_REGION_MAX_DISTANCE_RATIO = 1.5;
const regionDataCache = new Map<string, Promise<Region[]>>();
const regionSupportedLanguages = new Set<string>([
  "english",
  "korean",
  "chinese",
  "japanese",
  "spanish",
  "french",
  "german",
  "portuguese",
  "turkish",
  "italian",
  "dutch",
  "polish",
  "ukrainian",
  "romanian",
  "czech",
  "greek",
  "swedish",
  "hungarian",
  "danish",
  "indonesian",
  "thai",
  "vietnamese",
  "hindi",
  "arabic",
  "russian",
  "swahili",
  "filipino",
  "hausa",
  "bengali",
  "urdu",
  "amharic",
  "burmese",
  "khmer",
  "nepali",
  "somali",
  "pashto",
  "lingala",
  "mongolian",
  "lao",
  "malagasy",
  "dari",
  "oromo",
  "chichewa",
  "tigrinya",
  "bambara",
  "fula",
  "wolof",
  "sinhala",
  "tamil",
  "kinyarwanda",
  "kirundi",
  "krio",
  "ewe",
  "fon",
  "sango",
  "moore",
  "kanuri",
  "quechua",
  "aymara",
  "guarani",
  "kongo",
  "zarma",
  "tamasheq",
  "songhay",
  "twi",
  "dagbani",
  "luganda",
  "acholi",
  "dinka",
  "nuer",
  "shona",
  "ndebele",
  "tok_pisin",
  "marathi",
  "telugu",
  "gujarati",
  "kannada",
  "malayalam",
  "yoruba",
  "persian",
  "cantonese",
  "afar",
  "abkhazian",
  "afrikaans",
  "akan",
  "albanian",
  "aragonese",
  "armenian",
  "assamese",
  "avaric",
  "avestan",
  "azerbaijani",
  "bashkir",
  "basque",
  "belarusian",
  "bislama",
  "bosnian",
  "breton",
  "bulgarian",
  "catalan",
  "chamorro",
  "chechen",
  "church_slavic",
  "chuvash",
  "cornish",
  "corsican",
  "cree",
  "divehi",
  "dzongkha",
  "esperanto",
  "estonian",
  "faroese",
  "fijian",
  "finnish",
  "western_frisian",
  "georgian",
  "gaelic",
  "irish",
  "galician",
  "manx",
  "haitian",
  "hebrew",
  "herero",
  "hiri_motu",
  "croatian",
  "igbo",
  "icelandic",
  "ido",
  "sichuan_yi",
  "inuktitut",
  "interlingue",
  "interlingua",
  "inupiaq",
  "javanese",
  "kalaallisut",
  "kashmiri",
  "kazakh",
  "kikuyu",
  "kirghiz",
  "komi",
  "kuanyama",
  "kurdish",
  "latin",
  "latvian",
  "limburgan",
  "lithuanian",
  "luxembourgish",
  "luba_katanga",
  "macedonian",
  "marshallese",
  "maori",
  "malay",
  "maltese",
  "nauru",
  "navajo",
  "south_ndebele",
  "ndonga",
  "norwegian_nynorsk",
  "norwegian_bokm_l",
  "norwegian",
  "occitan",
  "ojibwa",
  "oriya",
  "ossetian",
  "panjabi",
  "pali",
  "romansh",
  "sanskrit",
  "slovak",
  "slovenian",
  "northern_sami",
  "samoan",
  "sindhi",
  "sotho_southern",
  "sardinian",
  "serbian",
  "swati",
  "sundanese",
  "tahitian",
  "tatar",
]);

const addressGapLanguages = new Set([
  "swahili",
  "filipino",
  "hausa",
  "bengali",
  "urdu",
  "amharic",
  "burmese",
  "khmer",
  "nepali",
  "somali",
  "pashto",
  "lingala",
  "mongolian",
  "lao",
  "malagasy",
  "dari",
  "oromo",
  "chichewa",
  "tigrinya",
  "bambara",
  "fula",
  "wolof",
  "sinhala",
  "tamil",
  "kinyarwanda",
  "kirundi",
  "krio",
  "ewe",
  "fon",
  "sango",
  "moore",
  "kanuri",
  "quechua",
  "aymara",
  "guarani",
  "kongo",
  "zarma",
  "tamasheq",
  "songhay",
  "twi",
  "dagbani",
  "luganda",
  "acholi",
  "dinka",
  "nuer",
  "shona",
  "ndebele",
  "tok_pisin",
  "afar",
  "abkhazian",
  "afrikaans",
  "akan",
  "albanian",
  "aragonese",
  "armenian",
  "assamese",
  "avaric",
  "avestan",
  "azerbaijani",
  "bashkir",
  "basque",
  "belarusian",
  "bislama",
  "bosnian",
  "breton",
  "bulgarian",
  "catalan",
  "chamorro",
  "chechen",
  "church_slavic",
  "chuvash",
  "cornish",
  "corsican",
  "cree",
  "divehi",
  "dzongkha",
  "esperanto",
  "estonian",
  "faroese",
  "fijian",
  "finnish",
  "western_frisian",
  "georgian",
  "gaelic",
  "irish",
  "galician",
  "manx",
  "haitian",
  "hebrew",
  "herero",
  "hiri_motu",
  "croatian",
  "igbo",
  "icelandic",
  "ido",
  "sichuan_yi",
  "inuktitut",
  "interlingue",
  "interlingua",
  "inupiaq",
  "javanese",
  "kalaallisut",
  "kashmiri",
  "kazakh",
  "kikuyu",
  "kirghiz",
  "komi",
  "kuanyama",
  "kurdish",
  "latin",
  "latvian",
  "limburgan",
  "lithuanian",
  "luxembourgish",
  "luba_katanga",
  "macedonian",
  "marshallese",
  "maori",
  "malay",
  "maltese",
  "nauru",
  "navajo",
  "south_ndebele",
  "ndonga",
  "norwegian_nynorsk",
  "norwegian_bokm_l",
  "norwegian",
  "occitan",
  "ojibwa",
  "oriya",
  "ossetian",
  "panjabi",
  "pali",
  "romansh",
  "sanskrit",
  "slovak",
  "slovenian",
  "northern_sami",
  "samoan",
  "sindhi",
  "sotho_southern",
  "sardinian",
  "serbian",
  "swati",
  "sundanese",
  "tahitian",
  "tatar",
  "turkish",
  "italian",
  "dutch",
  "polish",
  "ukrainian",
  "romanian",
  "czech",
  "greek",
  "swedish",
  "hungarian",
  "danish",
  "marathi",
  "telugu",
  "gujarati",
  "kannada",
  "malayalam",
  "yoruba",
  "persian",
  "cantonese",
]);

const englishRegionFallbackLanguages = new Set<string>([]);

const addressGapRegionLoaders: Record<string, () => Promise<Region[]>> = {
  "region-2-swahili": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-swahili.json"),
  "region-3-swahili": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-swahili.json"),
  "region-2-moon-swahili": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-swahili.json",
    ),
  "region-2-mars-swahili": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-swahili.json",
    ),
  "region-3-mars-swahili": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-swahili.json",
    ),
  "region-2-filipino": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-filipino.json"),
  "region-3-filipino": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-filipino.json"),
  "region-2-moon-filipino": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-filipino.json",
    ),
  "region-2-mars-filipino": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-filipino.json",
    ),
  "region-3-mars-filipino": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-filipino.json",
    ),
  "region-2-hausa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-hausa.json"),
  "region-3-hausa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-hausa.json"),
  "region-2-moon-hausa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-hausa.json"),
  "region-2-mars-hausa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-hausa.json"),
  "region-3-mars-hausa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-hausa.json"),
  "region-2-bengali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-bengali.json"),
  "region-3-bengali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-bengali.json"),
  "region-2-moon-bengali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-bengali.json",
    ),
  "region-2-mars-bengali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-bengali.json",
    ),
  "region-3-mars-bengali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-bengali.json",
    ),
  "region-2-urdu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-urdu.json"),
  "region-3-urdu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-urdu.json"),
  "region-2-moon-urdu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-urdu.json"),
  "region-2-mars-urdu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-urdu.json"),
  "region-3-mars-urdu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-urdu.json"),
  "region-2-amharic": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-amharic.json"),
  "region-3-amharic": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-amharic.json"),
  "region-2-moon-amharic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-amharic.json",
    ),
  "region-2-mars-amharic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-amharic.json",
    ),
  "region-3-mars-amharic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-amharic.json",
    ),
  "region-2-burmese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-burmese.json"),
  "region-3-burmese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-burmese.json"),
  "region-2-moon-burmese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-burmese.json",
    ),
  "region-2-mars-burmese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-burmese.json",
    ),
  "region-3-mars-burmese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-burmese.json",
    ),
  "region-2-khmer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-khmer.json"),
  "region-3-khmer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-khmer.json"),
  "region-2-moon-khmer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-khmer.json"),
  "region-2-mars-khmer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-khmer.json"),
  "region-3-mars-khmer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-khmer.json"),
  "region-2-nepali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-nepali.json"),
  "region-3-nepali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-nepali.json"),
  "region-2-moon-nepali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-nepali.json",
    ),
  "region-2-mars-nepali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-nepali.json",
    ),
  "region-3-mars-nepali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-nepali.json",
    ),
  "region-2-somali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-somali.json"),
  "region-3-somali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-somali.json"),
  "region-2-moon-somali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-somali.json",
    ),
  "region-2-mars-somali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-somali.json",
    ),
  "region-3-mars-somali": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-somali.json",
    ),
  "region-2-pashto": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-pashto.json"),
  "region-3-pashto": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-pashto.json"),
  "region-2-moon-pashto": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-pashto.json",
    ),
  "region-2-mars-pashto": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-pashto.json",
    ),
  "region-3-mars-pashto": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-pashto.json",
    ),
  "region-2-lingala": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-lingala.json"),
  "region-3-lingala": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-lingala.json"),
  "region-2-moon-lingala": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-lingala.json",
    ),
  "region-2-mars-lingala": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-lingala.json",
    ),
  "region-3-mars-lingala": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-lingala.json",
    ),
  "region-2-mongolian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mongolian.json"),
  "region-3-mongolian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mongolian.json"),
  "region-2-moon-mongolian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-mongolian.json",
    ),
  "region-2-mars-mongolian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-mongolian.json",
    ),
  "region-3-mars-mongolian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-mongolian.json",
    ),
  "region-2-lao": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-lao.json"),
  "region-3-lao": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-lao.json"),
  "region-2-moon-lao": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-lao.json"),
  "region-2-mars-lao": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-lao.json"),
  "region-3-mars-lao": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-lao.json"),
  "region-2-malagasy": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-malagasy.json"),
  "region-3-malagasy": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-malagasy.json"),
  "region-2-moon-malagasy": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-malagasy.json",
    ),
  "region-2-mars-malagasy": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-malagasy.json",
    ),
  "region-3-mars-malagasy": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-malagasy.json",
    ),
  "region-2-dari": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-dari.json"),
  "region-3-dari": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-dari.json"),
  "region-2-moon-dari": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-dari.json"),
  "region-2-mars-dari": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-dari.json"),
  "region-3-mars-dari": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-dari.json"),
  "region-2-oromo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-oromo.json"),
  "region-3-oromo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-oromo.json"),
  "region-2-moon-oromo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-oromo.json"),
  "region-2-mars-oromo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-oromo.json"),
  "region-3-mars-oromo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-oromo.json"),
  "region-2-chichewa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-chichewa.json"),
  "region-3-chichewa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-chichewa.json"),
  "region-2-moon-chichewa": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-chichewa.json",
    ),
  "region-2-mars-chichewa": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-chichewa.json",
    ),
  "region-3-mars-chichewa": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-chichewa.json",
    ),
  "region-2-tigrinya": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-tigrinya.json"),
  "region-3-tigrinya": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-tigrinya.json"),
  "region-2-moon-tigrinya": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-tigrinya.json",
    ),
  "region-2-mars-tigrinya": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-tigrinya.json",
    ),
  "region-3-mars-tigrinya": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-tigrinya.json",
    ),
  "region-2-bambara": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-bambara.json"),
  "region-3-bambara": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-bambara.json"),
  "region-2-moon-bambara": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-bambara.json",
    ),
  "region-2-mars-bambara": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-bambara.json",
    ),
  "region-3-mars-bambara": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-bambara.json",
    ),
  "region-2-fula": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-fula.json"),
  "region-3-fula": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-fula.json"),
  "region-2-moon-fula": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-fula.json"),
  "region-2-mars-fula": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-fula.json"),
  "region-3-mars-fula": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-fula.json"),
  "region-2-wolof": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-wolof.json"),
  "region-3-wolof": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-wolof.json"),
  "region-2-moon-wolof": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-wolof.json"),
  "region-2-mars-wolof": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-wolof.json"),
  "region-3-mars-wolof": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-wolof.json"),
  "region-2-sinhala": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-sinhala.json"),
  "region-3-sinhala": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-sinhala.json"),
  "region-2-moon-sinhala": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-sinhala.json",
    ),
  "region-2-mars-sinhala": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-sinhala.json",
    ),
  "region-3-mars-sinhala": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-sinhala.json",
    ),
  "region-2-tamil": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-tamil.json"),
  "region-3-tamil": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-tamil.json"),
  "region-2-moon-tamil": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-tamil.json"),
  "region-2-mars-tamil": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-tamil.json"),
  "region-3-mars-tamil": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-tamil.json"),
  "region-2-kinyarwanda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-kinyarwanda.json",
    ),
  "region-3-kinyarwanda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-kinyarwanda.json",
    ),
  "region-2-moon-kinyarwanda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kinyarwanda.json",
    ),
  "region-2-mars-kinyarwanda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kinyarwanda.json",
    ),
  "region-3-mars-kinyarwanda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kinyarwanda.json",
    ),
  "region-2-kirundi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kirundi.json"),
  "region-3-kirundi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kirundi.json"),
  "region-2-moon-kirundi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kirundi.json",
    ),
  "region-2-mars-kirundi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kirundi.json",
    ),
  "region-3-mars-kirundi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kirundi.json",
    ),
  "region-2-krio": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-krio.json"),
  "region-3-krio": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-krio.json"),
  "region-2-moon-krio": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-krio.json"),
  "region-2-mars-krio": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-krio.json"),
  "region-3-mars-krio": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-krio.json"),
  "region-2-ewe": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-ewe.json"),
  "region-3-ewe": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-ewe.json"),
  "region-2-moon-ewe": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-ewe.json"),
  "region-2-mars-ewe": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-ewe.json"),
  "region-3-mars-ewe": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-ewe.json"),
  "region-2-fon": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-fon.json"),
  "region-3-fon": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-fon.json"),
  "region-2-moon-fon": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-fon.json"),
  "region-2-mars-fon": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-fon.json"),
  "region-3-mars-fon": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-fon.json"),
  "region-2-sango": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-sango.json"),
  "region-3-sango": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-sango.json"),
  "region-2-moon-sango": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-sango.json"),
  "region-2-mars-sango": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-sango.json"),
  "region-3-mars-sango": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-sango.json"),
  "region-2-moore": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moore.json"),
  "region-3-moore": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-moore.json"),
  "region-2-moon-moore": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-moore.json"),
  "region-2-mars-moore": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-moore.json"),
  "region-3-mars-moore": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-moore.json"),
  "region-2-kanuri": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kanuri.json"),
  "region-3-kanuri": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kanuri.json"),
  "region-2-moon-kanuri": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kanuri.json",
    ),
  "region-2-mars-kanuri": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kanuri.json",
    ),
  "region-3-mars-kanuri": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kanuri.json",
    ),
  "region-2-quechua": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-quechua.json"),
  "region-3-quechua": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-quechua.json"),
  "region-2-moon-quechua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-quechua.json",
    ),
  "region-2-mars-quechua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-quechua.json",
    ),
  "region-3-mars-quechua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-quechua.json",
    ),
  "region-2-aymara": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-aymara.json"),
  "region-3-aymara": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-aymara.json"),
  "region-2-moon-aymara": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-aymara.json",
    ),
  "region-2-mars-aymara": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-aymara.json",
    ),
  "region-3-mars-aymara": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-aymara.json",
    ),
  "region-2-guarani": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-guarani.json"),
  "region-3-guarani": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-guarani.json"),
  "region-2-moon-guarani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-guarani.json",
    ),
  "region-2-mars-guarani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-guarani.json",
    ),
  "region-3-mars-guarani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-guarani.json",
    ),
  "region-2-kongo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kongo.json"),
  "region-3-kongo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kongo.json"),
  "region-2-moon-kongo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-kongo.json"),
  "region-2-mars-kongo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-kongo.json"),
  "region-3-mars-kongo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-kongo.json"),
  "region-2-zarma": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-zarma.json"),
  "region-3-zarma": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-zarma.json"),
  "region-2-moon-zarma": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-zarma.json"),
  "region-2-mars-zarma": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-zarma.json"),
  "region-3-mars-zarma": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-zarma.json"),
  "region-2-tamasheq": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-tamasheq.json"),
  "region-3-tamasheq": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-tamasheq.json"),
  "region-2-moon-tamasheq": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-tamasheq.json",
    ),
  "region-2-mars-tamasheq": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-tamasheq.json",
    ),
  "region-3-mars-tamasheq": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-tamasheq.json",
    ),
  "region-2-songhay": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-songhay.json"),
  "region-3-songhay": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-songhay.json"),
  "region-2-moon-songhay": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-songhay.json",
    ),
  "region-2-mars-songhay": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-songhay.json",
    ),
  "region-3-mars-songhay": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-songhay.json",
    ),
  "region-2-twi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-twi.json"),
  "region-3-twi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-twi.json"),
  "region-2-moon-twi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-twi.json"),
  "region-2-mars-twi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-twi.json"),
  "region-3-mars-twi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-twi.json"),
  "region-2-dagbani": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-dagbani.json"),
  "region-3-dagbani": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-dagbani.json"),
  "region-2-moon-dagbani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-dagbani.json",
    ),
  "region-2-mars-dagbani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-dagbani.json",
    ),
  "region-3-mars-dagbani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-dagbani.json",
    ),
  "region-2-luganda": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-luganda.json"),
  "region-3-luganda": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-luganda.json"),
  "region-2-moon-luganda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-luganda.json",
    ),
  "region-2-mars-luganda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-luganda.json",
    ),
  "region-3-mars-luganda": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-luganda.json",
    ),
  "region-2-acholi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-acholi.json"),
  "region-3-acholi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-acholi.json"),
  "region-2-moon-acholi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-acholi.json",
    ),
  "region-2-mars-acholi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-acholi.json",
    ),
  "region-3-mars-acholi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-acholi.json",
    ),
  "region-2-dinka": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-dinka.json"),
  "region-3-dinka": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-dinka.json"),
  "region-2-moon-dinka": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-dinka.json"),
  "region-2-mars-dinka": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-dinka.json"),
  "region-3-mars-dinka": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-dinka.json"),
  "region-2-nuer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-nuer.json"),
  "region-3-nuer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-nuer.json"),
  "region-2-moon-nuer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-nuer.json"),
  "region-2-mars-nuer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-nuer.json"),
  "region-3-mars-nuer": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-nuer.json"),
  "region-2-shona": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-shona.json"),
  "region-3-shona": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-shona.json"),
  "region-2-moon-shona": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-shona.json"),
  "region-2-mars-shona": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-shona.json"),
  "region-3-mars-shona": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-shona.json"),
  "region-2-ndebele": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-ndebele.json"),
  "region-3-ndebele": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-ndebele.json"),
  "region-2-moon-ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-ndebele.json",
    ),
  "region-2-mars-ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-ndebele.json",
    ),
  "region-3-mars-ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-ndebele.json",
    ),
  "region-2-tok_pisin": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-tok_pisin.json"),
  "region-3-tok_pisin": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-tok_pisin.json"),
  "region-2-moon-tok_pisin": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-tok_pisin.json",
    ),
  "region-2-mars-tok_pisin": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-tok_pisin.json",
    ),
  "region-3-mars-tok_pisin": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-tok_pisin.json",
    ),
  "region-2-afar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-afar.json"),
  "region-3-afar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-afar.json"),
  "region-2-moon-afar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-afar.json"),
  "region-2-mars-afar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-afar.json"),
  "region-3-mars-afar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-afar.json"),
  "region-2-abkhazian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-abkhazian.json"),
  "region-3-abkhazian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-abkhazian.json"),
  "region-2-moon-abkhazian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-abkhazian.json",
    ),
  "region-2-mars-abkhazian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-abkhazian.json",
    ),
  "region-3-mars-abkhazian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-abkhazian.json",
    ),
  "region-2-afrikaans": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-afrikaans.json"),
  "region-3-afrikaans": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-afrikaans.json"),
  "region-2-moon-afrikaans": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-afrikaans.json",
    ),
  "region-2-mars-afrikaans": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-afrikaans.json",
    ),
  "region-3-mars-afrikaans": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-afrikaans.json",
    ),
  "region-2-akan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-akan.json"),
  "region-3-akan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-akan.json"),
  "region-2-moon-akan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-akan.json"),
  "region-2-mars-akan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-akan.json"),
  "region-3-mars-akan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-akan.json"),
  "region-2-albanian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-albanian.json"),
  "region-3-albanian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-albanian.json"),
  "region-2-moon-albanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-albanian.json",
    ),
  "region-2-mars-albanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-albanian.json",
    ),
  "region-3-mars-albanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-albanian.json",
    ),
  "region-2-aragonese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-aragonese.json"),
  "region-3-aragonese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-aragonese.json"),
  "region-2-moon-aragonese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-aragonese.json",
    ),
  "region-2-mars-aragonese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-aragonese.json",
    ),
  "region-3-mars-aragonese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-aragonese.json",
    ),
  "region-2-armenian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-armenian.json"),
  "region-3-armenian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-armenian.json"),
  "region-2-moon-armenian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-armenian.json",
    ),
  "region-2-mars-armenian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-armenian.json",
    ),
  "region-3-mars-armenian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-armenian.json",
    ),
  "region-2-assamese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-assamese.json"),
  "region-3-assamese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-assamese.json"),
  "region-2-moon-assamese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-assamese.json",
    ),
  "region-2-mars-assamese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-assamese.json",
    ),
  "region-3-mars-assamese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-assamese.json",
    ),
  "region-2-avaric": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-avaric.json"),
  "region-3-avaric": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-avaric.json"),
  "region-2-moon-avaric": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-avaric.json",
    ),
  "region-2-mars-avaric": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-avaric.json",
    ),
  "region-3-mars-avaric": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-avaric.json",
    ),
  "region-2-avestan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-avestan.json"),
  "region-3-avestan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-avestan.json"),
  "region-2-moon-avestan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-avestan.json",
    ),
  "region-2-mars-avestan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-avestan.json",
    ),
  "region-3-mars-avestan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-avestan.json",
    ),
  "region-2-azerbaijani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-azerbaijani.json",
    ),
  "region-3-azerbaijani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-azerbaijani.json",
    ),
  "region-2-moon-azerbaijani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-azerbaijani.json",
    ),
  "region-2-mars-azerbaijani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-azerbaijani.json",
    ),
  "region-3-mars-azerbaijani": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-azerbaijani.json",
    ),
  "region-2-bashkir": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-bashkir.json"),
  "region-3-bashkir": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-bashkir.json"),
  "region-2-moon-bashkir": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-bashkir.json",
    ),
  "region-2-mars-bashkir": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-bashkir.json",
    ),
  "region-3-mars-bashkir": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-bashkir.json",
    ),
  "region-2-basque": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-basque.json"),
  "region-3-basque": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-basque.json"),
  "region-2-moon-basque": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-basque.json",
    ),
  "region-2-mars-basque": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-basque.json",
    ),
  "region-3-mars-basque": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-basque.json",
    ),
  "region-2-belarusian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-belarusian.json"),
  "region-3-belarusian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-belarusian.json"),
  "region-2-moon-belarusian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-belarusian.json",
    ),
  "region-2-mars-belarusian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-belarusian.json",
    ),
  "region-3-mars-belarusian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-belarusian.json",
    ),
  "region-2-bislama": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-bislama.json"),
  "region-3-bislama": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-bislama.json"),
  "region-2-moon-bislama": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-bislama.json",
    ),
  "region-2-mars-bislama": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-bislama.json",
    ),
  "region-3-mars-bislama": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-bislama.json",
    ),
  "region-2-bosnian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-bosnian.json"),
  "region-3-bosnian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-bosnian.json"),
  "region-2-moon-bosnian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-bosnian.json",
    ),
  "region-2-mars-bosnian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-bosnian.json",
    ),
  "region-3-mars-bosnian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-bosnian.json",
    ),
  "region-2-breton": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-breton.json"),
  "region-3-breton": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-breton.json"),
  "region-2-moon-breton": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-breton.json",
    ),
  "region-2-mars-breton": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-breton.json",
    ),
  "region-3-mars-breton": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-breton.json",
    ),
  "region-2-bulgarian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-bulgarian.json"),
  "region-3-bulgarian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-bulgarian.json"),
  "region-2-moon-bulgarian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-bulgarian.json",
    ),
  "region-2-mars-bulgarian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-bulgarian.json",
    ),
  "region-3-mars-bulgarian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-bulgarian.json",
    ),
  "region-2-catalan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-catalan.json"),
  "region-3-catalan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-catalan.json"),
  "region-2-moon-catalan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-catalan.json",
    ),
  "region-2-mars-catalan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-catalan.json",
    ),
  "region-3-mars-catalan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-catalan.json",
    ),
  "region-2-chamorro": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-chamorro.json"),
  "region-3-chamorro": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-chamorro.json"),
  "region-2-moon-chamorro": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-chamorro.json",
    ),
  "region-2-mars-chamorro": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-chamorro.json",
    ),
  "region-3-mars-chamorro": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-chamorro.json",
    ),
  "region-2-chechen": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-chechen.json"),
  "region-3-chechen": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-chechen.json"),
  "region-2-moon-chechen": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-chechen.json",
    ),
  "region-2-mars-chechen": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-chechen.json",
    ),
  "region-3-mars-chechen": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-chechen.json",
    ),
  "region-2-church_slavic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-church_slavic.json",
    ),
  "region-3-church_slavic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-church_slavic.json",
    ),
  "region-2-moon-church_slavic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-church_slavic.json",
    ),
  "region-2-mars-church_slavic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-church_slavic.json",
    ),
  "region-3-mars-church_slavic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-church_slavic.json",
    ),
  "region-2-chuvash": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-chuvash.json"),
  "region-3-chuvash": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-chuvash.json"),
  "region-2-moon-chuvash": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-chuvash.json",
    ),
  "region-2-mars-chuvash": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-chuvash.json",
    ),
  "region-3-mars-chuvash": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-chuvash.json",
    ),
  "region-2-cornish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-cornish.json"),
  "region-3-cornish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-cornish.json"),
  "region-2-moon-cornish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-cornish.json",
    ),
  "region-2-mars-cornish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-cornish.json",
    ),
  "region-3-mars-cornish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-cornish.json",
    ),
  "region-2-corsican": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-corsican.json"),
  "region-3-corsican": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-corsican.json"),
  "region-2-moon-corsican": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-corsican.json",
    ),
  "region-2-mars-corsican": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-corsican.json",
    ),
  "region-3-mars-corsican": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-corsican.json",
    ),
  "region-2-cree": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-cree.json"),
  "region-3-cree": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-cree.json"),
  "region-2-moon-cree": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-cree.json"),
  "region-2-mars-cree": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-cree.json"),
  "region-3-mars-cree": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-cree.json"),
  "region-2-divehi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-divehi.json"),
  "region-3-divehi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-divehi.json"),
  "region-2-moon-divehi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-divehi.json",
    ),
  "region-2-mars-divehi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-divehi.json",
    ),
  "region-3-mars-divehi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-divehi.json",
    ),
  "region-2-dzongkha": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-dzongkha.json"),
  "region-3-dzongkha": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-dzongkha.json"),
  "region-2-moon-dzongkha": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-dzongkha.json",
    ),
  "region-2-mars-dzongkha": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-dzongkha.json",
    ),
  "region-3-mars-dzongkha": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-dzongkha.json",
    ),
  "region-2-esperanto": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-esperanto.json"),
  "region-3-esperanto": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-esperanto.json"),
  "region-2-moon-esperanto": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-esperanto.json",
    ),
  "region-2-mars-esperanto": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-esperanto.json",
    ),
  "region-3-mars-esperanto": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-esperanto.json",
    ),
  "region-2-estonian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-estonian.json"),
  "region-3-estonian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-estonian.json"),
  "region-2-moon-estonian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-estonian.json",
    ),
  "region-2-mars-estonian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-estonian.json",
    ),
  "region-3-mars-estonian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-estonian.json",
    ),
  "region-2-faroese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-faroese.json"),
  "region-3-faroese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-faroese.json"),
  "region-2-moon-faroese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-faroese.json",
    ),
  "region-2-mars-faroese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-faroese.json",
    ),
  "region-3-mars-faroese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-faroese.json",
    ),
  "region-2-fijian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-fijian.json"),
  "region-3-fijian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-fijian.json"),
  "region-2-moon-fijian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-fijian.json",
    ),
  "region-2-mars-fijian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-fijian.json",
    ),
  "region-3-mars-fijian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-fijian.json",
    ),
  "region-2-finnish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-finnish.json"),
  "region-3-finnish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-finnish.json"),
  "region-2-moon-finnish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-finnish.json",
    ),
  "region-2-mars-finnish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-finnish.json",
    ),
  "region-3-mars-finnish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-finnish.json",
    ),
  "region-2-western_frisian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-western_frisian.json",
    ),
  "region-3-western_frisian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-western_frisian.json",
    ),
  "region-2-moon-western_frisian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-western_frisian.json",
    ),
  "region-2-mars-western_frisian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-western_frisian.json",
    ),
  "region-3-mars-western_frisian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-western_frisian.json",
    ),
  "region-2-georgian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-georgian.json"),
  "region-3-georgian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-georgian.json"),
  "region-2-moon-georgian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-georgian.json",
    ),
  "region-2-mars-georgian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-georgian.json",
    ),
  "region-3-mars-georgian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-georgian.json",
    ),
  "region-2-gaelic": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-gaelic.json"),
  "region-3-gaelic": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-gaelic.json"),
  "region-2-moon-gaelic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-gaelic.json",
    ),
  "region-2-mars-gaelic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-gaelic.json",
    ),
  "region-3-mars-gaelic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-gaelic.json",
    ),
  "region-2-irish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-irish.json"),
  "region-3-irish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-irish.json"),
  "region-2-moon-irish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-irish.json"),
  "region-2-mars-irish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-irish.json"),
  "region-3-mars-irish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-irish.json"),
  "region-2-galician": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-galician.json"),
  "region-3-galician": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-galician.json"),
  "region-2-moon-galician": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-galician.json",
    ),
  "region-2-mars-galician": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-galician.json",
    ),
  "region-3-mars-galician": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-galician.json",
    ),
  "region-2-manx": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-manx.json"),
  "region-3-manx": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-manx.json"),
  "region-2-moon-manx": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-manx.json"),
  "region-2-mars-manx": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-manx.json"),
  "region-3-mars-manx": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-manx.json"),
  "region-2-haitian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-haitian.json"),
  "region-3-haitian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-haitian.json"),
  "region-2-moon-haitian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-haitian.json",
    ),
  "region-2-mars-haitian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-haitian.json",
    ),
  "region-3-mars-haitian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-haitian.json",
    ),
  "region-2-hebrew": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-hebrew.json"),
  "region-3-hebrew": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-hebrew.json"),
  "region-2-moon-hebrew": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-hebrew.json",
    ),
  "region-2-mars-hebrew": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-hebrew.json",
    ),
  "region-3-mars-hebrew": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-hebrew.json",
    ),
  "region-2-herero": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-herero.json"),
  "region-3-herero": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-herero.json"),
  "region-2-moon-herero": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-herero.json",
    ),
  "region-2-mars-herero": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-herero.json",
    ),
  "region-3-mars-herero": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-herero.json",
    ),
  "region-2-hiri_motu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-hiri_motu.json"),
  "region-3-hiri_motu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-hiri_motu.json"),
  "region-2-moon-hiri_motu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-hiri_motu.json",
    ),
  "region-2-mars-hiri_motu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-hiri_motu.json",
    ),
  "region-3-mars-hiri_motu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-hiri_motu.json",
    ),
  "region-2-croatian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-croatian.json"),
  "region-3-croatian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-croatian.json"),
  "region-2-moon-croatian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-croatian.json",
    ),
  "region-2-mars-croatian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-croatian.json",
    ),
  "region-3-mars-croatian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-croatian.json",
    ),
  "region-2-igbo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-igbo.json"),
  "region-3-igbo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-igbo.json"),
  "region-2-moon-igbo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-igbo.json"),
  "region-2-mars-igbo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-igbo.json"),
  "region-3-mars-igbo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-igbo.json"),
  "region-2-icelandic": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-icelandic.json"),
  "region-3-icelandic": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-icelandic.json"),
  "region-2-moon-icelandic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-icelandic.json",
    ),
  "region-2-mars-icelandic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-icelandic.json",
    ),
  "region-3-mars-icelandic": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-icelandic.json",
    ),
  "region-2-ido": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-ido.json"),
  "region-3-ido": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-ido.json"),
  "region-2-moon-ido": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-ido.json"),
  "region-2-mars-ido": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-ido.json"),
  "region-3-mars-ido": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-ido.json"),
  "region-2-sichuan_yi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-sichuan_yi.json"),
  "region-3-sichuan_yi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-sichuan_yi.json"),
  "region-2-moon-sichuan_yi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-sichuan_yi.json",
    ),
  "region-2-mars-sichuan_yi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-sichuan_yi.json",
    ),
  "region-3-mars-sichuan_yi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-sichuan_yi.json",
    ),
  "region-2-inuktitut": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-inuktitut.json"),
  "region-3-inuktitut": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-inuktitut.json"),
  "region-2-moon-inuktitut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-inuktitut.json",
    ),
  "region-2-mars-inuktitut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-inuktitut.json",
    ),
  "region-3-mars-inuktitut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-inuktitut.json",
    ),
  "region-2-interlingue": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-interlingue.json",
    ),
  "region-3-interlingue": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-interlingue.json",
    ),
  "region-2-moon-interlingue": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-interlingue.json",
    ),
  "region-2-mars-interlingue": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-interlingue.json",
    ),
  "region-3-mars-interlingue": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-interlingue.json",
    ),
  "region-2-interlingua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-interlingua.json",
    ),
  "region-3-interlingua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-interlingua.json",
    ),
  "region-2-moon-interlingua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-interlingua.json",
    ),
  "region-2-mars-interlingua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-interlingua.json",
    ),
  "region-3-mars-interlingua": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-interlingua.json",
    ),
  "region-2-inupiaq": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-inupiaq.json"),
  "region-3-inupiaq": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-inupiaq.json"),
  "region-2-moon-inupiaq": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-inupiaq.json",
    ),
  "region-2-mars-inupiaq": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-inupiaq.json",
    ),
  "region-3-mars-inupiaq": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-inupiaq.json",
    ),
  "region-2-javanese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-javanese.json"),
  "region-3-javanese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-javanese.json"),
  "region-2-moon-javanese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-javanese.json",
    ),
  "region-2-mars-javanese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-javanese.json",
    ),
  "region-3-mars-javanese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-javanese.json",
    ),
  "region-2-kalaallisut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-kalaallisut.json",
    ),
  "region-3-kalaallisut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-kalaallisut.json",
    ),
  "region-2-moon-kalaallisut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kalaallisut.json",
    ),
  "region-2-mars-kalaallisut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kalaallisut.json",
    ),
  "region-3-mars-kalaallisut": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kalaallisut.json",
    ),
  "region-2-kashmiri": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kashmiri.json"),
  "region-3-kashmiri": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kashmiri.json"),
  "region-2-moon-kashmiri": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kashmiri.json",
    ),
  "region-2-mars-kashmiri": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kashmiri.json",
    ),
  "region-3-mars-kashmiri": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kashmiri.json",
    ),
  "region-2-kazakh": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kazakh.json"),
  "region-3-kazakh": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kazakh.json"),
  "region-2-moon-kazakh": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kazakh.json",
    ),
  "region-2-mars-kazakh": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kazakh.json",
    ),
  "region-3-mars-kazakh": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kazakh.json",
    ),
  "region-2-kikuyu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kikuyu.json"),
  "region-3-kikuyu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kikuyu.json"),
  "region-2-moon-kikuyu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kikuyu.json",
    ),
  "region-2-mars-kikuyu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kikuyu.json",
    ),
  "region-3-mars-kikuyu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kikuyu.json",
    ),
  "region-2-kirghiz": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kirghiz.json"),
  "region-3-kirghiz": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kirghiz.json"),
  "region-2-moon-kirghiz": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kirghiz.json",
    ),
  "region-2-mars-kirghiz": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kirghiz.json",
    ),
  "region-3-mars-kirghiz": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kirghiz.json",
    ),
  "region-2-komi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-komi.json"),
  "region-3-komi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-komi.json"),
  "region-2-moon-komi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-komi.json"),
  "region-2-mars-komi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-komi.json"),
  "region-3-mars-komi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-komi.json"),
  "region-2-kuanyama": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kuanyama.json"),
  "region-3-kuanyama": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kuanyama.json"),
  "region-2-moon-kuanyama": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kuanyama.json",
    ),
  "region-2-mars-kuanyama": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kuanyama.json",
    ),
  "region-3-mars-kuanyama": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kuanyama.json",
    ),
  "region-2-kurdish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kurdish.json"),
  "region-3-kurdish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kurdish.json"),
  "region-2-moon-kurdish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kurdish.json",
    ),
  "region-2-mars-kurdish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kurdish.json",
    ),
  "region-3-mars-kurdish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kurdish.json",
    ),
  "region-2-latin": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-latin.json"),
  "region-3-latin": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-latin.json"),
  "region-2-moon-latin": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-latin.json"),
  "region-2-mars-latin": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-latin.json"),
  "region-3-mars-latin": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-latin.json"),
  "region-2-latvian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-latvian.json"),
  "region-3-latvian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-latvian.json"),
  "region-2-moon-latvian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-latvian.json",
    ),
  "region-2-mars-latvian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-latvian.json",
    ),
  "region-3-mars-latvian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-latvian.json",
    ),
  "region-2-limburgan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-limburgan.json"),
  "region-3-limburgan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-limburgan.json"),
  "region-2-moon-limburgan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-limburgan.json",
    ),
  "region-2-mars-limburgan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-limburgan.json",
    ),
  "region-3-mars-limburgan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-limburgan.json",
    ),
  "region-2-lithuanian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-lithuanian.json"),
  "region-3-lithuanian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-lithuanian.json"),
  "region-2-moon-lithuanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-lithuanian.json",
    ),
  "region-2-mars-lithuanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-lithuanian.json",
    ),
  "region-3-mars-lithuanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-lithuanian.json",
    ),
  "region-2-luxembourgish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-luxembourgish.json",
    ),
  "region-3-luxembourgish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-luxembourgish.json",
    ),
  "region-2-moon-luxembourgish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-luxembourgish.json",
    ),
  "region-2-mars-luxembourgish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-luxembourgish.json",
    ),
  "region-3-mars-luxembourgish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-luxembourgish.json",
    ),
  "region-2-luba_katanga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-luba_katanga.json",
    ),
  "region-3-luba_katanga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-luba_katanga.json",
    ),
  "region-2-moon-luba_katanga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-luba_katanga.json",
    ),
  "region-2-mars-luba_katanga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-luba_katanga.json",
    ),
  "region-3-mars-luba_katanga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-luba_katanga.json",
    ),
  "region-2-macedonian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-macedonian.json"),
  "region-3-macedonian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-macedonian.json"),
  "region-2-moon-macedonian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-macedonian.json",
    ),
  "region-2-mars-macedonian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-macedonian.json",
    ),
  "region-3-mars-macedonian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-macedonian.json",
    ),
  "region-2-marshallese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-marshallese.json",
    ),
  "region-3-marshallese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-marshallese.json",
    ),
  "region-2-moon-marshallese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-marshallese.json",
    ),
  "region-2-mars-marshallese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-marshallese.json",
    ),
  "region-3-mars-marshallese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-marshallese.json",
    ),
  "region-2-maori": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-maori.json"),
  "region-3-maori": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-maori.json"),
  "region-2-moon-maori": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-maori.json"),
  "region-2-mars-maori": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-maori.json"),
  "region-3-mars-maori": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-maori.json"),
  "region-2-malay": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-malay.json"),
  "region-3-malay": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-malay.json"),
  "region-2-moon-malay": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-malay.json"),
  "region-2-mars-malay": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-malay.json"),
  "region-3-mars-malay": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-malay.json"),
  "region-2-maltese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-maltese.json"),
  "region-3-maltese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-maltese.json"),
  "region-2-moon-maltese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-maltese.json",
    ),
  "region-2-mars-maltese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-maltese.json",
    ),
  "region-3-mars-maltese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-maltese.json",
    ),
  "region-2-nauru": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-nauru.json"),
  "region-3-nauru": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-nauru.json"),
  "region-2-moon-nauru": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-nauru.json"),
  "region-2-mars-nauru": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-nauru.json"),
  "region-3-mars-nauru": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-nauru.json"),
  "region-2-navajo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-navajo.json"),
  "region-3-navajo": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-navajo.json"),
  "region-2-moon-navajo": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-navajo.json",
    ),
  "region-2-mars-navajo": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-navajo.json",
    ),
  "region-3-mars-navajo": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-navajo.json",
    ),
  "region-2-south_ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-south_ndebele.json",
    ),
  "region-3-south_ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-south_ndebele.json",
    ),
  "region-2-moon-south_ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-south_ndebele.json",
    ),
  "region-2-mars-south_ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-south_ndebele.json",
    ),
  "region-3-mars-south_ndebele": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-south_ndebele.json",
    ),
  "region-2-ndonga": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-ndonga.json"),
  "region-3-ndonga": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-ndonga.json"),
  "region-2-moon-ndonga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-ndonga.json",
    ),
  "region-2-mars-ndonga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-ndonga.json",
    ),
  "region-3-mars-ndonga": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-ndonga.json",
    ),
  "region-2-norwegian_nynorsk": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-norwegian_nynorsk.json",
    ),
  "region-3-norwegian_nynorsk": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-norwegian_nynorsk.json",
    ),
  "region-2-moon-norwegian_nynorsk": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-norwegian_nynorsk.json",
    ),
  "region-2-mars-norwegian_nynorsk": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-norwegian_nynorsk.json",
    ),
  "region-3-mars-norwegian_nynorsk": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-norwegian_nynorsk.json",
    ),
  "region-2-norwegian_bokm_l": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-norwegian_bokm_l.json",
    ),
  "region-3-norwegian_bokm_l": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-norwegian_bokm_l.json",
    ),
  "region-2-moon-norwegian_bokm_l": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-norwegian_bokm_l.json",
    ),
  "region-2-mars-norwegian_bokm_l": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-norwegian_bokm_l.json",
    ),
  "region-3-mars-norwegian_bokm_l": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-norwegian_bokm_l.json",
    ),
  "region-2-norwegian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-norwegian.json"),
  "region-3-norwegian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-norwegian.json"),
  "region-2-moon-norwegian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-norwegian.json",
    ),
  "region-2-mars-norwegian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-norwegian.json",
    ),
  "region-3-mars-norwegian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-norwegian.json",
    ),
  "region-2-occitan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-occitan.json"),
  "region-3-occitan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-occitan.json"),
  "region-2-moon-occitan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-occitan.json",
    ),
  "region-2-mars-occitan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-occitan.json",
    ),
  "region-3-mars-occitan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-occitan.json",
    ),
  "region-2-ojibwa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-ojibwa.json"),
  "region-3-ojibwa": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-ojibwa.json"),
  "region-2-moon-ojibwa": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-ojibwa.json",
    ),
  "region-2-mars-ojibwa": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-ojibwa.json",
    ),
  "region-3-mars-ojibwa": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-ojibwa.json",
    ),
  "region-2-oriya": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-oriya.json"),
  "region-3-oriya": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-oriya.json"),
  "region-2-moon-oriya": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-oriya.json"),
  "region-2-mars-oriya": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-oriya.json"),
  "region-3-mars-oriya": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-oriya.json"),
  "region-2-ossetian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-ossetian.json"),
  "region-3-ossetian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-ossetian.json"),
  "region-2-moon-ossetian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-ossetian.json",
    ),
  "region-2-mars-ossetian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-ossetian.json",
    ),
  "region-3-mars-ossetian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-ossetian.json",
    ),
  "region-2-panjabi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-panjabi.json"),
  "region-3-panjabi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-panjabi.json"),
  "region-2-moon-panjabi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-panjabi.json",
    ),
  "region-2-mars-panjabi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-panjabi.json",
    ),
  "region-3-mars-panjabi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-panjabi.json",
    ),
  "region-2-pali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-pali.json"),
  "region-3-pali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-pali.json"),
  "region-2-moon-pali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-pali.json"),
  "region-2-mars-pali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-pali.json"),
  "region-3-mars-pali": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-pali.json"),
  "region-2-romansh": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-romansh.json"),
  "region-3-romansh": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-romansh.json"),
  "region-2-moon-romansh": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-romansh.json",
    ),
  "region-2-mars-romansh": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-romansh.json",
    ),
  "region-3-mars-romansh": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-romansh.json",
    ),
  "region-2-sanskrit": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-sanskrit.json"),
  "region-3-sanskrit": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-sanskrit.json"),
  "region-2-moon-sanskrit": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-sanskrit.json",
    ),
  "region-2-mars-sanskrit": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-sanskrit.json",
    ),
  "region-3-mars-sanskrit": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-sanskrit.json",
    ),
  "region-2-slovak": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-slovak.json"),
  "region-3-slovak": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-slovak.json"),
  "region-2-moon-slovak": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-slovak.json",
    ),
  "region-2-mars-slovak": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-slovak.json",
    ),
  "region-3-mars-slovak": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-slovak.json",
    ),
  "region-2-slovenian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-slovenian.json"),
  "region-3-slovenian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-slovenian.json"),
  "region-2-moon-slovenian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-slovenian.json",
    ),
  "region-2-mars-slovenian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-slovenian.json",
    ),
  "region-3-mars-slovenian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-slovenian.json",
    ),
  "region-2-northern_sami": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-northern_sami.json",
    ),
  "region-3-northern_sami": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-northern_sami.json",
    ),
  "region-2-moon-northern_sami": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-northern_sami.json",
    ),
  "region-2-mars-northern_sami": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-northern_sami.json",
    ),
  "region-3-mars-northern_sami": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-northern_sami.json",
    ),
  "region-2-samoan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-samoan.json"),
  "region-3-samoan": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-samoan.json"),
  "region-2-moon-samoan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-samoan.json",
    ),
  "region-2-mars-samoan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-samoan.json",
    ),
  "region-3-mars-samoan": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-samoan.json",
    ),
  "region-2-sindhi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-sindhi.json"),
  "region-3-sindhi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-sindhi.json"),
  "region-2-moon-sindhi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-sindhi.json",
    ),
  "region-2-mars-sindhi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-sindhi.json",
    ),
  "region-3-mars-sindhi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-sindhi.json",
    ),
  "region-2-sotho_southern": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-sotho_southern.json",
    ),
  "region-3-sotho_southern": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-sotho_southern.json",
    ),
  "region-2-moon-sotho_southern": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-sotho_southern.json",
    ),
  "region-2-mars-sotho_southern": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-sotho_southern.json",
    ),
  "region-3-mars-sotho_southern": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-sotho_southern.json",
    ),
  "region-2-sardinian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-sardinian.json"),
  "region-3-sardinian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-sardinian.json"),
  "region-2-moon-sardinian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-sardinian.json",
    ),
  "region-2-mars-sardinian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-sardinian.json",
    ),
  "region-3-mars-sardinian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-sardinian.json",
    ),
  "region-2-serbian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-serbian.json"),
  "region-3-serbian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-serbian.json"),
  "region-2-moon-serbian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-serbian.json",
    ),
  "region-2-mars-serbian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-serbian.json",
    ),
  "region-3-mars-serbian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-serbian.json",
    ),
  "region-2-swati": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-swati.json"),
  "region-3-swati": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-swati.json"),
  "region-2-moon-swati": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-swati.json"),
  "region-2-mars-swati": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-swati.json"),
  "region-3-mars-swati": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-swati.json"),
  "region-2-sundanese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-sundanese.json"),
  "region-3-sundanese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-sundanese.json"),
  "region-2-moon-sundanese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-sundanese.json",
    ),
  "region-2-mars-sundanese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-sundanese.json",
    ),
  "region-3-mars-sundanese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-sundanese.json",
    ),
  "region-2-tahitian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-tahitian.json"),
  "region-3-tahitian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-tahitian.json"),
  "region-2-moon-tahitian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-tahitian.json",
    ),
  "region-2-mars-tahitian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-tahitian.json",
    ),
  "region-3-mars-tahitian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-tahitian.json",
    ),
  "region-2-tatar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-tatar.json"),
  "region-3-tatar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-tatar.json"),
  "region-2-moon-tatar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-tatar.json"),
  "region-2-mars-tatar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-tatar.json"),
  "region-3-mars-tatar": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-tatar.json"),
  "region-2-turkish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-turkish.json"),
  "region-3-turkish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-turkish.json"),
  "region-2-moon-turkish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-turkish.json",
    ),
  "region-2-mars-turkish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-turkish.json",
    ),
  "region-3-mars-turkish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-turkish.json",
    ),
  "region-2-italian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-italian.json"),
  "region-3-italian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-italian.json"),
  "region-2-moon-italian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-italian.json",
    ),
  "region-2-mars-italian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-italian.json",
    ),
  "region-3-mars-italian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-italian.json",
    ),
  "region-2-dutch": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-dutch.json"),
  "region-3-dutch": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-dutch.json"),
  "region-2-moon-dutch": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-dutch.json"),
  "region-2-mars-dutch": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-dutch.json"),
  "region-3-mars-dutch": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-dutch.json"),
  "region-2-polish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-polish.json"),
  "region-3-polish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-polish.json"),
  "region-2-moon-polish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-polish.json",
    ),
  "region-2-mars-polish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-polish.json",
    ),
  "region-3-mars-polish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-polish.json",
    ),
  "region-2-ukrainian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-ukrainian.json"),
  "region-3-ukrainian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-ukrainian.json"),
  "region-2-moon-ukrainian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-ukrainian.json",
    ),
  "region-2-mars-ukrainian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-ukrainian.json",
    ),
  "region-3-mars-ukrainian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-ukrainian.json",
    ),
  "region-2-romanian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-romanian.json"),
  "region-3-romanian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-romanian.json"),
  "region-2-moon-romanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-romanian.json",
    ),
  "region-2-mars-romanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-romanian.json",
    ),
  "region-3-mars-romanian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-romanian.json",
    ),
  "region-2-czech": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-czech.json"),
  "region-3-czech": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-czech.json"),
  "region-2-moon-czech": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-czech.json"),
  "region-2-mars-czech": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-czech.json"),
  "region-3-mars-czech": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-czech.json"),
  "region-2-greek": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-greek.json"),
  "region-3-greek": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-greek.json"),
  "region-2-moon-greek": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-moon-greek.json"),
  "region-2-mars-greek": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-mars-greek.json"),
  "region-3-mars-greek": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-mars-greek.json"),
  "region-2-swedish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-swedish.json"),
  "region-3-swedish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-swedish.json"),
  "region-2-moon-swedish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-swedish.json",
    ),
  "region-2-mars-swedish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-swedish.json",
    ),
  "region-3-mars-swedish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-swedish.json",
    ),
  "region-2-hungarian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-hungarian.json"),
  "region-3-hungarian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-hungarian.json"),
  "region-2-moon-hungarian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-hungarian.json",
    ),
  "region-2-mars-hungarian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-hungarian.json",
    ),
  "region-3-mars-hungarian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-hungarian.json",
    ),
  "region-2-danish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-danish.json"),
  "region-3-danish": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-danish.json"),
  "region-2-moon-danish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-danish.json",
    ),
  "region-2-mars-danish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-danish.json",
    ),
  "region-3-mars-danish": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-danish.json",
    ),
  "region-2-marathi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-marathi.json"),
  "region-3-marathi": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-marathi.json"),
  "region-2-moon-marathi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-marathi.json",
    ),
  "region-2-mars-marathi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-marathi.json",
    ),
  "region-3-mars-marathi": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-marathi.json",
    ),
  "region-2-telugu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-telugu.json"),
  "region-3-telugu": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-telugu.json"),
  "region-2-moon-telugu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-telugu.json",
    ),
  "region-2-mars-telugu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-telugu.json",
    ),
  "region-3-mars-telugu": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-telugu.json",
    ),
  "region-2-gujarati": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-gujarati.json"),
  "region-3-gujarati": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-gujarati.json"),
  "region-2-moon-gujarati": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-gujarati.json",
    ),
  "region-2-mars-gujarati": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-gujarati.json",
    ),
  "region-3-mars-gujarati": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-gujarati.json",
    ),
  "region-2-kannada": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-kannada.json"),
  "region-3-kannada": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-kannada.json"),
  "region-2-moon-kannada": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-kannada.json",
    ),
  "region-2-mars-kannada": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-kannada.json",
    ),
  "region-3-mars-kannada": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-kannada.json",
    ),
  "region-2-malayalam": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-malayalam.json"),
  "region-3-malayalam": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-malayalam.json"),
  "region-2-moon-malayalam": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-malayalam.json",
    ),
  "region-2-mars-malayalam": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-malayalam.json",
    ),
  "region-3-mars-malayalam": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-malayalam.json",
    ),
  "region-2-yoruba": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-yoruba.json"),
  "region-3-yoruba": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-yoruba.json"),
  "region-2-moon-yoruba": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-yoruba.json",
    ),
  "region-2-mars-yoruba": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-yoruba.json",
    ),
  "region-3-mars-yoruba": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-yoruba.json",
    ),
  "region-2-persian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-persian.json"),
  "region-3-persian": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-persian.json"),
  "region-2-moon-persian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-persian.json",
    ),
  "region-2-mars-persian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-persian.json",
    ),
  "region-3-mars-persian": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-persian.json",
    ),
  "region-2-cantonese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-2-cantonese.json"),
  "region-3-cantonese": async () =>
    loadRegionData("@ground-codes/geoint/region-dist/region-3-cantonese.json"),
  "region-2-moon-cantonese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-moon-cantonese.json",
    ),
  "region-2-mars-cantonese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-2-mars-cantonese.json",
    ),
  "region-3-mars-cantonese": async () =>
    loadRegionData(
      "@ground-codes/geoint/region-dist/region-3-mars-cantonese.json",
    ),
};

const loadAddressGapRegionDataset = async (
  datasetName: string,
): Promise<Region[]> => {
  const loader = addressGapRegionLoaders[datasetName];
  if (!loader) throw new Error(`Invalid region dataset: ${datasetName}`);
  return loader();
};

type RegionLookupRow = {
  region: Region;
  codeKey: string;
  nameKey: string;
};

type RegionSearchMatch = RegionLookupRow & {
  matchRank: number;
  distanceKm: number | undefined;
};

const regionLookupCache = new Map<string, Promise<RegionLookupRow[]>>();

const loadRegions = async (
  regionLevel: number,
  language?: SupportedLanguage,
  body: CelestialBody = "earth",
): Promise<Region[]> => {
  const normalizedLanguage = language?.toLowerCase();
  const cacheKey = `${body}:${regionLevel}:${normalizedLanguage ?? "english"}`;
  const cached = regionDataCache.get(cacheKey);
  if (cached) return cached;

  const load = async () => {
    const languageKey = normalizedLanguage ?? "english";
    if (!regionSupportedLanguages.has(languageKey)) {
      throw new Error(`Invalid language: ${language}`);
    }
    if (addressGapLanguages.has(languageKey)) {
      const languageSuffix = `-${languageKey}`;

      if (body === "moon") {
        if (regionLevel !== 2) throw new Error("Moon supports region level 2");
        return loadAddressGapRegionDataset(`region-2-moon${languageSuffix}`);
      }

      if (body === "mars") {
        if (![2, 3].includes(regionLevel)) {
          throw new Error("Mars supports region levels 2 and 3");
        }
        return loadAddressGapRegionDataset(
          `region-${regionLevel}-mars${languageSuffix}`,
        );
      }

      if (regionLevel === 1) {
        return loadRegionData("@ground-codes/geoint/region-dist/region-1.json");
      }

      if ([2, 3].includes(regionLevel)) {
        return loadAddressGapRegionDataset(
          `region-${regionLevel}${languageSuffix}`,
        );
      }

      throw new Error(`Invalid region level: ${regionLevel}`);
    }

    if (body === "moon") {
      if (regionLevel !== 2) throw new Error("Moon supports region level 2");
      if (normalizedLanguage === "korean") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-korean.json",
        );
      }
      if (normalizedLanguage === "chinese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-chinese.json",
        );
      }
      if (normalizedLanguage === "japanese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-japanese.json",
        );
      }
      if (normalizedLanguage === "spanish") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-spanish.json",
        );
      }
      if (normalizedLanguage === "french") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-french.json",
        );
      }
      if (normalizedLanguage === "german") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-german.json",
        );
      }
      if (normalizedLanguage === "portuguese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-portuguese.json",
        );
      }
      if (normalizedLanguage === "indonesian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-indonesian.json",
        );
      }
      if (normalizedLanguage === "thai") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-thai.json",
        );
      }
      if (normalizedLanguage === "vietnamese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-vietnamese.json",
        );
      }
      if (normalizedLanguage === "hindi") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-hindi.json",
        );
      }
      if (normalizedLanguage === "arabic") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-arabic.json",
        );
      }
      if (normalizedLanguage === "russian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-moon-russian.json",
        );
      }
      return loadRegionData(
        "@ground-codes/geoint/region-dist/region-2-moon.json",
      );
    }

    if (body === "mars") {
      if (regionLevel === 3) {
        if (normalizedLanguage === "korean") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-korean.json",
          );
        }
        if (normalizedLanguage === "chinese") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-chinese.json",
          );
        }
        if (normalizedLanguage === "japanese") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-japanese.json",
          );
        }
        if (normalizedLanguage === "spanish") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-spanish.json",
          );
        }
        if (normalizedLanguage === "french") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-french.json",
          );
        }
        if (normalizedLanguage === "german") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-german.json",
          );
        }
        if (normalizedLanguage === "portuguese") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-portuguese.json",
          );
        }
        if (normalizedLanguage === "indonesian") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-indonesian.json",
          );
        }
        if (normalizedLanguage === "thai") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-thai.json",
          );
        }
        if (normalizedLanguage === "vietnamese") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-vietnamese.json",
          );
        }
        if (normalizedLanguage === "hindi") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-hindi.json",
          );
        }
        if (normalizedLanguage === "arabic") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-arabic.json",
          );
        }
        if (normalizedLanguage === "russian") {
          return loadRegionData(
            "@ground-codes/geoint/region-dist/region-3-mars-russian.json",
          );
        }
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-mars.json",
        );
      }
      if (regionLevel !== 2)
        throw new Error("Mars supports region levels 2 and 3");
      if (normalizedLanguage === "korean") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-korean.json",
        );
      }
      if (normalizedLanguage === "chinese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-chinese.json",
        );
      }
      if (normalizedLanguage === "japanese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-japanese.json",
        );
      }
      if (normalizedLanguage === "spanish") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-spanish.json",
        );
      }
      if (normalizedLanguage === "french") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-french.json",
        );
      }
      if (normalizedLanguage === "german") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-german.json",
        );
      }
      if (normalizedLanguage === "portuguese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-portuguese.json",
        );
      }
      if (normalizedLanguage === "indonesian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-indonesian.json",
        );
      }
      if (normalizedLanguage === "thai") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-thai.json",
        );
      }
      if (normalizedLanguage === "vietnamese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-vietnamese.json",
        );
      }
      if (normalizedLanguage === "hindi") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-hindi.json",
        );
      }
      if (normalizedLanguage === "arabic") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-arabic.json",
        );
      }
      if (normalizedLanguage === "russian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-mars-russian.json",
        );
      }
      return loadRegionData(
        "@ground-codes/geoint/region-dist/region-2-mars.json",
      );
    }

    if (regionLevel === 1) {
      return loadRegionData("@ground-codes/geoint/region-dist/region-1.json");
    }

    if (regionLevel === 2) {
      if (!language || normalizedLanguage === "english") {
        return loadRegionData("@ground-codes/geoint/region-dist/region-2.json");
      }
      if (normalizedLanguage === "korean") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-korean.json",
        );
      }
      if (normalizedLanguage === "chinese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-chinese.json",
        );
      }
      if (normalizedLanguage === "japanese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-japanese.json",
        );
      }
      if (normalizedLanguage === "spanish") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-spanish.json",
        );
      }
      if (normalizedLanguage === "french") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-french.json",
        );
      }
      if (normalizedLanguage === "german") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-german.json",
        );
      }
      if (normalizedLanguage === "portuguese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-portuguese.json",
        );
      }
      if (normalizedLanguage === "indonesian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-indonesian.json",
        );
      }
      if (normalizedLanguage === "thai") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-thai.json",
        );
      }
      if (normalizedLanguage === "vietnamese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-vietnamese.json",
        );
      }
      if (normalizedLanguage === "hindi") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-hindi.json",
        );
      }
      if (normalizedLanguage === "arabic") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-arabic.json",
        );
      }
      if (normalizedLanguage === "russian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-2-russian.json",
        );
      }
      if (englishRegionFallbackLanguages.has(normalizedLanguage ?? "")) {
        return loadRegionData("@ground-codes/geoint/region-dist/region-2.json");
      }
      throw new Error(`Invalid language: ${language}`);
    }

    if (regionLevel === 3) {
      if (!language || normalizedLanguage === "english") {
        return loadRegionData("@ground-codes/geoint/region-dist/region-3.json");
      }
      if (normalizedLanguage === "korean") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-korean.json",
        );
      }
      if (normalizedLanguage === "chinese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-chinese.json",
        );
      }
      if (normalizedLanguage === "japanese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-japanese.json",
        );
      }
      if (normalizedLanguage === "spanish") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-spanish.json",
        );
      }
      if (normalizedLanguage === "french") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-french.json",
        );
      }
      if (normalizedLanguage === "german") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-german.json",
        );
      }
      if (normalizedLanguage === "portuguese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-portuguese.json",
        );
      }
      if (normalizedLanguage === "indonesian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-indonesian.json",
        );
      }
      if (normalizedLanguage === "thai") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-thai.json",
        );
      }
      if (normalizedLanguage === "vietnamese") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-vietnamese.json",
        );
      }
      if (normalizedLanguage === "hindi") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-hindi.json",
        );
      }
      if (normalizedLanguage === "arabic") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-arabic.json",
        );
      }
      if (normalizedLanguage === "russian") {
        return loadRegionData(
          "@ground-codes/geoint/region-dist/region-3-russian.json",
        );
      }
      if (englishRegionFallbackLanguages.has(normalizedLanguage ?? "")) {
        return loadRegionData("@ground-codes/geoint/region-dist/region-3.json");
      }
      throw new Error(`Invalid language: ${language}`);
    }

    throw new Error(`Invalid region level: ${regionLevel}`);
  };

  const promise = load().catch((error) => {
    regionDataCache.delete(cacheKey);
    throw error;
  });
  regionDataCache.set(cacheKey, promise);
  return promise;
};

const findClosestInRegions = (
  target: { lat: number; lng: number },
  regions: Region[],
  regionLevel: number,
  body: CelestialBody,
) => {
  let closestRegion: Region | null = null;
  let closestRegionDistance = Infinity;
  const candidateRegions: Region[] = [];
  const targetLng = normalizeLongitudeForBody(target.lng, body);

  for (const region of regions) {
    const regionLng = normalizeLongitudeForBody(region.long, body);
    const distance = calculateDistance(
      target.lat,
      targetLng,
      region.lat,
      regionLng,
      body,
    );

    if (distance < closestRegionDistance) {
      closestRegionDistance = distance;
      closestRegion = {
        name: region.name,
        code: region.code,
        lat: region.lat,
        long: regionLng,
        body,
        regionLevel,
        distanceKm: distance,
        population: region.population,
        countryCode: region.countryCode,
      };
    }

    candidateRegions.push({
      name: region.name,
      code: region.code,
      lat: region.lat,
      long: regionLng,
      body,
      regionLevel,
      distanceKm: distance,
      population: region.population,
      countryCode: region.countryCode,
    });
  }

  if (closestRegion && body === "earth" && regionLevel === 2) {
    const closestPopulation = closestRegion.population ?? 0;
    const prominentRegion = [
      ...candidateRegions.filter(
        (region) =>
          region.countryCode &&
          region.countryCode === closestRegion.countryCode &&
          (region.population ?? 0) >= PROMINENT_REGION_MIN_POPULATION &&
          (region.population ?? 0) >=
            closestPopulation * PROMINENT_REGION_POPULATION_RATIO &&
          (region.distanceKm ?? Infinity) <= PROMINENT_REGION_MAX_DISTANCE_KM &&
          (region.distanceKm ?? Infinity) <=
            closestRegionDistance * PROMINENT_REGION_MAX_DISTANCE_RATIO,
      ),
    ].sort((left, right) => {
      const distanceDelta = (left.distanceKm ?? 0) - (right.distanceKm ?? 0);
      if (Math.abs(distanceDelta) > 1) return distanceDelta;
      return (right.population ?? 0) - (left.population ?? 0);
    })[0];

    if (prominentRegion) return prominentRegion;
  }

  return closestRegion;
};

const toRegionResult = (region: Region) => ({
  name: region.name,
  code: region.code,
  lat: region.lat,
  lng: region.long,
  body: region.body,
  regionLevel: region.regionLevel,
  distanceKm: region.distanceKm,
  population: region.population,
});

const normalizeRegionLookupKey = (value: string) =>
  value
    .replace(/Æ/g, "Ae")
    .replace(/æ/g, "ae")
    .replace(/Œ/g, "Oe")
    .replace(/œ/g, "oe")
    .replace(/Ø/g, "O")
    .replace(/ø/g, "o")
    .replace(/Ð/g, "D")
    .replace(/ð/g, "d")
    .replace(/Þ/g, "Th")
    .replace(/þ/g, "th")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const loadRegionLookupRows = async (
  regionLevel: number,
  language?: SupportedLanguage,
  body: CelestialBody = "earth",
) => {
  const normalizedLanguage = language?.toLowerCase();
  const cacheKey = `${body}:${regionLevel}:${normalizedLanguage ?? "english"}`;
  const cached = regionLookupCache.get(cacheKey);
  if (cached) return cached;

  const promise = loadRegions(regionLevel, language, body)
    .then((regions) =>
      regions.map((region) => ({
        region,
        codeKey: normalizeRegionLookupKey(region.code),
        nameKey: normalizeRegionLookupKey(region.name),
      })),
    )
    .catch((error) => {
      regionLookupCache.delete(cacheKey);
      throw error;
    });
  regionLookupCache.set(cacheKey, promise);
  return promise;
};

export const findClosestRegion = async (
  {
    lat,
    lng,
  }: {
    lat: number;
    lng: number;
  },
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    region2FallbackDistanceKm?: number;
    body?: CelestialBody;
  },
) => {
  const regionStore = getRegionStore();
  if (regionStore) {
    return await regionStore.findClosestRegion({ lat, lng }, options);
  }

  const body = options?.body ?? "earth";
  const regionLevel = options?.regionLevel ?? (body === "earth" ? 1 : 2);
  const language = options?.language;
  const region2FallbackDistanceKm =
    options?.region2FallbackDistanceKm ?? DEFAULT_REGION_2_FALLBACK_DISTANCE_KM;

  try {
    const regions = await loadRegions(regionLevel, language, body);
    const closestRegion = findClosestInRegions(
      { lat, lng },
      regions,
      regionLevel,
      body,
    );

    if (
      regionLevel === 2 &&
      closestRegion &&
      closestRegion.distanceKm !== undefined &&
      ((body === "earth" &&
        closestRegion.distanceKm > region2FallbackDistanceKm) ||
        (body === "mars" &&
          closestRegion.distanceKm >
            DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM))
    ) {
      const fallbackCandidates =
        body === "mars"
          ? [
              closestRegion,
              findClosestInRegions(
                { lat, lng },
                await loadRegions(3, language, body),
                3,
                body,
              ),
            ].filter((region): region is Region => Boolean(region))
          : [
              closestRegion,
              findClosestInRegions(
                { lat, lng },
                await loadRegions(1, undefined, body),
                1,
                body,
              ),
              findClosestInRegions(
                { lat, lng },
                await loadRegions(3, language, body),
                3,
                body,
              ),
            ].filter((region): region is Region => Boolean(region));

      const fallbackRegion = fallbackCandidates.reduce((best, region) =>
        (region.distanceKm ?? Infinity) < (best.distanceKm ?? Infinity)
          ? region
          : best,
      );

      if (fallbackRegion !== closestRegion)
        return toRegionResult(fallbackRegion);
    }

    if (!closestRegion) return null;
    return toRegionResult(closestRegion);
  } catch (error: unknown) {
    console.error("Error importing region data:", error);
    throw new Error(
      `Failed to load region data for level ${regionLevel}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Helper function to find a region by code or name.
 * Searches through the region data to find a region that matches the provided code or name.
 */
export const findRegionByCodeOrName = async (
  codeOrName: string,
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    body?: CelestialBody;
  },
): Promise<{
  lat: number;
  lng: number;
  regionLevel?: number;
  body?: CelestialBody;
  name?: string;
  code?: string;
} | null> => {
  const matches = await findRegionsByQuery(codeOrName, {
    ...options,
    maxResults: 1,
  });

  return matches[0] ?? null;
};

export const findRegionsByQuery = async (
  codeOrName: string,
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
    body?: CelestialBody;
    maxResults?: number;
    biasLat?: number;
    biasLng?: number;
  },
): Promise<
  Array<{
    lat: number;
    lng: number;
    regionLevel?: number;
    body?: CelestialBody;
    name?: string;
    code?: string;
  }>
> => {
  if (!codeOrName || codeOrName.trim() === "") {
    return [];
  }

  const regionStore = getRegionStore();
  if (regionStore) {
    return await regionStore.findRegionsByQuery(codeOrName, options);
  }

  try {
    const {
      regionLevel = 2,
      language,
      body = "earth",
      maxResults = 5,
      biasLat,
      biasLng,
    } = options ?? {};
    const hasSearchBias = Number.isFinite(biasLat) && Number.isFinite(biasLng);
    const normalizedBiasLng = hasSearchBias
      ? normalizeLongitudeForBody(biasLng as number, body)
      : undefined;

    const normalizedSearch = normalizeRegionLookupKey(codeOrName);
    const results: Array<{
      lat: number;
      lng: number;
      regionLevel?: number;
      body?: CelestialBody;
      name?: string;
      code?: string;
    }> = [];
    const seen = new Set<string>();

    const addMatches = async (candidateRegionLevel: number) => {
      const lookupRows = await loadRegionLookupRows(
        candidateRegionLevel,
        language,
        body,
      );
      const matches = lookupRows
        .flatMap((row): RegionSearchMatch[] => {
          const isExact =
            row.codeKey === normalizedSearch ||
            row.nameKey === normalizedSearch;
          const isPartial =
            row.codeKey.includes(normalizedSearch) ||
            row.nameKey.includes(normalizedSearch);
          if (!isExact && !isPartial) return [];

          const matchRank = isExact
            ? 0
            : row.nameKey.startsWith(normalizedSearch)
              ? 1
              : row.codeKey.startsWith(normalizedSearch)
                ? 2
                : 3;
          const distanceKm =
            hasSearchBias && normalizedBiasLng !== undefined
              ? calculateDistance(
                  biasLat as number,
                  normalizedBiasLng,
                  row.region.lat,
                  normalizeLongitudeForBody(row.region.long, body),
                  body,
                )
              : undefined;

          return [{ ...row, matchRank, distanceKm }];
        })
        .sort((a, b) => {
          const aRank = a.nameKey.startsWith(normalizedSearch)
            ? 0
            : a.codeKey.startsWith(normalizedSearch)
              ? 1
              : 2;
          const bRank = b.nameKey.startsWith(normalizedSearch)
            ? 0
            : b.codeKey.startsWith(normalizedSearch)
              ? 1
              : 2;

          return hasSearchBias
            ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
                a.matchRank - b.matchRank ||
                (b.region.population ?? 0) - (a.region.population ?? 0) ||
                a.region.name.length - b.region.name.length
            : a.matchRank - b.matchRank ||
                aRank - bRank ||
                (b.region.population ?? 0) - (a.region.population ?? 0) ||
                a.region.name.length - b.region.name.length;
        });

      for (const { region } of matches) {
        const key = `${body}:${candidateRegionLevel}:${region.code}:${region.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          name: region.name,
          code: region.code,
          lat: region.lat,
          lng: region.long,
          body,
          regionLevel: candidateRegionLevel,
        });
        if (results.length >= maxResults) return;
      }
    };

    await addMatches(regionLevel);
    if (results.length >= maxResults) return results;

    if ((body === "earth" || body === "mars") && regionLevel === 2) {
      const fallbackLevels = body === "mars" ? [3] : [1, 3];
      for (const fallbackLevel of fallbackLevels) {
        await addMatches(fallbackLevel);
        if (results.length >= maxResults) return results;
      }
    }

    return results;
  } catch (e) {
    console.error("Error finding region by code or name:", e);
    return [];
  }
};

/**
 * Calculates the distance between two points on the selected body's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lon1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lon2 - Longitude of the second point in degrees
 * @returns {number} Distance between the points in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  body: CelestialBody = "earth",
): number {
  const R = getBodyMetersPerDegree(body) / 1000 / (Math.PI / 180);

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converts degrees to radians
 *
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
