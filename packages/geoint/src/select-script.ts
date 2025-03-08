import { search } from "@inquirer/prompts";
import chalk from "chalk";
import "dotenv/config";

type Choice<Value> = {
  value: Value;
  name: string;
  description: string;
  short?: string;
  disabled?: boolean | string;
  runScript: () => unknown;
};

const scriptList: Choice<string>[] = [
  {
    value: "exit",
    name: "Exit (Close Script)",
    description: "Description: Exit the script.",
    runScript: () => process.exit(0),
  },
  {
    value: "region-1-build",
    name: "Region 1 Build",
    description:
      "Decription: Build a Region 1 dataset with 4 or fewer digits. If the airport codes in your dataset, such as ICAO and IATA, have changed, you can run it to update the regeion-dist file.",
    runScript: async () => (await import("./region-1-build.js")).default(),
  },
  {
    value: "region-2-build",
    name: "Region 2 Build",
    description:
      "Decription: Build the Region 2 dataset. If the cities500.txt in GeoNames has been updated, you can run this script to reflect those changes in the build.",
    runScript: async () => (await import("./region-2-build.js")).default(),
  },
  {
    value: "region-2-create-pre-translation",
    name: "Region 2 Create Pre-Translation",
    description:
      "Decription: Create pre-translation files for Region 2. This script will generate a set of files in the pre-translation folder, which will be used to translate the region names. You can run this script if the information in existing Region 2 has changed.",
    runScript: async () =>
      (await import("./region-2-create-pre-translation.js")).default(),
  },
  {
    value: "region-2-create-translation",
    name: "Region 2 Create Translation",
    description:
      "Description: This command uses generative AI to translate region names from English into the target language.",
    runScript: async () =>
      (await import("./region-2-create-translation.js")).default(),
  },
  {
    value: "region-2-build-translation",
    name: "Region 2 Build Translation",
    description:
      "Decription: Update Build for Region 2's language-specific regional name translations. Note that you can select specific languages to run, rather than acting on all languages. This command can be run if the region naming of a specific language translation has changed and needs to be updated.",
    runScript: async () =>
      (await import("./region-2-build-translation.js")).default(),
  },
];

(async () => {
  const selectedScript = await search({
    message: "Select the script you want to run.",
    source: async (input) => {
      if (!input) {
        return scriptList;
      }
      return scriptList;
    },
  });

  console.log(chalk.green(`Running script: "${selectedScript}"\n`));
  await scriptList.find((s) => s.value === selectedScript)?.runScript();

  console.log(chalk.green(`\nScript completed.`));
})();
