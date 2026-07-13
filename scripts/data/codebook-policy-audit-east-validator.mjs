import {
  ADDRESS_GAP_LANGUAGES,
  ADDRESS_GAP_MAX_LENGTHS,
  ADDRESS_GAP_SCRIPT_PATTERNS,
  makeAddressGapPronunciationKey,
} from "./codebook-policy-audit-base.mjs";
import {
  CHINESE_GENERATED_COMPOUND_PATTERN,
  JAPANESE_GENERATED_COMPOUND_PATTERN,
  KOREAN_ALLOWED_LOANWORDS,
  KOREAN_ALLOWED_ONE_SYLLABLE,
  KOREAN_GENERATED_COMPOUND_ALLOWED_STANDALONE,
  KOREAN_GENERATED_COMPOUND_ROOT_PATTERN,
  KOREAN_POETIC_ADJECTIVE_PATTERN,
  KOREAN_UNAPPROVED_LOANWORD_PATTERN,
} from "./codebook-policy-audit-expanded-rules.mjs";
import { makeKoreanPronunciationKey } from "./codebook-policy-audit-korean-pronunciation.mjs";

export const auditEastAsianWord = ({
  language,
  index,
  word,
  violations,
  makeViolation,
  addressGapPronunciationKeys,
  koreanPronunciationKeys,
}) => {
  if (ADDRESS_GAP_LANGUAGES.has(language)) {
    if (!ADDRESS_GAP_SCRIPT_PATTERNS[language].test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: `${language}-script`,
          detail:
            "Address-gap codebook entries should stay in the reviewed language script and casing",
        }),
      );
    }
    if (/[\s\-/#?]/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: `${language}-url-safety`,
          detail:
            "Address-gap codebook entries should not contain spaces or URL separators",
        }),
      );
    }
    if ([...word].length > ADDRESS_GAP_MAX_LENGTHS[language]) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: `${language}-too-long`,
          detail:
            "Address-gap codebook entries should stay short for readable share URLs",
        }),
      );
    }

    const pronunciationKey = makeAddressGapPronunciationKey(language, word);
    const previous = addressGapPronunciationKeys.get(pronunciationKey);
    if (previous !== undefined && previous.word !== word) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: `${language}-pronunciation-collision`,
          detail: `Confusable with index ${previous.index} "${previous.word}" under address-gap normalization`,
        }),
      );
    } else {
      addressGapPronunciationKeys.set(pronunciationKey, { index, word });
    }
  }

  if (language === "chinese") {
    if (CHINESE_GENERATED_COMPOUND_PATTERN.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "chinese-generated-material-compound",
          detail:
            "Chinese entries should avoid generated material/object compounds",
        }),
      );
    }
  }

  if (language === "japanese") {
    if ([...word].length > 6) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "japanese-too-long",
          detail:
            "Japanese entries should stay short enough for readable share URLs",
        }),
      );
    }
    if (JAPANESE_GENERATED_COMPOUND_PATTERN.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "japanese-generated-material-compound",
          detail:
            "Japanese entries should avoid generated material/object compounds",
        }),
      );
    }
  }

  if (language === "korean" && !/^[\p{Script=Hangul}]+$/u.test(word)) {
    violations.push(
      makeViolation({
        language,
        index,
        word,
        rule: "korean-script",
        detail: "Korean entries should be written in Hangul",
      }),
    );
  }

  if (language === "korean") {
    if (
      KOREAN_GENERATED_COMPOUND_ROOT_PATTERN.test(word) &&
      [...word].length >= 4 &&
      !KOREAN_GENERATED_COMPOUND_ALLOWED_STANDALONE.has(word)
    ) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "korean-generated-material-compound",
          detail:
            "Korean entries should avoid generated material/nature compounds",
        }),
      );
    }

    if (KOREAN_POETIC_ADJECTIVE_PATTERN.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "korean-poetic-adjective-compound",
          detail:
            "Korean entries should avoid poetic adjective compounds in public address words",
        }),
      );
    }

    if ([...word].length === 1 && !KOREAN_ALLOWED_ONE_SYLLABLE.has(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "korean-weak-one-syllable",
          detail:
            "Korean one-syllable entries need explicit review and should be familiar standalone nouns",
        }),
      );
    }

    if ([...word].length >= 6) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "korean-too-long",
          detail:
            "Korean entries should stay short enough for readable share URLs",
        }),
      );
    }

    if (
      KOREAN_UNAPPROVED_LOANWORD_PATTERN.test(word) &&
      !KOREAN_ALLOWED_LOANWORDS.has(word)
    ) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "korean-unapproved-loanword",
          detail:
            "Korean loanword-style entries should be reviewed allowlist items, not style or product jargon",
        }),
      );
    }

    if (/[채체]반/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "korean-obscure-household-term",
          detail: "Korean entries should avoid uncommon 채반/체반 family terms",
        }),
      );
    }

    const pronunciationKey = makeKoreanPronunciationKey(word);
    const previous = koreanPronunciationKeys.get(pronunciationKey);
    if (previous !== undefined && previous.word !== word) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "korean-pronunciation-collision",
          detail: `Sounds like index ${previous.index} "${previous.word}" under Korean confusion groups`,
        }),
      );
    } else {
      koreanPronunciationKeys.set(pronunciationKey, { index, word });
    }
  }

  if (language === "chinese" && !/^[\p{Script=Han}]+$/u.test(word)) {
    violations.push(
      makeViolation({
        language,
        index,
        word,
        rule: "chinese-script",
        detail: "Chinese entries should be written in Han characters",
      }),
    );
  }

  if (language === "japanese") {
    if (!/^[\p{Script=Hiragana}]+$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "japanese-script",
          detail: "Japanese entries should remain hiragana-visible",
        }),
      );
    }
    if (/[っん]$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "japanese-ending",
          detail: "Japanese entries should not end with small tsu or n",
        }),
      );
    }
    if (/^([\p{Script=Hiragana}])\1$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "japanese-repeated-kana",
          detail: "Repeated-syllable filler should be rejected",
        }),
      );
    }
  }
};
