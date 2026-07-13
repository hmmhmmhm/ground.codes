import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import {
  evaluateSourceFile,
  isCheckedSourcePath,
} from "./code-size-policy.mjs";

const paths = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean)
  .filter(isCheckedSourcePath);

const violations = paths
  .map((path) =>
    evaluateSourceFile({ path, source: readFileSync(path, "utf8") }),
  )
  .filter(Boolean)
  .sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));

if (violations.length > 0) {
  console.error(`Source files over 450 lines: ${violations.length}`);
  for (const violation of violations) {
    console.error(`${violation.lines}\t${violation.path}\t${violation.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log("All maintained source files are within 450 lines.");
}
