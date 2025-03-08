import { input } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import * as glob from "glob";

export default async () => {
  const language = (
    await input({
      message: "Please enter a language name. (e.g. korean)",
    })
  ).toLowerCase();

  const prefix = await input({
    message: "Please enter a file prefix name. (e.g. generated or refined)",
  });

  const filePaths = {
    codebookDataset: path.join(
      process.cwd(),
      "codebook-dataset",
      language,
      prefix
    ),
    codebookStaged: path.join(
      "codebook-dataset",
      language,
      `collected-${prefix}.json`
    ),
    codebook: path.join(process.cwd(), "codebook-dist", `${language}.json`),
  };

  let totalArrays = 0;
  const allWords = new Set<string>();
  const duplicateWords = new Set<string>();
  const wordCount: { [key: string]: number } = {};
  const wordLengthStats: { [key: number]: number } = {};
  const wordsByLength: { [key: number]: Set<string> } = {};
  const emptyArrayIndices: number[] = [];

  const files = glob.sync(
    path.join(filePaths.codebookDataset, `${prefix}-*.json`)
  );

  console.log(`Found ${files.length} files for ${language}`);

  for (const file of files) {
    const content = JSON.parse(await fs.readFile(file, "utf-8"));
    if (Array.isArray(content)) {
      totalArrays++;
      if (content.length === 0) {
        // Extract index from filename
        const fileName = path.basename(file);
        const match = fileName.match(new RegExp(`${prefix}-(\\d+)\\.json`));
        if (match && match[1] !== undefined) {
          const fileIndex = parseInt(match[1]);
          emptyArrayIndices.push(fileIndex);
        }
      }
      for (const word of content) {
        if (typeof word === "string") {
          if (wordCount[word]) {
            duplicateWords.add(word);
            wordCount[word]++;
          } else {
            wordCount[word] = 1;
            // Add only unique words to length statistics
            const wordLength = word.length;
            wordLengthStats[wordLength] =
              (wordLengthStats[wordLength] || 0) + 1;

            // Save a list of words by length
            if (!wordsByLength[wordLength]) {
              wordsByLength[wordLength] = new Set();
            }
            wordsByLength[wordLength].add(word);
          }
          allWords.add(word);
        }
      }
    }
  }

  console.log("\nAnalysis Results:");
  console.log("----------------");
  console.log(`Total arrays found: ${totalArrays}`);
  console.log(`Total unique words: ${allWords.size}`);
  console.log(`Number of duplicate words: ${duplicateWords.size}`);

  if (emptyArrayIndices.length > 0) {
    console.log(
      `\nEmpty arrays found at indices: ${emptyArrayIndices.join(", ")}`
    );
    console.log(`Total empty arrays: ${emptyArrayIndices.length}`);
  }

  console.log(
    `Total words (including duplicates): ${Object.values(wordCount).reduce(
      (a, b) => a + b,
      0
    )}`
  );

  console.log(`Duplicate words: ${duplicateWords.size}`);

  // Output word length statistics
  console.log("\nWord length statistics:");
  const sortedLengths = Object.keys(wordLengthStats)
    .map(Number)
    .sort((a, b) => a - b);
  let totalUniqueWords = 0;
  for (const length of sortedLengths) {
    totalUniqueWords += wordLengthStats[length]!;
  }

  for (const length of sortedLengths) {
    const count = wordLengthStats[length]!;
    const percentage = ((count / totalUniqueWords) * 100).toFixed(1);
    let output = `${length} characters: ${count} words (${percentage}%)`;

    // Display the word if there's only one word of this length
    const wordsOfLength = wordsByLength[length];
    if (count === 1 && wordsOfLength && wordsOfLength.size === 1) {
      const word = Array.from(wordsOfLength)[0];
      output += ` - "${word}"`;
    }

    console.log(output);
  }

  // Function to check if a word contains Korean characters
  const isKorean = (word: string): boolean => {
    const koreanRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/;
    return koreanRegex.test(word);
  };

  const isEnglish = (word: string): boolean => {
    const englishRegex = /^[a-zA-Z\s]+$/;
    return englishRegex.test(word);
  };

  // Collect and save unique words
  console.log(chalk.green("\nCollecting unique words..."));
  let uniqueWords = Array.from(allWords);

  if (language === "english") {
    // If the dataset is English, remove all non-English words from unique words
    {
      const englishWords = uniqueWords.filter((word) => isEnglish(word));
      console.log(
        `Filtered out ${
          uniqueWords.length - englishWords.length
        } non-English words.`
      );
      uniqueWords.length = 0;
      uniqueWords.push(...englishWords);
    }
    // Remove words that less than 3 characters
    {
      const shortWords = uniqueWords.filter((word) => word.length > 3);
      console.log(
        `Filtered out ${
          uniqueWords.length - shortWords.length
        } words shorter than 3 characters.`
      );
      uniqueWords.length = 0;
      uniqueWords.push(...shortWords);
    }

    // Remove words that exceed 9 characters
    {
      const longWords = uniqueWords.filter((word) => word.length < 9);
      console.log(
        `Filtered out ${
          uniqueWords.length - longWords.length
        } words longer than 9 characters.`
      );
      uniqueWords.length = 0;
      uniqueWords.push(...longWords);
    }
  }
  if (language === "korean") {
    // If the dataset is Korean, remove all non-Korean words from unique words
    {
      const koreanWords = uniqueWords.filter((word) => isKorean(word));
      console.log(
        `Filtered out ${
          uniqueWords.length - koreanWords.length
        } non-Korean words.`
      );
      uniqueWords.length = 0;
      uniqueWords.push(...koreanWords);
    }

    // Remove words that exceed 5 characters
    {
      const fiveLetterWords = uniqueWords.filter((word) => word.length <= 5);
      console.log(
        `Filtered out ${
          uniqueWords.length - fiveLetterWords.length
        } words with length other than 5.`
      );
      uniqueWords.length = 0;
      uniqueWords.push(...fiveLetterWords);
    }
  }

  console.log(`Collected ${uniqueWords.length} unique words.`);

  // Sort words by length
  uniqueWords = uniqueWords.sort((a, b) => a.length - b.length);

  // Save collected words to a JSON file
  if (uniqueWords.length !== 0) {
    const outputPath =
      prefix === "refined" ? filePaths.codebook : filePaths.codebookStaged;

    await fs.writeFile(
      outputPath,
      JSON.stringify(uniqueWords, null, 2),
      "utf-8"
    );
    console.log(chalk.green(`Successfully saved codebook at ${outputPath}`));
  }
};
