import { toBaseN } from "./base-n.js";

export type SupportedLanguage = "English" | "Korean";

export const WordSetBaseCount: Record<SupportedLanguage, number> = {
  English: 6000,
  Korean: 5630,
};

export const encodeByWordSet = async ({
  n,
  language = "English",
}: {
  n: number;
  language?: SupportedLanguage;
}) => {
  let wordSet: string[] | null = null;
  const baseSet = toBaseN(n, WordSetBaseCount[language]);
  if (language === "English") {
    wordSet = (await import("../codebook-dist/english.json"))
      .default as string[];
  } else if (language === "Korean") {
    wordSet = (await import("../codebook-dist/korean.json"))
      .default as string[];
  } else {
    throw new Error(`Invalid language: ${language}`);
  }

  const encodedBaseSet = baseSet.map((digit) => wordSet![digit]);
  return encodedBaseSet.join("-");
};
