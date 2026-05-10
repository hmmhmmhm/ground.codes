import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ground-codes-pack-"));

const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();

const readFiles = (directory) => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...readFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
};

try {
  const packOutput = run(
    "pnpm",
    ["pack", "--pack-destination", tempRoot],
    packageRoot,
  );
  const tarballName = packOutput.split("\n").at(-1);
  if (!tarballName) throw new Error("pnpm pack did not return a tarball name");

  const tarballPath = path.isAbsolute(tarballName)
    ? tarballName
    : path.join(tempRoot, tarballName);
  const extractedPath = path.join(tempRoot, "extracted");
  fs.mkdirSync(extractedPath);
  run("tar", ["-xzf", tarballPath, "-C", extractedPath], tempRoot);

  const packedPackageRoot = path.join(extractedPath, "package");
  const packedPackageJson = JSON.parse(
    fs.readFileSync(path.join(packedPackageRoot, "package.json"), "utf8"),
  );
  const runtimeDependencySections = [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
  ];

  for (const section of runtimeDependencySections) {
    for (const dependency of Object.keys(packedPackageJson[section] ?? {})) {
      if (dependency.startsWith("@repo/")) {
        throw new Error(
          `Private workspace dependency leaked into ${section}: ${dependency}`,
        );
      }
    }
  }

  for (const file of readFiles(path.join(packedPackageRoot, "dist"))) {
    if (!/\.(js|mjs|cjs|d\.ts)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("@repo/")) {
      throw new Error(
        `Private workspace import leaked into ${path.relative(packedPackageRoot, file)}`,
      );
    }
  }

  const consumerRoot = path.join(tempRoot, "consumer");
  fs.mkdirSync(consumerRoot);
  fs.writeFileSync(
    path.join(consumerRoot, "package.json"),
    JSON.stringify({ type: "module", private: true }, null, 2),
  );
  run("pnpm", ["add", tarballPath], consumerRoot);

  run(
    "node",
    [
      "--input-type=module",
      "-e",
      `
        import { encode, decode } from "ground-codes";

        const earth = await encode(
          { lat: 37.566, lng: 126.978 },
          { regionLevel: 2, language: "english" },
        );
        const korean = await encode(
          { lat: 37.566, lng: 126.978 },
          { regionLevel: 2, language: "korean" },
        );
        const moon = await encode(
          { lat: 0.674, lng: 23.473 },
          { regionLevel: 2, body: "moon", language: "english" },
        );
        const mars = await encode(
          { lat: -14.568, lng: 175.472 },
          { regionLevel: 2, body: "mars", language: "english" },
        );
        const koreanMoon = await encode(
          { lat: 8.35, lng: 30.84 },
          { regionLevel: 2, body: "moon", language: "korean" },
        );
        const koreanMars = await encode(
          { lat: 64.3, lng: -86.4 },
          { regionLevel: 2, body: "mars", language: "korean" },
        );
        const chineseMoon = await encode(
          { lat: 8.35, lng: 30.84 },
          { regionLevel: 2, body: "moon", language: "chinese" },
        );
        const chineseMars = await encode(
          { lat: 64.3, lng: -86.4 },
          { regionLevel: 2, body: "mars", language: "chinese" },
        );

        if (!earth || !korean || !moon || !mars || !koreanMoon || !koreanMars || !chineseMoon || !chineseMars) {
          throw new Error("Standalone package returned an empty code");
        }

        for (const code of [koreanMoon, koreanMars, chineseMoon, chineseMars]) {
          const regionLabel = code.split("-")[0] ?? "";
          if (/[A-Za-z]/.test(regionLabel)) {
            throw new Error(\`Localized planetary label contains Latin text: \${regionLabel}\`);
          }
        }

        await decode(earth, { regionLevel: 2, language: "english" });
      `,
    ],
    consumerRoot,
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
