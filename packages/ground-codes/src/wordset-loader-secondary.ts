import type { SupportedLanguage } from "./wordset-language.js";

export const loadSecondaryWordSet = async (
  language: SupportedLanguage,
): Promise<string[] | null> => {
  if (language.toLowerCase() === "avestan") {
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

  return null;
};
