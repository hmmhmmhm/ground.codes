import { input, confirm } from "@inquirer/prompts";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const batchSize = 10;
const timeout = 60_000; // 60 seconds timeout

export default async () => {
  console.log(
    chalk.green(
      "This command runs through the process of refining a codebook using generative AI. Read CODEBOOK_GUIDE.md before accepting the output.",
    ),
  );

  const openAIModel = await input({
    message: "Please enter an OpenAI model name. (e.g. gpt-4o)",
  });

  const language = (
    await input({
      message: "Please enter a language name. (e.g. korean)",
    })
  ).toLowerCase();

  const filePaths = {
    questionSubjects: path.join(
      process.cwd(),
      "codebook-dataset",
      "question-subjects.json",
    ),
    generated: path.join(
      process.cwd(),
      "codebook-dataset",
      language,
      "generated",
    ),
    refined: path.join(process.cwd(), "codebook-dataset", language, "refined"),
  };

  console.log(chalk.green(`Generating codebook for ${language}...`));

  console.log(
    chalk.green(
      "This total process will use an average of $10 or less, but it can often be more.",
    ),
  );

  const questions = JSON.parse(
    fs.readFileSync(filePaths.questionSubjects, "utf8"),
  ) as string[];

  console.log(
    chalk.green(`Loaded ${questions.length} questions for ${language}.`),
  );

  fs.mkdirSync(filePaths.refined, { recursive: true });

  // First scan all files to find which ones need processing
  const needsProcessing: { question: string; index: number }[] = [];

  // Scan all questions first
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question) continue;

    const filePath = path.join(filePaths.refined, `refined-${i + 1}.json`);
    if (!fs.existsSync(filePath)) {
      needsProcessing.push({ question, index: i + 1 });
    }
  }

  if (needsProcessing.length > 0)
    console.log(
      chalk.blue(
        `Found ${
          needsProcessing.length
        } questions that need to be processed: \n${JSON.stringify(
          needsProcessing.map((item) => item.index),
        )}`,
      ),
    );

  if (needsProcessing.length > 0) {
    if (
      !(await confirm({
        message: `Shall we start generate "${language}" codebook now?`,
      }))
    ) {
      console.log(chalk.red(`Aborting codebook generation for ${language}.`));
      process.exit(0);
    }
  } else {
    console.log(
      chalk.yellow(
        `No need to generate set for ${language}. Already whole set exists.`,
      ),
    );
  }

  // Process in batches of 10
  for (let i = 0; i < needsProcessing.length; i += batchSize) {
    const batch = needsProcessing.slice(i, i + batchSize);
    console.log(
      chalk.green(
        `\nProcessing batch: ${JSON.stringify(batch.map((item) => item.index))}`,
      ),
    );
    await processBatch(batch);
  }

  async function processBatch(batch: { question: string; index: number }[]) {
    const results = await Promise.allSettled(
      batch.map(async ({ question, index }) => {
        // Skip if file exists
        if (
          fs.existsSync(path.join(filePaths.refined, `refined-${index}.json`))
        ) {
          console.log(
            chalk.yellow(
              `Skipping "${question}" (${index}/${questions.length}) because file exists.`,
            ),
          );
          return;
        }

        console.log(
          chalk.green(
            `Generating codebook for "${question}" (${index}/${questions.length})...`,
          ),
        );

        const beforeData = fs.readFileSync(
          path.join(filePaths.generated, `generated-${index}.json`),
          "utf8",
        );

        const prompt = `You are a word-checking AI. Based on the generated wordset, your job is to remove words from the existing array that don't fit the given word rules, and return the resulting value. Return the data in the form of a JSON array. Output JSON data directly. Don't include any other answers or messages.
(Must be only "${language}" noun words)

[Word requirement based on CODEBOOK_GUIDE.md]
- Keep only target-language noun entries.
- Prefer short, concrete, neutral, common nouns that are easy to pronounce.
- Remove proper names: people, surnames, cities, states, countries, regions, landmarks, brands, platforms, and product names.
- Remove adult, gambling, alcohol, weapon, violent, military, medical, legal, political, religious, disaster, crime, insult, and risk terms.
- Remove artificial compounds, awkward fragments, repeated filler, specialist jargon, and unnatural foreign loanwords.
- Keep only words that would feel neutral in a public place label.

[Generated Wordset]
${beforeData}`;

        let parseFailedText = "";

        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error("Timeout exceeded"));
            }, timeout);
          });

          const generatePromise = generateText({
            model: openai(openAIModel),
            prompt,
          });

          const { text } = (await Promise.race([
            generatePromise,
            timeoutPromise,
          ])) as { text: string };

          parseFailedText = text;

          // Remove ```json and ``` from the text
          const cleanText = text.replace(/```json/g, "").replace(/```/g, "");

          // Parse the text into a JSON array
          const data = JSON.parse(cleanText);

          fs.writeFileSync(
            path.join(filePaths.refined, `refined-${index}.json`),
            JSON.stringify(data),
          );

          return { status: "success", index };
        } catch (e: any) {
          if (e.message === "Timeout exceeded") {
            console.log(
              chalk.yellow(
                `Timeout exceeded for "${question}" (${index}/${questions.length})`,
              ),
            );
          } else {
            console.error(e);
            console.log(
              chalk.yellow(
                `Failed to generate codebook for "${question}" (${index}/${questions.length})`,
              ),
            );

            fs.writeFileSync(
              path.join(filePaths.refined, `refined-failed-${index}.txt`),
              parseFailedText,
            );
          }
          return { status: "failed", index, error: e };
        }
      }),
    );

    return results;
  }

  console.log(chalk.green("Codebook generation completed!"));
};
