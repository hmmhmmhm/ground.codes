import type { SupportedLanguage } from "./wordset-language.js";

export const loadPrimaryWordSet = async (
  language: SupportedLanguage,
): Promise<string[] | null> => {
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
  }

  return null;
};
