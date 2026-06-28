import { toBaseN } from "./base-n.js";

export type SupportedLanguage =
  | "english"
  | "korean"
  | "chinese"
  | "japanese"
  | "spanish"
  | "french"
  | "german"
  | "portuguese"
  | "turkish"
  | "italian"
  | "dutch"
  | "polish"
  | "ukrainian"
  | "romanian"
  | "czech"
  | "greek"
  | "swedish"
  | "hungarian"
  | "danish"
  | "indonesian"
  | "thai"
  | "vietnamese"
  | "hindi"
  | "arabic"
  | "russian"
  | "swahili"
  | "filipino"
  | "hausa"
  | "bengali"
  | "urdu"
  | "amharic"
  | "burmese"
  | "khmer"
  | "nepali"
  | "somali"
  | "pashto"
  | "lingala"
  | "mongolian"
  | "lao"
  | "malagasy"
  | "dari"
  | "oromo"
  | "chichewa"
  | "tigrinya"
  | "bambara"
  | "fula"
  | "wolof"
  | "sinhala"
  | "tamil"
  | "kinyarwanda"
  | "kirundi"
  | "krio"
  | "ewe"
  | "fon"
  | "sango"
  | "moore"
  | "kanuri"
  | "quechua"
  | "aymara"
  | "guarani"
  | "kongo"
  | "zarma"
  | "tamasheq"
  | "songhay"
  | "twi"
  | "dagbani"
  | "luganda"
  | "acholi"
  | "dinka"
  | "nuer"
  | "shona"
  | "ndebele"
  | "tok_pisin"
  | "marathi"
  | "telugu"
  | "gujarati"
  | "kannada"
  | "malayalam"
  | "yoruba"
  | "persian"
  | "afar"
  | "abkhazian"
  | "afrikaans"
  | "akan"
  | "albanian"
  | "aragonese"
  | "armenian"
  | "assamese"
  | "avaric"
  | "avestan"
  | "azerbaijani"
  | "bashkir"
  | "basque"
  | "belarusian"
  | "bislama"
  | "bosnian"
  | "breton"
  | "bulgarian"
  | "catalan"
  | "chamorro"
  | "chechen"
  | "church_slavic"
  | "chuvash"
  | "cornish"
  | "corsican"
  | "cree"
  | "divehi"
  | "dzongkha"
  | "esperanto"
  | "estonian"
  | "faroese"
  | "fijian"
  | "finnish"
  | "western_frisian"
  | "georgian"
  | "gaelic"
  | "irish"
  | "galician"
  | "manx"
  | "haitian"
  | "hebrew"
  | "herero"
  | "hiri_motu"
  | "croatian"
  | "igbo"
  | "icelandic"
  | "ido"
  | "sichuan_yi"
  | "inuktitut"
  | "interlingue"
  | "interlingua"
  | "inupiaq"
  | "javanese"
  | "kalaallisut"
  | "kashmiri"
  | "kazakh"
  | "kikuyu"
  | "kirghiz"
  | "komi"
  | "kuanyama"
  | "kurdish"
  | "latin"
  | "latvian"
  | "limburgan"
  | "lithuanian"
  | "luxembourgish"
  | "luba_katanga"
  | "macedonian"
  | "marshallese"
  | "maori"
  | "malay"
  | "maltese"
  | "nauru"
  | "navajo"
  | "south_ndebele"
  | "ndonga"
  | "norwegian_nynorsk"
  | "norwegian_bokm_l"
  | "norwegian"
  | "occitan"
  | "ojibwa"
  | "oriya"
  | "ossetian"
  | "panjabi"
  | "pali"
  | "romansh"
  | "sanskrit"
  | "slovak"
  | "slovenian"
  | "northern_sami"
  | "samoan"
  | "sindhi"
  | "sotho_southern"
  | "sardinian"
  | "serbian"
  | "swati"
  | "sundanese"
  | "tahitian"
  | "tatar"
  | "cantonese";

