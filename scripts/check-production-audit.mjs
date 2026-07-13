import { spawnSync } from "node:child_process";

import {
  evaluateProductionAudit,
  getProductionAuditPackageNames,
} from "./production-audit-policy.mjs";

const audit = spawnSync("pnpm", ["audit", "--prod", "--json"], {
  encoding: "utf8",
});

try {
  if (audit.error) throw audit.error;

  const result = evaluateProductionAudit(audit.stdout);
  const packageNames = getProductionAuditPackageNames(audit.stdout);

  console.log(
    `critical=${result.counts.critical} high=${result.counts.high} moderate=${result.counts.moderate} low=${result.counts.low}`,
  );
  if (packageNames.length > 0) {
    console.log(`advisory packages: ${packageNames.join(", ")}`);
  }

  if (!result.ok) process.exitCode = 1;
} catch {
  console.error("Production audit result is unreadable.");
  process.exitCode = 1;
}
