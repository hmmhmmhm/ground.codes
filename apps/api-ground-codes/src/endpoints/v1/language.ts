export const supportedLanguages = [
  "english",
  "korean",
  "chinese",
  "japanese",
  "spanish",
  "french",
  "german",
  "portuguese",
  "indonesian",
  "thai",
  "vietnamese",
  "hindi",
  "arabic",
] as const;

export const getRegionDatasetName = ({
  body,
  language,
  regionLevel,
}: {
  body: string;
  language: string;
  regionLevel: number;
}) => {
  const normalizedBody = body.toLowerCase();
  const normalizedLanguage = language.toLowerCase();
  const languageSuffix =
    normalizedLanguage === "english" ? "" : `-${normalizedLanguage}`;

  return normalizedBody === "earth"
    ? `region-${regionLevel}${languageSuffix}`
    : `region-${regionLevel}-${normalizedBody}${languageSuffix}`;
};
