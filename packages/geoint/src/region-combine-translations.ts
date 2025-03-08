import fs from "fs";
import path from "path";

// Define paths
const koreanTranslationPath = path.join(
  process.cwd(),
  "data",
  "Region-Dataset",
  "Region-Level-2",
  "Pre-Translation",
  "Korean"
);

const outputPath = path.join(
  process.cwd(),
  "data",
  "Region-Dataset",
  "Region-Level-2",
  "all-korean-translations.txt"
);

// Function to extract region name from a line
function extractRegionName(line: string) {
  // Extract the region name (everything before the coordinates)
  const match = line.match(/(.*?)\s*\(/);
  if (!match || match.length < 2 || !match[1]) return null;
  return match[1].trim();
}

// Main function to combine all batch files and count region name occurrences
async function combineTranslations() {
  console.log("Starting to combine Korean translations...");

  // Get all batch files
  const files = fs
    .readdirSync(koreanTranslationPath)
    .filter((file) => file.startsWith("batch-") && file.endsWith(".txt"))
    .sort((a, b) => {
      // Sort numerically by batch number
      const numA = parseInt(a.replace("batch-", "").replace(".txt", ""));
      const numB = parseInt(b.replace("batch-", "").replace(".txt", ""));
      return numA - numB;
    });

  console.log(`Found ${files.length} batch files to combine.`);

  // Store all translations
  let allTranslations: string[] = [];

  // Map to count region name occurrences
  const regionNameCounts: Map<string, number> = new Map();

  // Process each file
  for (const file of files) {
    const filePath = path.join(koreanTranslationPath, file);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    // Add to all translations
    allTranslations = allTranslations.concat(lines);

    // Count region names
    for (const line of lines) {
      const regionName = extractRegionName(line);
      if (regionName) {
        regionNameCounts.set(
          regionName,
          (regionNameCounts.get(regionName) || 0) + 1
        );
      }
    }

    console.log(`Processed ${file} with ${lines.length} translations.`);
  }

  // Write all translations to a single file
  fs.writeFileSync(outputPath, allTranslations.join("\n"));
  console.log(`Combined all translations into ${outputPath}`);

  // Find duplicate region names (appearing more than once)
  const duplicateRegions = Array.from(regionNameCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]); // Sort by count in descending order

  console.log(
    `\nFound ${duplicateRegions.length} region names that appear multiple times:`
  );
  duplicateRegions.forEach(([name, count]) => {
    console.log(`- "${name}" appears ${count} times`);
  });

  console.log(`\nTotal translations combined: ${allTranslations.length}`);
  console.log(`Total unique region names: ${regionNameCounts.size}`);
}

// Run the function
combineTranslations().catch(console.error);
