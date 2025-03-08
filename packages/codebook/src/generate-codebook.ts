import { input, confirm } from "@inquirer/prompts";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const batchSize = 10;
const timeout = 30_000; // 30 seconds timeout

export default async () => {
  console.log(
    chalk.green(
      "This command runs through the process of generating a codebook using generative AI."
    )
  );

  const openAIModel = await input({
    message: "Please enter an OpenAI model name. (e.g. gpt-4o-mini)",
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
      "question-subjects.json"
    ),
    generated: path.join(
      process.cwd(),
      "codebook-dataset",
      language,
      "generated"
    ),
  };

  console.log(chalk.green(`Generating codebook for ${language}...`));

  console.log(
    chalk.green(
      "This total process will use an average of $0.5 or less, but it can often be more."
    )
  );

  const questions = JSON.parse(
    fs.readFileSync(filePaths.questionSubjects, "utf8")
  ) as string[];

  console.log(
    chalk.green(`Loaded ${questions.length} questions for ${language}.`)
  );

  fs.mkdirSync(filePaths.generated, { recursive: true });

  async function processBatch(batch: { question: string; index: number }[]) {
    const results = await Promise.allSettled(
      batch.map(async ({ question, index }) => {
        // Skip if file exists
        if (
          fs.existsSync(
            path.join(filePaths.generated, `generated-${index}.json`)
          )
        ) {
          console.log(
            chalk.yellow(
              `Skipping "${question}" (${index}/${questions.length}) because file exists.`
            )
          );
          return;
        }

        console.log(
          chalk.green(
            `Generating codebook for "${question}" (${index}/${questions.length})...`
          )
        );

        const prompt = `Please write at least 100 "${language}" noun words related to the given topic and return the data in the form of a JSON array. Output JSON data directly. Don't include any other answers or messages. You must answer only words that are unconditionally related to the topic.
(Must be only "${language}" noun words)

[Given Topic]
${question}

[Word requirement]
- Words should not cause potentially negative perceptions when used in place names.
- The word should be as short as possible and easy to pronounce.
- The word should be a proper noun.
- The word must be a commonly known and frequently used word.
- The word cannot be a compound word, for example, "tiger" is possible, but not an artificial word like "sea tiger"
- The word must not contain the geographic name of a specific country.
- Foreign words that are not used in your language should not be used.`;

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
          const data = JSON.parse(cleanText) as string[];

          if (!Array.isArray(data) || data.length === 0) {
            console.error(
              chalk.yellow(`Failed to parse JSON(Index: ${index}):`),
              data
            );
            fs.writeFileSync(
              path.join(filePaths.generated, `generated-failed-${index}.txt`),
              cleanText
            );
            return { status: "failed", index };
          }

          fs.writeFileSync(
            path.join(filePaths.generated, `generated-${index}.json`),
            JSON.stringify(data)
          );

          return { status: "success", index };
        } catch (e: any) {
          if (e.message === "Timeout exceeded") {
            console.log(
              chalk.yellow(
                `Timeout exceeded for "${question}" (${index}/${questions.length})`
              )
            );
          } else {
            console.error(e);
            console.log(
              chalk.yellow(
                `Failed to generate codebook for "${question}" (${index}/${questions.length})`
              )
            );

            fs.writeFileSync(
              path.join(filePaths.generated, `generated-failed-${index}.txt`),
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
  const needsProcessing: { question: string; index: number }[] = [];

  // Scan all questions first
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question) continue;

    const filePath = path.join(filePaths.generated, `generated-${i + 1}.json`);

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
          needsProcessing.map((item) => item.index)
        )}`
      )
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
        `No need to generate set for ${language}. Already whole set exists.`
      )
    );
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

  console.log(chalk.green("Codebook generation completed!"));
};
