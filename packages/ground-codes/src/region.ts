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
]);

const englishRegionFallbackLanguages = new Set([
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
