import {
  ENGLISH_GENERATED_COMPOUND_PATTERN,
  SPANISH_GENERATED_COMPOUND_PATTERN,
} from "./codebook-policy-audit-blocked-east-europe.mjs";
import {
  isAwkwardGermanCompound,
  isAwkwardIndonesianCompound,
  isAwkwardPortugueseCompound,
} from "./codebook-policy-audit-european-rules.mjs";

export const auditLatinWord = ({
  language,
  index,
  word,
  violations,
  makeViolation,
}) => {
  if (language === "english") {
    if (!/^[A-Z][a-z]+$/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "english-shape",
          detail: "English entries should use ordinary title-case words",
        }),
      );
    }
    if (word.length > 12) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "english-too-long",
          detail: "English entries should stay short for URL readability",
        }),
      );
    }
    if (/(ough|augh|psy|sch|corps)/i.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "english-hard-pronunciation",
          detail: "Guide rejects hard clusters and silent-letter patterns",
        }),
      );
    }
    if (ENGLISH_GENERATED_COMPOUND_PATTERN.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "english-generated-material-compound",
          detail:
            "English entries should avoid generated material/nature compounds",
        }),
      );
    }
  }

  if (language === "spanish") {
    if (!/^[A-Z][a-z]+$/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "spanish-shape",
          detail:
            "Spanish URL codebook entries should use ASCII title-case words",
        }),
      );
    }
    if (word.length > 12) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "spanish-too-long",
          detail: "Spanish entries should stay short for URL readability",
        }),
      );
    }
    if (SPANISH_GENERATED_COMPOUND_PATTERN.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "spanish-generated-material-compound",
          detail:
            "Spanish entries should avoid fused generated material/object compounds",
        }),
      );
    }
  }

  if (language === "french") {
    if (!/^[A-Z][a-z]+$/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "french-shape",
          detail:
            "French URL codebook entries should use ASCII title-case words",
        }),
      );
    }
    if (word.length > 12) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "french-too-long",
          detail: "French entries should stay short for URL readability",
        }),
      );
    }
  }

  if (language === "german") {
    if (isAwkwardGermanCompound(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "german-awkward-generated-compound",
          detail:
            "German generated compounds should avoid self-duplication and implausible object pairings",
        }),
      );
    }
    if (!/^[A-Z][a-z]+$/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "german-shape",
          detail:
            "German URL codebook entries should use ASCII title-case words",
        }),
      );
    }
    if (word.length > 12) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "german-too-long",
          detail: "German entries should stay short for URL readability",
        }),
      );
    }
  }

  if (language === "portuguese") {
    if (isAwkwardPortugueseCompound(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "portuguese-awkward-generated-compound",
          detail:
            "Portuguese generated compounds should avoid self-duplication and implausible object pairings",
        }),
      );
    }
    if (!/^[A-Z][a-z]+$/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "portuguese-shape",
          detail:
            "Portuguese URL codebook entries should use ASCII title-case words",
        }),
      );
    }
    if (word.length > 12) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "portuguese-too-long",
          detail: "Portuguese entries should stay short for URL readability",
        }),
      );
    }
  }

  if (language === "indonesian") {
    if (isAwkwardIndonesianCompound(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "indonesian-awkward-generated-compound",
          detail:
            "Indonesian generated compounds should avoid self-duplication and implausible object pairings",
        }),
      );
    }
    if (!/^[A-Z][a-z]+$/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "indonesian-shape",
          detail:
            "Indonesian URL codebook entries should use ASCII title-case words",
        }),
      );
    }
    if (word.length > 12) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "indonesian-too-long",
          detail: "Indonesian entries should stay short for URL readability",
        }),
      );
    }
  }
};
