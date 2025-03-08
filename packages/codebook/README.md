# Codebook Package

<p align="center">
  <img src="https://i.imgur.com/eQ9JpzY.png" width="128" alt="Ground Codes Logo">
</p>

## Overview

The Codebook package is a specialized word collection developed for the ground.codes project. It functions similarly to numerical base systems (like base32), but instead uses words as the basic units. This allows for the representation of data using human-readable words rather than abstract symbols or numbers.

## Purpose

The primary purpose of the Codebook is to provide a dictionary of words that can be used systematically in various applications within the ground.codes ecosystem, such as generating memorable identifiers, creating readable codes, or establishing unique naming conventions.

## Dictionary Composition

- **English Codebook**: Contains 6,000 curated words
- **Korean Codebook**: Contains 5,630 curated words

## Word Generation Process

The word dictionaries are constructed using generative AI through the following process:

1. The system uses 1,118 question subjects found in `codebook-dataset/question-subjects.json`
2. For each subject, the AI generates 100 related words
3. A filtering process removes potentially problematic words
4. The resulting collection forms the codebook dictionary

## Word Selection Guidelines

While not strictly enforced, the following guidelines are recommended for words in the codebook:

- Words should not evoke negative perceptions when used in place names
- Words should be concise and easy to pronounce
- Preference is given to proper nouns
- Words should be commonly known and frequently used
- Simple words are preferred over compound words (e.g., "tiger" is acceptable, but "sea tiger" is not)
- Words should not contain specific country names
- Foreign words not commonly used in the target language should be avoided

## Usage

The codebook can be used programmatically to convert between numerical values and word representations, enabling more human-friendly data encoding and decoding.

## Generation Commands

The package includes commands to generate new word sets using AI. This process can be customized and executed to create specialized word collections for different purposes.

## License

MIT License. This package is part of the ground.codes project.