export const wordSetBaseCount: Record<SupportedLanguage, number> = {
  english: 6000,
  korean: 5630,
  chinese: 5140,
  japanese: 5000,
  spanish: 5000,
  french: 5000,
  german: 5000,
  portuguese: 5000,
  turkish: 5000,
  italian: 5000,
  dutch: 5000,
  polish: 5000,
  ukrainian: 5000,
  romanian: 5000,
  czech: 5000,
  greek: 5000,
  swedish: 5000,
  hungarian: 5000,
  danish: 5000,
  indonesian: 5000,
  thai: 5000,
  vietnamese: 5000,
  hindi: 5000,
  arabic: 5000,
  russian: 5000,
  swahili: 5000,
  filipino: 5000,
  hausa: 5000,
  bengali: 5000,
  urdu: 5000,
  amharic: 5000,
  burmese: 5000,
  khmer: 5000,
  nepali: 5000,
  somali: 5000,
  pashto: 5000,
  lingala: 5000,
  mongolian: 5000,
  lao: 5000,
  malagasy: 5000,
  dari: 5000,
  oromo: 5000,
  chichewa: 5000,
  tigrinya: 5000,
  bambara: 5000,
  fula: 5000,
  wolof: 5000,
  sinhala: 5000,
  tamil: 5000,
  kinyarwanda: 5000,
  kirundi: 5000,
  krio: 5000,
  ewe: 5000,
  fon: 5000,
  sango: 5000,
  moore: 5000,
  kanuri: 5000,
  quechua: 5000,
  aymara: 5000,
  guarani: 5000,
  kongo: 5000,
  zarma: 5000,
  tamasheq: 5000,
  songhay: 5000,
  twi: 5000,
  dagbani: 5000,
  luganda: 5000,
  acholi: 5000,
  dinka: 5000,
  nuer: 5000,
  shona: 5000,
  ndebele: 5000,
  tok_pisin: 5000,
  marathi: 5000,
  telugu: 5000,
  gujarati: 5000,
  kannada: 5000,
  malayalam: 5000,
  yoruba: 5000,
  persian: 5000,
  cantonese: 5000,
  afar: 5000,
  abkhazian: 5000,
  afrikaans: 5000,
  akan: 5000,
  albanian: 5000,
  aragonese: 5000,
  armenian: 5000,
  assamese: 5000,
  avaric: 5000,
  avestan: 5000,
  azerbaijani: 5000,
  bashkir: 5000,
  basque: 5000,
  belarusian: 5000,
  bislama: 5000,
  bosnian: 5000,
  breton: 5000,
  bulgarian: 5000,
  catalan: 5000,
  chamorro: 5000,
  chechen: 5000,
  church_slavic: 5000,
  chuvash: 5000,
  cornish: 5000,
  corsican: 5000,
  cree: 5000,
  divehi: 5000,
  dzongkha: 5000,
  esperanto: 5000,
  estonian: 5000,
  faroese: 5000,
  fijian: 5000,
  finnish: 5000,
  western_frisian: 5000,
  georgian: 5000,
  gaelic: 5000,
  irish: 5000,
  galician: 5000,
  manx: 5000,
  haitian: 5000,
  hebrew: 5000,
  herero: 5000,
  hiri_motu: 5000,
  croatian: 5000,
  igbo: 5000,
  icelandic: 5000,
  ido: 5000,
  sichuan_yi: 5000,
  inuktitut: 5000,
  interlingue: 5000,
  interlingua: 5000,
  inupiaq: 5000,
  javanese: 5000,
  kalaallisut: 5000,
  kashmiri: 5000,
  kazakh: 5000,
  kikuyu: 5000,
  kirghiz: 5000,
  komi: 5000,
  kuanyama: 5000,
  kurdish: 5000,
  latin: 5000,
  latvian: 5000,
  limburgan: 5000,
  lithuanian: 5000,
  luxembourgish: 5000,
  luba_katanga: 5000,
  macedonian: 5000,
  marshallese: 5000,
  maori: 5000,
  malay: 5000,
  maltese: 5000,
  nauru: 5000,
  navajo: 5000,
  south_ndebele: 5000,
  ndonga: 5000,
  norwegian_nynorsk: 5000,
  norwegian_bokm_l: 5000,
  norwegian: 5000,
  occitan: 5000,
  ojibwa: 5000,
  oriya: 5000,
  ossetian: 5000,
  panjabi: 5000,
  pali: 5000,
  romansh: 5000,
  sanskrit: 5000,
  slovak: 5000,
  slovenian: 5000,
  northern_sami: 5000,
  samoan: 5000,
  sindhi: 5000,
  sotho_southern: 5000,
  sardinian: 5000,
  serbian: 5000,
  swati: 5000,
  sundanese: 5000,
  tahitian: 5000,
  tatar: 5000,
};

