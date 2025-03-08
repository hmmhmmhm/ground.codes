import fs from "fs";
import path from "path";
import { input } from "@inquirer/prompts";
import { RegionData } from "./types.js";
import chalk from "chalk";

export default async () => {
  const language = await input({
    message: "Please enter a language name. (e.g. Korean)",
  });

  const languageCode = (
    await input({
      message: "Please enter a language code. (e.g. kr)",
    })
  ).toLowerCase();

  if (language === "English" || languageCode === "en") {
    console.log(
      chalk.yellow(
        "English is the base language, so you don't need to build translations."
      )
    );
    return;
  }

  const filePaths = {
    originalJson: path.join(process.cwd(), "region-dist", "region-2.json"),
    preTranslationTxt: path.join(
      process.cwd(),
      "region-dataset",
      "region-level-2",
      `all-${language}-translations.txt`
    ),
    postTranslationJson: path.join(
      process.cwd(),
      "region-dist",
      `region-2-${languageCode}.json`
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
        )} Korean translations`
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
    const filteredKoreanData = Array.from(nameMap.values());

    console.log(
      chalk.green(
        `Final dataset contains ${chalk.bold(
          chalk.underline(filteredKoreanData.length)
        )} regions (reduced from ${originalData.length})`
      )
    );

    // Write the JSON file
    fs.writeFileSync(
      filePaths.postTranslationJson,
      JSON.stringify(filteredKoreanData, null, 2)
    );
    console.log(
      chalk.green(
        `Successfully wrote ${chalk.bold(
          chalk.underline(language)
        )} region data`
      )
    );
  }

  // Run the function
  generateRegionJson().catch(console.error);
};
