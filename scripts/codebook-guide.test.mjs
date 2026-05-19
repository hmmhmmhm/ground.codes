import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const readText = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("codebook authoring guide", () => {
  test("keeps a canonical guide with the required policy sections", () => {
    const guide = readText("../packages/codebook/CODEBOOK_GUIDE.md");

    for (const heading of [
      "# Codebook Authoring Guide",
      "## Quick Start",
      "## Product Principles",
      "## Accepted Words",
      "## Rejected Words",
      "## Accept / Reject Examples",
      "## Review Decision Tree",
      "## Language-Specific Rules",
      "## Automated Checks",
      "## Generation Prompt Rules",
      "## Review Workflow",
      "## Compatibility Rules",
      "## Versioning Playbook",
      "## Required Checks",
    ]) {
      assert.match(
        guide,
        new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    }
  });

  test("keeps codebook decisions grounded in examples and compatibility policy", () => {
    const guide = readText("../packages/codebook/CODEBOOK_GUIDE.md");

    for (const phrase of [
      "Accept when",
      "Reject when",
      "When in doubt, reject",
      "same index",
      "legacy decode",
      "versioned migration",
    ]) {
      assert.match(guide, new RegExp(phrase));
    }
  });

  test("links the guide from the main codebook entry points", () => {
    const codebookReadme = readText("../packages/codebook/README.md");
    const checklist = readText(
      "../packages/codebook/codebook-dataset/subagent-review-checklist.md",
    );
    const agents = readText("../AGENTS.md");
    const generateScript = readText(
      "../packages/codebook/src/generate-codebook.ts",
    );
    const refineScript = readText("../packages/codebook/src/refine-codebook.ts");

    assert.match(codebookReadme, /CODEBOOK_GUIDE\.md/);
    assert.match(checklist, /\.\.\/CODEBOOK_GUIDE\.md/);
    assert.match(agents, /packages\/codebook\/CODEBOOK_GUIDE\.md/);
    assert.match(generateScript, /CODEBOOK_GUIDE\.md/);
    assert.match(refineScript, /CODEBOOK_GUIDE\.md/);
  });
});
