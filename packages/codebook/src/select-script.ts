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
    value: "generate-codebook",
    name: "Generate Codebook",
    description:
      "Description: Use generative AI to automatically create the requested language dataset. This command can be used to create a new codebook for a language region that does not have one.",
    runScript: () => import("./generate-codebook.js").then((m) => m.default()),
  },
  {
    value: "refine-codebook",
    name: "Refine Codebook",
    description:
      "Description: Use generative AI to automatically refine the requested language dataset. This process will automatically delete low-quality words. This command can be used to refine an existing codebook for a language region that already has one.",
    runScript: () => import("./refine-codebook.js").then((m) => m.default()),
  },
  {
    value: "build-codebook",
    name: "Build Codebook",
    description: "Description: Build codebook from collected words.",
    runScript: () => import("./build-codebook.js").then((m) => m.default()),
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
