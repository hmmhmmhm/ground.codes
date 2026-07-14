import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

export const readText = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8");
export const readJson = (path) => JSON.parse(readText(path));
const workflowDirectory = new URL("../.github/workflows/", import.meta.url);
export const workflowUrls = readdirSync(workflowDirectory, {
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
  .map((entry) => new URL(entry.name, workflowDirectory))
  .sort((left, right) => left.pathname.localeCompare(right.pathname));

const normalizedLines = (source) => source.replace(/\r\n?/g, "\n").split("\n");
const indentation = (line) => line.match(/^ */)[0].length;
const unquote = (value) => {
  const trimmed = value.trim();
  const match = /^(?:"([\s\S]*)"|'([\s\S]*)')$/.exec(trimmed);
  return match ? (match[1] ?? match[2]) : trimmed;
};

const yamlScalarValues = (source, key) => {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^\\s*(?:-\\s+)?${escapedKey}:\\s*([^\\n]*?)\\s*$`,
    "gm",
  );
  return [...source.matchAll(pattern)].map((match) => unquote(match[1]));
};

const directChildScalarValues = (source, key) => {
  const lines = normalizedLines(source);
  const childLines = lines.slice(1).filter((line) => line.trim() !== "");
  const childIndent = Math.min(...childLines.map(indentation));
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^ {${childIndent}}${escapedKey}:\\s*(.*?)\\s*$`);
  return childLines.flatMap((line) => {
    const match = pattern.exec(line);
    return match ? [unquote(match[1])] : [];
  });
};

export const indentedYamlBlock = (source, key) => {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headerPattern = new RegExp(`^( *)${escapedKey}:\\s*$`);
  const lines = normalizedLines(source);
  const headers = lines.flatMap((line, index) => {
    const match = headerPattern.exec(line);
    return match ? [{ index, indent: match[1].length }] : [];
  });

  assert.equal(headers.length, 1, `${key} must appear exactly once`);
  const [{ index: start, indent }] = headers;
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() !== "" && indentation(line) <= indent) break;
    end += 1;
  }
  return lines.slice(start, end).join("\n").trimEnd();
};

export const workflowSteps = (source) => {
  const lines = normalizedLines(source);
  const steps = [];

  lines.forEach((line, stepsIndex) => {
    const stepsMatch = /^( *)steps:\s*$/.exec(line);
    if (!stepsMatch) return;

    const stepsIndent = stepsMatch[1].length;
    let blockEnd = stepsIndex + 1;
    while (blockEnd < lines.length) {
      const candidate = lines[blockEnd];
      if (candidate.trim() !== "" && indentation(candidate) <= stepsIndent)
        break;
      blockEnd += 1;
    }

    const itemIndexes = [];
    let itemIndent = null;
    for (let index = stepsIndex + 1; index < blockEnd; index += 1) {
      const itemMatch = /^( *)-\s+/.exec(lines[index]);
      if (!itemMatch) continue;
      itemIndent ??= itemMatch[1].length;
      if (itemMatch[1].length === itemIndent) itemIndexes.push(index);
    }

    itemIndexes.forEach((start, position) => {
      const end = itemIndexes[position + 1] ?? blockEnd;
      const block = lines.slice(start, end).join("\n").trimEnd();
      const [name = null] = yamlScalarValues(block, "name");
      steps.push({ block, name });
    });
  });

  return steps;
};

export const workflowStep = (source, name) => {
  const matches = workflowSteps(source).filter((step) => step.name === name);
  assert.equal(matches.length, 1, `${name} step must appear exactly once`);
  return matches[0].block;
};

export const workflowStepCommand = (step) => {
  const block = typeof step === "string" ? step : step.block;
  const lines = normalizedLines(block);
  const runHeaders = lines.flatMap((line, index) => {
    const match = /^( *)(-\s+)?run:\s*(.*?)\s*$/.exec(line);
    return match ? [{ index, match }] : [];
  });

  if (runHeaders.length === 0) return null;
  assert.equal(runHeaders.length, 1, "workflow step must have one run command");
  const [{ index, match }] = runHeaders;
  const [, spaces, listPrefix = "", value] = match;
  const blockScalar = /^([|>][+-]?)(?:\s+#.*)?$/.exec(value);
  if (!blockScalar) return unquote(value);

  const runIndent = spaces.length + listPrefix.length;
  const commandLines = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line.trim() !== "" && indentation(line) <= runIndent) break;
    commandLines.push(line);
  }
  const contentIndent = Math.min(
    ...commandLines.filter((line) => line.trim() !== "").map(indentation),
  );
  const content = commandLines.map((line) => line.slice(contentIndent));
  return (
    blockScalar[1].startsWith(">") ? content.join(" ") : content.join("\n")
  ).trim();
};

export const assertFrozenInstallPolicy = ({
  path,
  source,
  requireInstall = false,
}) => {
  const steps = workflowSteps(source);
  const installSteps = steps.filter(
    (step) => step.name === "Install dependencies",
  );
  if (requireInstall) {
    assert.equal(
      installSteps.length,
      1,
      `${path} must have exactly one Install dependencies step`,
    );
    assert.equal(
      workflowStepCommand(installSteps[0]),
      "pnpm install --frozen-lockfile",
      `${path} Install dependencies must run pnpm install --frozen-lockfile`,
    );
  }

  for (const step of steps) {
    const command = workflowStepCommand(step);
    if (command?.includes("pnpm install")) {
      assert.equal(
        command,
        "pnpm install --frozen-lockfile",
        `${path} package installs must run pnpm install --frozen-lockfile`,
      );
    }
  }
};

export const assertPinnedBunPolicy = ({ path, source }) => {
  const steps = workflowSteps(source);
  const bunSteps = steps.filter((step) =>
    yamlScalarValues(step.block, "uses")[0]?.startsWith("oven-sh/setup-bun@"),
  );

  for (const step of bunSteps) {
    const label = step.name ?? "setup-bun";
    const inputError =
      `${path} ${label} step must configure direct with: ` +
      'bun-version: "1.3.1"';
    try {
      const withBlock = indentedYamlBlock(step.block, "with");
      const stepIndent = indentation(normalizedLines(step.block)[0]) + 2;
      assert.equal(indentation(normalizedLines(withBlock)[0]), stepIndent);
      assert.deepEqual(directChildScalarValues(withBlock, "bun-version"), [
        "1.3.1",
      ]);
    } catch {
      throw new Error(inputError);
    }
  }

  assert.equal(
    yamlScalarValues(source, "bun-version").length,
    bunSteps.length,
    `${path} bun-version may only appear in setup-bun steps`,
  );
};
