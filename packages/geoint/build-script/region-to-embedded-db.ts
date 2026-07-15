import path from "path";
import fs from "fs";
import chalk from "chalk";
import { RegionData } from "./types";
import KDBush from "kdbush";
import { Level } from "level";

import { assertMaterializedRegionData } from "../../../scripts/region-data/materialization.mjs";

export default async () => {
  assertMaterializedRegionData({ groups: ["region-dist"] });
  const filePaths = {
    regionDist: path.join(process.cwd(), "region-dist"),
    regionDb: path.join(process.cwd(), "region-db"),
  };

  console.log(
    chalk.green("Starting to import region data into the embedded database..."),
  );

  if (!fs.existsSync(filePaths.regionDist)) {
    console.log(
      chalk.yellow(
        `The region-dist directory does not exist. Please run "region-2-build" first.`,
      ),
    );
    return;
  }

  const regionFiles = fs
    .readdirSync(filePaths.regionDist)
    .filter((file) => file.endsWith(".json"));
  console.log(
    chalk.green(`Founded ${regionFiles.length} region files for database.`),
  );

  fs.mkdirSync(filePaths.regionDb, { recursive: true });

  for (const regionFile of regionFiles) {
    console.log(
      chalk.green(
        `Processing ${regionFile}...(${regionFiles.indexOf(regionFile) + 1}/${regionFiles.length})`,
      ),
    );
    const regionPath = path.join(filePaths.regionDist, regionFile);
    const regionFileName = regionFile.split(".")[0];
    await createEmbeddedDatabase({
      regionJsonPath: regionPath,
      regionLevelDbPath: path.join(filePaths.regionDb, `${regionFileName}`),
      regionKDBushPath: path.join(
        filePaths.regionDb,
        `${regionFileName}.index`,
      ),
      regionLevel: parseInt(regionFileName.split("-")[1]),
    });
  }

  console.log(
    chalk.green(
      "Successfully imported region data into the embedded database.",
    ),
  );
};

const createEmbeddedDatabase = async ({
  regionJsonPath,
  regionLevelDbPath,
  regionKDBushPath,
  regionLevel,
}: {
  regionJsonPath: string;
  regionLevelDbPath: string;
  regionKDBushPath: string;
  regionLevel: number;
}) => {
  fs.rmSync(regionLevelDbPath, { recursive: true, force: true });
  fs.rmSync(regionKDBushPath, { force: true });

  const regions = JSON.parse(
    fs.readFileSync(regionJsonPath, "utf-8"),
  ) as RegionData[];

  const kdbush = new KDBush(regions.length);
  const db = new Level(regionLevelDbPath);
  await db.open();

  for (const region of regions) {
    const index = regions.indexOf(region);
    await db.put(`I-${index.toString()}`, JSON.stringify(region));
    await db.put(
      `N-${regionLevel === 1 ? region.code : region.name}`,
      `I-${index.toString()}`,
    );
    kdbush.add(region.long, region.lat);
  }
  kdbush.finish();
  await db.close();

  fs.writeFileSync(regionKDBushPath, Buffer.from(kdbush.data));
};
