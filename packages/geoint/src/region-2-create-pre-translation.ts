import fs from "fs";
import path from "path";

export default async () => {
  const filePaths = {
    cities500: path.join(
      process.cwd(),
      "region-dataset",
      "region-level-2",
      "cities500.json"
    ),
    region2PreTranslationFoler: path.join(
      process.cwd(),
      "region-dataset",
      "region-level-2",
      "pre-translation",
      "baseset"
    ),
  };
  const cities500 = JSON.parse(
    fs.readFileSync(filePaths.cities500, "utf8")
  ) as {
    name: string;
    code: string;
    lat: number;
    long: number;
  }[];

  console.log(`Collected cities500 count: ${cities500.length}`);

  fs.mkdirSync(filePaths.region2PreTranslationFoler, { recursive: true });

  console.log(
    "Splitting regions into batches of 100 and saving as JSON files..."
  );

  // Format each region as "Label (Lat, Long)\n"
  const formattedRegions = cities500.map(
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
  batches.forEach((batch, index) => {
    const batchFilePath = path.join(
      filePaths.region2PreTranslationFoler,
      `batch-${index + 1}.txt`
    );
    fs.writeFileSync(batchFilePath, batch.join("\n"));
    console.log(
      `Saved batch ${index + 1} with ${Math.ceil(cities500.length / batchSize)} regions`
    );
  });

  console.log(`Total batches created: ${batches.length}`);
};