const loadWordSet = async (language: SupportedLanguage) => {
  if (language.toLowerCase() === "english") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/english.json"))
      .default as string[];
  } else if (language.toLowerCase() === "korean") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/korean.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chinese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/chinese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "japanese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/japanese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "spanish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/spanish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "french") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/french.json"))
      .default as string[];
  } else if (language.toLowerCase() === "german") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/german.json"))
      .default as string[];
  } else if (language.toLowerCase() === "portuguese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/portuguese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "turkish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/turkish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "italian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/italian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dutch") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dutch.json"))
      .default as string[];
  } else if (language.toLowerCase() === "polish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/polish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ukrainian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ukrainian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "romanian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/romanian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "czech") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/czech.json"))
      .default as string[];
  } else if (language.toLowerCase() === "greek") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/greek.json"))
      .default as string[];
  } else if (language.toLowerCase() === "swedish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/swedish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "hungarian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/hungarian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "danish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/danish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "indonesian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/indonesian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "thai") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/thai.json"))
      .default as string[];
  } else if (language.toLowerCase() === "vietnamese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/vietnamese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "hindi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/hindi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "arabic") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/arabic.json"))
      .default as string[];
  } else if (language.toLowerCase() === "russian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/russian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "swahili") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/swahili.json"))
      .default as string[];
  } else if (language.toLowerCase() === "filipino") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/filipino.json"))
      .default as string[];
  } else if (language.toLowerCase() === "hausa") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/hausa.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bengali") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bengali.json"))
      .default as string[];
  } else if (language.toLowerCase() === "urdu") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/urdu.json"))
      .default as string[];
  } else if (language.toLowerCase() === "amharic") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/amharic.json"))
      .default as string[];
  } else if (language.toLowerCase() === "burmese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/burmese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "khmer") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/khmer.json"))
      .default as string[];
  } else if (language.toLowerCase() === "nepali") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/nepali.json"))
      .default as string[];
  } else if (language.toLowerCase() === "somali") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/somali.json"))
      .default as string[];
  } else if (language.toLowerCase() === "pashto") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/pashto.json"))
      .default as string[];
  } else if (language.toLowerCase() === "lingala") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/lingala.json"))
      .default as string[];
  } else if (language.toLowerCase() === "mongolian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/mongolian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "lao") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/lao.json"))
      .default as string[];
  } else if (language.toLowerCase() === "malagasy") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/malagasy.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dari") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dari.json"))
      .default as string[];
  } else if (language.toLowerCase() === "oromo") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/oromo.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chichewa") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/chichewa.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tigrinya") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tigrinya.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bambara") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bambara.json"))
      .default as string[];
  } else if (language.toLowerCase() === "fula") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/fula.json"))
      .default as string[];
  } else if (language.toLowerCase() === "wolof") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/wolof.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sinhala") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sinhala.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tamil") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tamil.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kinyarwanda") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kinyarwanda.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kirundi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kirundi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "krio") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/krio.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ewe") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ewe.json"))
      .default as string[];
  } else if (language.toLowerCase() === "fon") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/fon.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sango") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sango.json"))
      .default as string[];
  } else if (language.toLowerCase() === "moore") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/moore.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kanuri") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kanuri.json"))
      .default as string[];
  } else if (language.toLowerCase() === "quechua") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/quechua.json"))
      .default as string[];
  } else if (language.toLowerCase() === "aymara") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/aymara.json"))
      .default as string[];
  } else if (language.toLowerCase() === "guarani") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/guarani.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kongo") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kongo.json"))
      .default as string[];
  } else if (language.toLowerCase() === "zarma") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/zarma.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tamasheq") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tamasheq.json"))
      .default as string[];
  } else if (language.toLowerCase() === "songhay") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/songhay.json"))
      .default as string[];
  } else if (language.toLowerCase() === "twi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/twi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dagbani") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dagbani.json"))
      .default as string[];
  } else if (language.toLowerCase() === "luganda") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/luganda.json"))
      .default as string[];
  } else if (language.toLowerCase() === "acholi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/acholi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dinka") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dinka.json"))
      .default as string[];
  } else if (language.toLowerCase() === "nuer") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/nuer.json"))
      .default as string[];
  } else if (language.toLowerCase() === "shona") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/shona.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ndebele") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ndebele.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tok_pisin") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tok_pisin.json"))
      .default as string[];
  } else if (language.toLowerCase() === "marathi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/marathi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "telugu") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/telugu.json"))
      .default as string[];
  } else if (language.toLowerCase() === "gujarati") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/gujarati.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kannada") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kannada.json"))
      .default as string[];
  } else if (language.toLowerCase() === "malayalam") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/malayalam.json"))
      .default as string[];
  } else if (language.toLowerCase() === "yoruba") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/yoruba.json"))
      .default as string[];
  } else if (language.toLowerCase() === "persian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/persian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "cantonese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/cantonese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "afar") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/afar.json"))
      .default as string[];
  } else if (language.toLowerCase() === "abkhazian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/abkhazian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "afrikaans") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/afrikaans.json"))
      .default as string[];
  } else if (language.toLowerCase() === "akan") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/akan.json"))
      .default as string[];
  } else if (language.toLowerCase() === "albanian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/albanian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "aragonese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/aragonese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "armenian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/armenian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "assamese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/assamese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "avaric") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/avaric.json"))
      .default as string[];
  } else if (language.toLowerCase() === "avestan") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/avestan.json"))
      .default as string[];
  } else if (language.toLowerCase() === "azerbaijani") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/azerbaijani.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bashkir") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bashkir.json"))
      .default as string[];
  } else if (language.toLowerCase() === "basque") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/basque.json"))
      .default as string[];
  } else if (language.toLowerCase() === "belarusian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/belarusian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bislama") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bislama.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bosnian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bosnian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "breton") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/breton.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bulgarian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bulgarian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "catalan") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/catalan.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chamorro") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/chamorro.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chechen") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/chechen.json"))
      .default as string[];
  } else if (language.toLowerCase() === "church_slavic") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/church_slavic.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chuvash") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/chuvash.json"))
      .default as string[];
  } else if (language.toLowerCase() === "cornish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/cornish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "corsican") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/corsican.json"))
      .default as string[];
  } else if (language.toLowerCase() === "cree") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/cree.json"))
      .default as string[];
  } else if (language.toLowerCase() === "divehi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/divehi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dzongkha") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dzongkha.json"))
      .default as string[];
  } else if (language.toLowerCase() === "esperanto") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/esperanto.json"))
      .default as string[];
  } else if (language.toLowerCase() === "estonian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/estonian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "faroese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/faroese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "fijian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/fijian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "finnish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/finnish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "western_frisian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/western_frisian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "georgian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/georgian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "gaelic") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/gaelic.json"))
      .default as string[];
  } else if (language.toLowerCase() === "irish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/irish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "galician") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/galician.json"))
      .default as string[];
  } else if (language.toLowerCase() === "manx") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/manx.json"))
      .default as string[];
  } else if (language.toLowerCase() === "haitian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/haitian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "hebrew") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/hebrew.json"))
      .default as string[];
  } else if (language.toLowerCase() === "herero") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/herero.json"))
      .default as string[];
  } else if (language.toLowerCase() === "hiri_motu") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/hiri_motu.json"))
      .default as string[];
  } else if (language.toLowerCase() === "croatian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/croatian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "igbo") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/igbo.json"))
      .default as string[];
  } else if (language.toLowerCase() === "icelandic") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/icelandic.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ido") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ido.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sichuan_yi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sichuan_yi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "inuktitut") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/inuktitut.json"))
      .default as string[];
  } else if (language.toLowerCase() === "interlingue") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/interlingue.json"))
      .default as string[];
  } else if (language.toLowerCase() === "interlingua") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/interlingua.json"))
      .default as string[];
  } else if (language.toLowerCase() === "inupiaq") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/inupiaq.json"))
      .default as string[];
  } else if (language.toLowerCase() === "javanese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/javanese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kalaallisut") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kalaallisut.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kashmiri") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kashmiri.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kazakh") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kazakh.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kikuyu") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kikuyu.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kirghiz") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kirghiz.json"))
      .default as string[];
  } else if (language.toLowerCase() === "komi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/komi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kuanyama") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kuanyama.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kurdish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kurdish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "latin") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/latin.json"))
      .default as string[];
  } else if (language.toLowerCase() === "latvian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/latvian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "limburgan") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/limburgan.json"))
      .default as string[];
  } else if (language.toLowerCase() === "lithuanian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/lithuanian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "luxembourgish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/luxembourgish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "luba_katanga") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/luba_katanga.json"))
      .default as string[];
  } else if (language.toLowerCase() === "macedonian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/macedonian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "marshallese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/marshallese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "maori") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/maori.json"))
      .default as string[];
  } else if (language.toLowerCase() === "malay") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/malay.json"))
      .default as string[];
  } else if (language.toLowerCase() === "maltese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/maltese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "nauru") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/nauru.json"))
      .default as string[];
  } else if (language.toLowerCase() === "navajo") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/navajo.json"))
      .default as string[];
  } else if (language.toLowerCase() === "south_ndebele") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/south_ndebele.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ndonga") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ndonga.json"))
      .default as string[];
  } else if (language.toLowerCase() === "norwegian_nynorsk") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/norwegian_nynorsk.json"))
      .default as string[];
  } else if (language.toLowerCase() === "norwegian_bokm_l") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/norwegian_bokm_l.json"))
      .default as string[];
  } else if (language.toLowerCase() === "norwegian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/norwegian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "occitan") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/occitan.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ojibwa") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ojibwa.json"))
      .default as string[];
  } else if (language.toLowerCase() === "oriya") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/oriya.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ossetian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ossetian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "panjabi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/panjabi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "pali") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/pali.json"))
      .default as string[];
  } else if (language.toLowerCase() === "romansh") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/romansh.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sanskrit") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sanskrit.json"))
      .default as string[];
  } else if (language.toLowerCase() === "slovak") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/slovak.json"))
      .default as string[];
  } else if (language.toLowerCase() === "slovenian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/slovenian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "northern_sami") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/northern_sami.json"))
      .default as string[];
  } else if (language.toLowerCase() === "samoan") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/samoan.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sindhi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sindhi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sotho_southern") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sotho_southern.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sardinian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sardinian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "serbian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/serbian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "swati") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/swati.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sundanese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sundanese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tahitian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tahitian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tatar") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tatar.json"))
      .default as string[];
  }

  throw new Error(`Invalid language: ${language}`);
};

