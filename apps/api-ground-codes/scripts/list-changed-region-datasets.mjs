import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const [baseRef, headRef = "HEAD"] = process.argv.slice(2);
const regionDistDir = "packages/geoint/region-dist";

const listAllDatasets = () =>
  readdirSync(resolve(process.cwd(), regionDistDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => fileName.replace(/\.json$/, ""))
    .sort();

const normalizeBaseRef = () => {
  if (!baseRef || /^0+$/.test(baseRef)) return null;
  return baseRef;
};

const base = normalizeBaseRef();
if (!base) {
  console.log(listAllDatasets().join(","));
  process.exit(0);
}

const changedFiles = execFileSync(
  "git",
  ["diff", "--name-only", base, headRef, "--", `${regionDistDir}/`],
  { encoding: "utf8" },
)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const datasets = changedFiles
  .filter((fileName) => fileName.endsWith(".json"))
  .map((fileName) =>
    fileName.slice(`${regionDistDir}/`.length).replace(/\.json$/, ""),
  )
  .sort();

console.log([...new Set(datasets)].join(","));
