import "dotenv/config";
import { input, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import path from "path";
import * as glob from "glob";

const batchSize = 10;
const timeout = 60000; // 30 seconds timeout

console.clear();
console.log(
  chalk.green(
    "This command runs through the process of generating a region set using generative AI."
  )
);

const openAIModel = await input({
  message: "Please enter an OpenAI model name. (e.g. gpt-4o-mini)",
});

const language = await input({
  message: "Please enter a language name. (e.g. Korean)",
});

console.log(chalk.green(`Generating Set for ${language}...`));

console.log(
  chalk.green(
    "This total process will use an average of $0.5 or less, but it can often be more."
  )
);

const baseSets = glob.sync(
  path.join(
    process.cwd(),
    "data",
    "Region-Dataset",
    "Region-Level-2",
    "Pre-Translation",
    "BaseSet",
    "batch-*.txt"
  )
);

console.log(
  chalk.green(`Founded ${baseSets.length} baseset for ${language} translation.`)
);

fs.mkdirSync(
  path.join(
    process.cwd(),
    "data",
    "Region-Dataset",
    "Region-Level-2",
    "Pre-Translation",
    language
  ),
  { recursive: true }
);

async function processBatch(batch: { batchText: string; index: number }[]) {
  const results = await Promise.allSettled(
    batch.map(async ({ batchText, index }) => {
      // Skip if file exists
      if (
        fs.existsSync(
          path.join(
            process.cwd(),
            "data",
            "Region-Dataset",
            "Region-Level-2",
            "Pre-Translation",
            language,
            `batch-${index}.txt`
          )
        )
      ) {
        console.log(
          chalk.yellow(
            `Skipping (${index}/${baseSets.length}) because file exists.`
          )
        );
        return;
      }

      console.log(
        chalk.green(`Generating Set of (${index}/${baseSets.length})...`)
      );

      const prompt = `You are an AI that takes a region name and translates it to "${language}".

[key points].
- Start translating right away without attaching any other answers or comments.
- Return the coordinates as they are, but only translate the area name.
- Please respect the original formatting.`;

      let parseFailedText = "";

      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout exceeded"));
          }, timeout);
        });

        const generatePromise = generateText({
          model: openai(openAIModel),
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: batchText,
            },
          ],
        });

        const { text } = (await Promise.race([
          generatePromise,
          timeoutPromise,
        ])) as { text: string };

        parseFailedText = text;

        // Remove ```json and ``` from the text
        const cleanText = text
          .replace(/```/g, "")
          .replace(/```/g, "")
          .split("\n")
          .map((value) => value.trim())
          .join("\n");

        if (cleanText.length === 0) {
          console.error(chalk.yellow(`Failed to parse JSON(Index: ${index}):`));
          fs.writeFileSync(
            path.join(
              process.cwd(),
              "data",
              "Region-Dataset",
              "Region-Level-2",
              "Pre-Translation",
              language,
              `batch-${index}-failed.txt`
            ),
            cleanText
          );
          return { status: "failed", index };
        }

        fs.writeFileSync(
          path.join(
            process.cwd(),
            "data",
            "Region-Dataset",
            "Region-Level-2",
            "Pre-Translation",
            language,
            `batch-${index}.txt`
          ),
          cleanText
        );

        return { status: "success", index };
      } catch (e: any) {
        if (e.message === "Timeout exceeded") {
          console.log(
            chalk.yellow(`Timeout exceeded of (${index}/${baseSets.length})`)
          );
        } else {
          console.error(e);
          console.log(
            chalk.yellow(
              `Failed to generate Set for (${index}/${baseSets.length})`
            )
          );

          fs.writeFileSync(
            path.join(
              process.cwd(),
              "data",
              "Region-Dataset",
              "Region-Level-2",
              "Pre-Translation",
              language,
              `batch-${index}-failed.txt`
            ),
            parseFailedText
          );
        }
        return { status: "failed", index, error: e };
      }
    })
  );

  return results;
}

// First scan all files to find which ones need processing
const needsProcessing: { batchText: string; index: number }[] = [];

// Scan all baseSets first
for (let i = 0; i <= baseSets.length; i++) {
  const baseSet = baseSets[i];
  if (!baseSet) continue;

  const batchText = fs.readFileSync(
    path.join(
      process.cwd(),
      "data",
      "Region-Dataset",
      "Region-Level-2",
      "Pre-Translation",
      "BaseSet",
      `batch-${i + 1}.txt`
    ),
    "utf-8"
  );

  if (
    !fs.existsSync(
      path.join(
        process.cwd(),
        "data",
        "Region-Dataset",
        "Region-Level-2",
        "Pre-Translation",
        language,
        `batch-${i + 1}.txt`
      )
    )
  ) {
    needsProcessing.push({ batchText, index: i + 1 });
  }
}

if (needsProcessing.length > 0)
  console.log(
    chalk.blue(
      `Found ${
        needsProcessing.length
      } baseSet that need to be processed: \n${JSON.stringify(
        needsProcessing.map((item) => item.index)
      )}`
    )
  );

if (
  !(await confirm({
    message: `Shall we start generate "${language}" set now?`,
  }))
) {
  console.log(chalk.red(`Aborting set generation for ${language}.`));
  process.exit(0);
}

// Process in batches of 10
for (let i = 0; i < needsProcessing.length; i += batchSize) {
  const batch = needsProcessing.slice(i, i + batchSize);
  console.log(
    chalk.green(
      `\nProcessing batch: ${JSON.stringify(batch.map((item) => item.index))}`
    )
  );
  await processBatch(batch);
}

console.log(chalk.green(`${language} Set generation completed.`));
process.exit(0);