export const encodeByWordSet = async ({
  n,
  language = "english",
}: {
  n: number;
  language?: SupportedLanguage;
}) => {
  const baseSet = toBaseN(n, wordSetBaseCount[language]);
  const wordSet = await loadWordSet(language);

  const encodedBaseSet = baseSet.map((digit) => wordSet[digit]);
  return encodedBaseSet.join("-");
};

/**
 * Decodes a word set encoded string back to a number.
 * This is the inverse of encodeByWordSet.
 */
export const decodeByWordSet = async ({
  encoded,
  language = "english",
}: {
  encoded: string;
  language?: SupportedLanguage;
}): Promise<number> => {
  if (!encoded) {
    throw new Error("Encoded string is required");
  }

  // Split the encoded string by hyphens to get individual words
  const words = encoded.split("-");

  // Load the appropriate word set based on language
  const wordSet = await loadWordSet(language);

  // Convert words back to their indices in the word set
  const indices = words.map((word) => {
    const index = wordSet.indexOf(word);
    if (index === -1) {
      throw new Error(`Word '${word}' not found in the ${language} word set`);
    }
    return index;
  });

  // Convert from base-N back to a single number
  // This is the inverse of toBaseN used in encodeByWordSet
  const base = wordSetBaseCount[language];
  let result = 0;
  for (let i = 0; i < indices.length; i++) {
    result = result * base + indices[i]!;
  }

  return result;
};
