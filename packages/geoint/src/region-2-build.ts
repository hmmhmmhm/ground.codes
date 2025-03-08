import fs from "fs";
import path from "path";
import task from "tasuku";
import chalk from "chalk";

export default async () => {
  const filePaths = {
    inputFile: path.join(
      process.cwd(),
      "region-dataset",
      "region-level-2",
      "cities500.txt"
    ),
    outputFile: path.join(process.cwd(), "region-dist", "region-2.json"),
  };

  if (!fs.existsSync(filePaths.inputFile)) {
    console.error(`Input file not found: ${filePaths.inputFile}`);
    console.error(
      "Please download the cities500.txt file from here: https://download.geonames.org/export/dump/cities500.zip"
    );
    return;
  }

  console.log(chalk.green("Reading cities file..."));
  const fileContent = await fs.promises.readFile(filePaths.inputFile, "utf8");
  const lines = fileContent.split("\n");
  console.log(
    chalk.green(
      `File read complete. Total lines: ${chalk.bold(
        chalk.underline(lines.length)
      )}`
    )
  );

  const cityMap = new Map<string, any>();

  let processedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;
  let replacedCount = 0;
  let longNameCount = 0;

  const processTask = await task(
    "Starting to process each city line...",
    async ({ setTitle }) => {
      for (const line of lines) {
        if (!line.trim()) {
          skippedCount++;
          continue;
        }

        const columns = line.split("\t");
        if (columns.length < 19) {
          console.log(
            chalk.yellow(
              `Skipping line with insufficient columns (wrong format): ${columns.length}`
            )
          );
          skippedCount++;
          continue;
        }

        const [
          geonameId,
          name,
          asciiName,
          _alternateNamesRaw,
          latitude,
          longitude,
          _featureClass,
          _featureCode,
          countryCode,
          _cc2,
          _admin1Code,
          _admin2Code,
          _admin3Code,
          _admin4Code,
          population,
        ] = columns;

        if (!latitude || !longitude) {
          console.log(
            chalk.yellow(
              `Skipping line with insufficient columns (no coordinates): ${columns.length}`
            )
          );
          skippedCount++;
          continue;
        }

        const lat = parseFloat(latitude);
        const long = parseFloat(longitude);
        const pop = parseInt(population || "0", 10) || 0;

        if (isNaN(lat) || isNaN(long)) {
          skippedCount++;
          continue;
        }

        let cityName = asciiName || name;

        if (!cityName) {
          console.log(
            chalk.yellow(
              `Skipping line with insufficient columns (no name): ${columns.length}`
            )
          );
          skippedCount++;
          continue;
        }

        // Clean up city name
        cityName = cityName.replace(/-dong$/, "").replace("-", "");

        // Skip cities with names longer than 20 characters
        if (cityName.length > 20) {
          longNameCount++;
          skippedCount++;
          continue;
        }

        // Duplicate city name handling: Select city with larger population
        if (cityMap.has(cityName)) {
          duplicateCount++;
          const existingCity = cityMap.get(cityName)!;
          if (pop > existingCity.population) {
            replacedCount++;
            cityMap.set(cityName, {
              name: cityName,
              code: geonameId,
              lat,
              long,
              population: pop,
              countryCode,
            });
          }
        } else {
          cityMap.set(cityName, {
            name: cityName,
            code: geonameId,
            lat,
            long,
            population: pop,
            countryCode,
          });
        }

        processedCount++;
        if (processedCount % 100 === 0)
          setTitle(`Processed ${processedCount} cities so far...`);
      }
      return processedCount;
    }
  );
  processTask.clear();
  console.log(
    chalk.green(
      `Processed ${chalk.bold(chalk.underline(processTask.result))} cities`
    )
  );

  const cities = Array.from(cityMap.values());
  await fs.promises.writeFile(
    filePaths.outputFile,
    JSON.stringify(cities, null, 2),
    "utf8"
  );

  const statistics = `\nProcessing statistics:
- Total lines processed: ${chalk.bold(
    chalk.underline(processedCount + skippedCount)
  )}
- Valid cities processed: ${chalk.bold(chalk.underline(processedCount))}
- Lines skipped: ${chalk.bold(chalk.underline(skippedCount))}
- Duplicate city names found: ${chalk.bold(chalk.underline(duplicateCount))}
- Cities replaced due to higher population: ${chalk.bold(
    chalk.underline(replacedCount)
  )}
- Cities excluded due to name length > 20: ${chalk.bold(
    chalk.underline(longNameCount)
  )}
\nCollected ${cities.length} unique cities.`;

  console.log(chalk.green(statistics));
};
