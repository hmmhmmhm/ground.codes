import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeProductionAudit } from "./production-audit-policy.mjs";

// Large workspaces can exceed Node's default buffer; keep a bounded 16 MiB cap.
export const AUDIT_MAX_BUFFER_BYTES = 16 * 1024 * 1024;

export const runProductionAudit = ({
  spawn = spawnSync,
  writeError = console.error,
  writeOutput = console.log,
} = {}) => {
  try {
    const audit = spawn("pnpm", ["audit", "--prod", "--json"], {
      encoding: "utf8",
      maxBuffer: AUDIT_MAX_BUFFER_BYTES,
    });
    if (audit.error) throw audit.error;

    const result = analyzeProductionAudit(audit.stdout);

    writeOutput(
      `critical=${result.counts.critical} high=${result.counts.high} moderate=${result.counts.moderate} low=${result.counts.low}`,
    );
    if (result.packageNames.length > 0) {
      writeOutput(`advisory packages: ${result.packageNames.join(", ")}`);
    }

    return result.ok ? 0 : 1;
  } catch {
    writeError("Production audit result is unreadable.");
    return 1;
  }
};

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) process.exitCode = runProductionAudit();
