/**
 * Script to copy required asset folders to the ground-codes package
 *
 * This script copies:
 * - /packages/codebook/codebook-dist
 * - /packages/geoint/region-dist
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const rootDir = path.resolve(__dirname, "../../..");
const groundCodesDir = path.resolve(__dirname, "..");

// Source directories
const codebookDistPath = path.join(rootDir, "packages/codebook/codebook-dist");
const regionDistPath = path.join(rootDir, "packages/geoint/region-dist");

// Target directories
const codebookDistTarget = path.join(groundCodesDir, "codebook-dist");
const regionDistTarget = path.join(groundCodesDir, "region-dist");

/**
 * Copy directory recursively
 * @param {string} source - Source directory path
 * @param {string} target - Target directory path
 */
function copyDir(source, target) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);

    // Handle directories and files differently
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Copy codebook-dist
  if (fs.existsSync(codebookDistPath)) {
    copyDir(codebookDistPath, codebookDistTarget);
    console.log("✅ Codebook dist copied successfully");
  } else {
    console.error(`❌ Source directory not found: ${codebookDistPath}`);
  }

  // Copy region-dist
  if (fs.existsSync(regionDistPath)) {
    copyDir(regionDistPath, regionDistTarget);
    console.log("✅ Region dist copied successfully");
  } else {
    console.error(`❌ Source directory not found: ${regionDistPath}`);
  }
} catch (error) {}
