# 📖 Codebook Package

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
  <br />
  <br />
</p>

## 📋 Overview

The Codebook package is a specialized word collection developed for the ground.codes project. It functions similarly to numerical base systems (like base32), but instead uses words as the basic units. This allows for the representation of data using human-readable words rather than abstract symbols or numbers.

## 📌 Authoring Policy

The canonical policy for creating, reviewing, and replacing codebook words is
[`CODEBOOK_GUIDE.md`](./CODEBOOK_GUIDE.md). Read it before running generation,
refinement, manual review, or distribution updates.
Current language-by-language review status is tracked in
[`LANGUAGE_QUALITY.md`](./LANGUAGE_QUALITY.md).

## 🎯 Purpose

The primary purpose of the Codebook is to provide a dictionary of words that can be used systematically in various applications within the ground.codes ecosystem, such as generating memorable identifiers, creating readable codes, or establishing unique naming conventions.

## 📚 Dictionary Composition

- 🇬🇧 **English Codebook**: Contains 6,000 curated words
- 🇰🇷 **Korean Codebook**: Contains 5,630 curated words
- 🇨🇳 **Chinese Codebook**: Contains 5,140 curated words
- 🇯🇵 **Japanese Codebook**: Contains 5,000 frequency-guided hiragana words
- 🇪🇸 **Spanish Codebook**: Contains 5,000 URL-safe curated words
- 🇫🇷 **French Codebook**: Contains 5,000 URL-safe curated words
- 🇩🇪 **German Codebook**: Contains 5,000 URL-safe curated words
- 🇵🇹 **Portuguese Codebook**: Contains 5,000 URL-safe curated words
- 🇮🇩 **Indonesian Codebook**: Contains 5,000 URL-safe curated words
- 🇹🇭 **Thai Codebook**: Contains 5,000 Thai-script curated words
- 🇻🇳 **Vietnamese Codebook**: Contains 5,000 Vietnamese Latin-script curated words
- 🇮🇳 **Hindi Codebook**: Contains 5,000 Devanagari-script curated words

## 🤖 Word Generation Process

The word dictionaries are constructed using generative AI through the following process:

1. The system uses 1,118 question subjects found in `codebook-dataset/question-subjects.json`
2. For each subject, the AI generates 100 related words
3. A filtering process removes potentially problematic words
4. The resulting collection forms the codebook dictionary

## ✅ Word Selection Guidelines

The short version:

- Words should not evoke negative perceptions when used in place names.
- Words should be concise, concrete, common, neutral, and easy to pronounce.
- Common nouns are preferred; proper names, places, brands, and products are
  rejected.
- Artificial compounds, awkward fragments, specialist jargon, and unnatural
  loanwords are rejected.
- Sensitive domains such as adult, gambling, alcohol, weapon, medical, legal,
  political, religious, disaster, and violent terms are rejected.

For manual and sub-agent review passes, use
`codebook-dataset/subagent-review-checklist.md`. The checklist covers recurring
misses such as one-syllable fragments, foreign abbreviations, place names,
brands, medical/religious/gambling terms, and other domain-specific words.
The checklist is operational; `CODEBOOK_GUIDE.md` remains the source of truth.

## 🛠️ Usage

The codebook can be used programmatically to convert between numerical values and word representations, enabling more human-friendly data encoding and decoding.

Current distributed word sets:

- English: 6,000 words
- Korean: 5,630 words
- Chinese: 5,140 words
- Japanese: 5,000 frequency-guided hiragana words filtered to avoid generated compounds and sensitive terms
- Spanish: 5,000 URL-safe words filtered to avoid generated compounds and sensitive terms
- French: 5,000 URL-safe words seeded from reviewed French words and filtered BIP39-derived candidates
- German: 5,000 URL-safe words seeded from reviewed German words and filtered compound candidates
- Portuguese: 5,000 URL-safe words seeded from neutral concrete Portuguese nouns and filtered compound candidates
- Indonesian: 5,000 URL-safe words seeded from neutral concrete Indonesian nouns and filtered weak fused-compound candidates
- Thai: 5,000 native Thai-script words seeded from neutral concrete nouns and filtered sensitive candidates
- Vietnamese: 5,000 native Vietnamese Latin-script words seeded from neutral concrete nouns and filtered sensitive candidates
- Hindi: 5,000 native Devanagari-script words seeded from neutral concrete nouns and filtered sensitive candidates

## ⚙️ Generation Commands

The package includes commands to generate new word sets using AI. This process can be customized and executed to create specialized word collections for different purposes.

## 📄 License

MIT License. This package is part of the ground.codes project.
