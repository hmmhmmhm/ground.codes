import fs from "fs";
import path from "path";
import task from "tasuku";
import chalk from "chalk";

export default async () => {
  const filePaths = {
    region2: path.join(process.cwd(), "region-dist", "region-2.json"),
    region2PreTranslationFoler: path.join(
      process.cwd(),
      "region-dataset",
      "region-level-2",
      "pre-translation",
      "baseset"
    ),
  };
  const region2 = JSON.parse(fs.readFileSync(filePaths.region2, "utf8")) as {
    name: string;
    code: string;
    lat: number;
    long: number;
  }[];

  console.log(
    chalk.green(
      `Collected region2 count: ${chalk.bold(chalk.underline(region2.length))}`
    )
  );

  fs.mkdirSync(filePaths.region2PreTranslationFoler, { recursive: true });

  console.log(
    chalk.green(
      "Splitting regions into batches of 100 and saving as JSON files..."
    )
  );

  // Format each region as "Label (Lat, Long)\n"
  const formattedRegions = region2.map(
    (city) => `${city.name} (${city.lat}, ${city.long})`
  );

  // Split into batches of 100
  const batchSize = 100;
  const batches: string[][] = [];

  for (let i = 0; i < formattedRegions.length; i += batchSize) {
    batches.push(formattedRegions.slice(i, i + batchSize));
  }

  if (!fs.existsSync(filePaths.region2PreTranslationFoler)) {
    fs.mkdirSync(filePaths.region2PreTranslationFoler, { recursive: true });
  }

  // Save each batch as a separate JSON file
  const processTask = await task(
    "Saving batches as JSON files...",
    async ({ setTitle }) => {
      batches.forEach((batch, index) => {
        const batchFilePath = path.join(
          filePaths.region2PreTranslationFoler,
          `batch-${index + 1}.txt`
        );
        fs.writeFileSync(batchFilePath, batch.join("\n"));
        setTitle(
          `Saved batch ${index + 1} with ${Math.ceil(
            region2.length / batchSize
          )} regions`
        );
      });
    }
  );
  processTask.clear();

  console.log(
    chalk.green(
      `Total batches created: ${chalk.bold(chalk.underline(batches.length))}`
    )
  );
};
