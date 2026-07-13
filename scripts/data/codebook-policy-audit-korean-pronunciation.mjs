export const HANGUL_BASE = 0xac00;
export const HANGUL_END = 0xd7a3;
export const HANGUL_VOWEL_COUNT = 21;
export const HANGUL_FINAL_COUNT = 28;
export const KOREAN_VOWEL_CONFUSION_GROUPS = new Map([
  [1, "E"], // ㅐ
  [5, "E"], // ㅔ
]);

export const makeKoreanPronunciationKey = (word) =>
  [...word]
    .map((char) => {
      const code = char.codePointAt(0);
      if (code < HANGUL_BASE || code > HANGUL_END) return char;

      const offset = code - HANGUL_BASE;
      const initial = Math.floor(
        offset / (HANGUL_VOWEL_COUNT * HANGUL_FINAL_COUNT),
      );
      const vowel = Math.floor(
        (offset % (HANGUL_VOWEL_COUNT * HANGUL_FINAL_COUNT)) /
          HANGUL_FINAL_COUNT,
      );
      const final = offset % HANGUL_FINAL_COUNT;
      const normalizedVowel = KOREAN_VOWEL_CONFUSION_GROUPS.get(vowel) ?? vowel;

      return `${initial}:${normalizedVowel}:${final}`;
    })
    .join("|");
