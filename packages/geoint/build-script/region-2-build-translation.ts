import fs from "fs";
import path from "path";
import { input } from "@inquirer/prompts";
import { RegionData } from "./types.js";
import chalk from "chalk";

export default async () => {
  const language = (
    await input({
      message: "Please enter a language name. (e.g. korean)",
    })
  ).toLowerCase();

  if (language === "english") {
    console.log(
      chalk.yellow(
        "English is the base language, so you don't need to build translations."
      )
    );
    return;
  }

  const filePaths = {
    originalJson: path.join(process.cwd(), "region-dist", "region-2.json"),
    preTranslationDataSets: path.join(
      process.cwd(),
      "region-dataset",
      "region-level-2",
      "pre-translation",
      language
    ),
    preTranslationTxt: path.join(
      process.cwd(),
      "region-dataset",
      "region-level-2",
      `all-${language}-translations.txt`
    ),
    postTranslationJson: path.join(
      process.cwd(),
      "region-dist",
      `region-2-${language}.json`
    ),
  };

  if (!fs.existsSync(filePaths.originalJson)) {
    console.log(
      chalk.yellow(`The original region-2.json file does not exist.`)
    );
    return;
  }

  if (!fs.existsSync(filePaths.preTranslationTxt)) {
    console.log(chalk.yellow(`The pre-translation file does not exist.`));
    return;
  }

  // Function to extract region name and coordinates from a translation line
  function parseTranslationLine(
    line: string
  ): { name: string; lat: number; long: number } | null {
    const match = line.match(/(.*?)\s*\(([0-9.-]+),\s*([0-9.-]+)\)/);

    if (!match || match.length < 4 || !match[1] || !match[2] || !match[3])
      return null;

    return {
      name: match[1].trim(),
      lat: parseFloat(match[2]),
      long: parseFloat(match[3]),
    };
  }

  await combineTranslations();
  await generateRegionJson();

  // Function to extract region name from a line
  function extractRegionName(line: string) {
    // Extract the region name (everything before the coordinates)
    const match = line.match(/(.*?)\s*\(/);
    if (!match || match.length < 2 || !match[1]) return null;
    return match[1].trim();
  }

  // Main function to combine all batch files and count region name occurrences
  async function combineTranslations() {
    console.log(chalk.green(`Starting to combine ${language} translations...`));

    // Get all batch files
    const files = fs
      .readdirSync(filePaths.preTranslationDataSets)
      .filter((file) => file.startsWith("batch-") && file.endsWith(".txt"))
      .sort((a, b) => {
        // Sort numerically by batch number
        const numA = parseInt(a.replace("batch-", "").replace(".txt", ""));
        const numB = parseInt(b.replace("batch-", "").replace(".txt", ""));
        return numA - numB;
      });

    console.log(chalk.green(`Found ${files.length} batch files to combine.`));

    // Store all translations
    let allTranslations: string[] = [];

    // Map to count region name occurrences
    const regionNameCounts: Map<string, number> = new Map();

    // Process each file
    for (const file of files) {
      const filePath = path.join(filePaths.preTranslationDataSets, file);
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n").filter((line) => line.trim() !== "");

      // Add to all translations
      allTranslations = allTranslations.concat(lines);

      // Count region names
      for (const line of lines) {
        const regionName = extractRegionName(line);
        if (regionName) {
          regionNameCounts.set(
            regionName,
            (regionNameCounts.get(regionName) || 0) + 1
          );
        }
      }
    }

    // Write all translations to a single file
    fs.writeFileSync(filePaths.preTranslationTxt, allTranslations.join("\n"));
    console.log(
      chalk.green(
        `Combined all translations into ${chalk.bold(
          chalk.underline(`all-${language}-translations.txt`)
        )}`
      )
    );

    // Find duplicate region names (appearing more than once)
    const duplicateRegions = Array.from(regionNameCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]); // Sort by count in descending order

    console.log(
      chalk.green(
        `Found ${chalk.bold(
          chalk.underline(duplicateRegions.length)
        )} region names that appear multiple times.`
      )
    );

    console.log(
      chalk.green(
        `Total translations combined: ${chalk.bold(
          chalk.underline(allTranslations.length)
        )}`
      )
    );
  }

  // Main function to combine original JSON with translations
  async function generateRegionJson() {
    console.log(
      chalk.green(
        `\nStarting to generate ${chalk.underline(
          chalk.bold(language)
        )} region-2 JSON...`
      )
    );

    // Read original JSON file
    const originalData = JSON.parse(
      fs.readFileSync(filePaths.originalJson, "utf8")
    ) as RegionData[];

    console.log(
      chalk.green(
        `Loaded original region-2.json with ${chalk.bold(
          chalk.underline(originalData.length)
        )} regions`
      )
    );

    // Read translations file
    const translationsContent = fs.readFileSync(
      filePaths.preTranslationTxt,
      "utf8"
    );
    const translationLines = translationsContent
      .split("\n")
      .filter((line) => line.trim() !== "");

    console.log(
      chalk.green(
        `Loaded ${chalk.bold(
          chalk.underline(translationLines.length)
        )} ${language} translations`
      )
    );

    // Parse translations into a map for easy lookup
    const translationsMap = new Map<string, string>();

    translationLines.forEach((line) => {
      const parsed = parseTranslationLine(line);
      if (parsed) {
        // Create a key using coordinates for matching
        const key = `${parsed.lat.toFixed(5)},${parsed.long.toFixed(5)}`;
        translationsMap.set(key, parsed.name);
      }
    });

    console.log(
      chalk.green(
        `Successfully parsed ${chalk.bold(
          chalk.underline(translationsMap.size)
        )} translations`
      )
    );

    // Create translated version of the JSON
    const translatedData = originalData.map((region) => {
      const key = `${region.lat.toFixed(5)},${region.long.toFixed(5)}`;
      const translatedName = translationsMap.get(key);

      return {
        name: translatedName || region.name, // Fallback to original name if no translation found
        code: region.code,
        lat: region.lat,
        long: region.long,
        population: region.population,
        countryCode: region.countryCode,
      };
    });

    // Count how many translations were found
    const translatedCount = translatedData.filter(
      (region, index) => region.name !== originalData[index]?.name
    ).length;

    console.log(
      chalk.green(
        `Found translations for ${chalk.bold(
          chalk.underline(translatedCount)
        )} out of ${originalData.length} regions`
      )
    );

    // Handle duplicate region names by keeping only the one with the highest population
    const nameMap = new Map<string, RegionData>();
    let duplicateCount = 0;
    let replacedCount = 0;

    translatedData.forEach((region) => {
      const regionName = region.name;
      const population = region.population || 0;

      if (nameMap.has(regionName)) {
        duplicateCount++;
        const existingRegion = nameMap.get(regionName)!;
        const existingPopulation = existingRegion.population || 0;

        if (population > existingPopulation) {
          replacedCount++;
          nameMap.set(regionName, region);
        }
      } else {
        nameMap.set(regionName, region);
      }
    });

    console.log(
      chalk.green(
        `Found ${chalk.bold(
          chalk.underline(duplicateCount)
        )} duplicate region names`
      )
    );
    console.log(
      chalk.green(
        `Replaced ${chalk.bold(
          chalk.underline(replacedCount)
        )} regions with higher population alternatives`
      )
    );

    // Convert map back to array
    const filteredLanguageDataSet = Array.from(nameMap.values());

    console.log(
      chalk.green(
        `Final dataset contains ${chalk.bold(
          chalk.underline(filteredLanguageDataSet.length)
        )} regions (reduced from ${originalData.length})`
      )
    );

    // Write the JSON file
    fs.writeFileSync(
      filePaths.postTranslationJson,
      JSON.stringify(filteredLanguageDataSet, null, 2)
    );
    console.log(
      chalk.green(
        `Successfully wrote ${chalk.bold(
          chalk.underline(language)
        )} region data`
      )
    );
  }
};
