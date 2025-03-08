import fs from "fs";
import path from "path";
import chalk from "chalk";

/**
 * Assembles region 1 data.
 * Region Level 1 (Short Code)
 * - (2 Code) ISO 3166-1 alpha-2
 * - (3 Code) IATA Airport Code
 * - (4 Code) ICAO Airport Code
 */
export default async () => {
  const regionLevel1Path = path.join(
    process.cwd(),
    "region-dataset",
    "region-level-1"
  );
  const filePaths = {
    iso3166Alpha2: path.join(regionLevel1Path, "iso-3166-1-alpha-2.json"),
    iata: path.join(regionLevel1Path, "iata.json"),
    icao: path.join(regionLevel1Path, "icao.json"),
    region1Dist: path.join(process.cwd(), "region-dist", "region-1.json"),
  };
  const contents = {
    iso3166Alpha2: JSON.parse(
      fs.readFileSync(filePaths.iso3166Alpha2, "utf-8")
    ),
    iata: JSON.parse(fs.readFileSync(filePaths.iata, "utf-8")),
    icao: JSON.parse(fs.readFileSync(filePaths.icao, "utf-8")),
  };

  console.log(
    chalk.green(
      `Collected ${chalk.bold(
        chalk.underline(contents.iso3166Alpha2.length)
      )} ISO 3166-1 Alpha-2 regions.`
    )
  );
  console.log(
    chalk.green(
      `Collected ${chalk.bold(chalk.underline(contents.iata.length))} IATA regions.`
    )
  );
  console.log(
    chalk.green(
      `Collected ${chalk.bold(chalk.underline(contents.icao.length))} ICAO regions.`
    )
  );

  const regions = [
    ...contents.iso3166Alpha2,
    ...contents.iata,
    ...contents.icao,
  ];

  console.log(
    chalk.green(
      `= Total Collected ${chalk.bold(chalk.underline(regions.length))} regions.`
    )
  );

  fs.writeFileSync(
    filePaths.region1Dist,
    JSON.stringify(regions, null, 2),
    "utf-8"
  );
};
