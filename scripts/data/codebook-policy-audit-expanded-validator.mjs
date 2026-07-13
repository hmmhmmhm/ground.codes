import {
  isAwkwardArabicCompound,
  isAwkwardHindiCompound,
  isAwkwardThaiCompound,
  isAwkwardVietnameseCompound,
} from "./codebook-policy-audit-expanded-rules.mjs";

export const auditExpandedWord = ({
  language,
  index,
  word,
  violations,
  makeViolation,
}) => {
  if (language === "thai") {
    if (isAwkwardThaiCompound(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "thai-awkward-generated-compound",
          detail:
            "Thai generated compounds should avoid broad noun/adjective pairings that read as template output",
        }),
      );
    }
    if (!/^[\p{Script=Thai}]+$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "thai-script",
          detail: "Thai entries should be written in Thai script",
        }),
      );
    }
    if ([...word].length > 12) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "thai-too-long",
          detail: "Thai entries should stay short for readable share URLs",
        }),
      );
    }
  }

  if (language === "vietnamese") {
    if (isAwkwardVietnameseCompound(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "vietnamese-awkward-generated-compound",
          detail:
            "Vietnamese generated compounds should avoid broad adjective templates and implausible fused noun pairings",
        }),
      );
    }
    if (!/^[\p{Script=Latin}\p{Mark}]+$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "vietnamese-script",
          detail: "Vietnamese entries should use Vietnamese Latin letters only",
        }),
      );
    }
    if (/[\s\-/#?]/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "vietnamese-url-safety",
          detail:
            "Vietnamese entries should not contain spaces or URL separators",
        }),
      );
    }
    if ([...word].length > 14) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "vietnamese-too-long",
          detail:
            "Vietnamese entries should stay short for readable share URLs",
        }),
      );
    }
  }

  if (language === "hindi") {
    if (isAwkwardHindiCompound(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "hindi-awkward-generated-compound",
          detail:
            "Hindi generated compounds should avoid broad object/place or object/material pairings that read as template output",
        }),
      );
    }
    if (!/^[\p{Script=Devanagari}\p{Mark}]+$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "hindi-script",
          detail: "Hindi entries should use Devanagari letters only",
        }),
      );
    }
    if (/[\s\-/#?]/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "hindi-url-safety",
          detail: "Hindi entries should not contain spaces or URL separators",
        }),
      );
    }
    if ([...word].length > 14) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "hindi-too-long",
          detail: "Hindi entries should stay short for readable share URLs",
        }),
      );
    }
  }

  if (language === "arabic") {
    if (isAwkwardArabicCompound(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "arabic-awkward-generated-compound",
          detail:
            "Arabic generated compounds should avoid abstract mood/value prefixes fused to concrete objects",
        }),
      );
    }
    if (!/^[\p{Script=Arabic}\p{Mark}]+$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "arabic-script",
          detail: "Arabic entries should use Arabic letters only",
        }),
      );
    }
    if (/[\s\-/#?]/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "arabic-url-safety",
          detail: "Arabic entries should not contain spaces or URL separators",
        }),
      );
    }
    if ([...word].length > 14) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "arabic-too-long",
          detail: "Arabic entries should stay short for readable share URLs",
        }),
      );
    }
  }

  if (language === "russian") {
    if (!/^[\p{Script=Cyrillic}\p{Mark}]+$/u.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "russian-script",
          detail: "Russian entries should use Cyrillic letters only",
        }),
      );
    }
    if (/[\s\-/#?]/.test(word)) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "russian-url-safety",
          detail: "Russian entries should not contain spaces or URL separators",
        }),
      );
    }
    if ([...word].length > 14) {
      violations.push(
        makeViolation({
          language,
          index,
          word,
          rule: "russian-too-long",
          detail: "Russian entries should stay short for readable share URLs",
        }),
      );
    }
  }
};
