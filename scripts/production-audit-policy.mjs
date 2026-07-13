const AUDIT_SEVERITIES = ["critical", "high", "moderate", "low"];

const unreadableAudit = () =>
  new Error("Expected a readable pnpm audit JSON document.");

export const parseProductionAudit = (rawAuditJson) => {
  if (typeof rawAuditJson !== "string") throw unreadableAudit();

  const trimmed = rawAuditJson.trim();
  const objectStarts = [];
  for (let index = trimmed.length - 1; index >= 0; index -= 1) {
    if (trimmed[index] === "{") objectStarts.push(index);
  }

  for (const index of [0, ...objectStarts]) {
    try {
      const document = JSON.parse(trimmed.slice(index));
      if (
        document &&
        typeof document === "object" &&
        !Array.isArray(document)
      ) {
        return document;
      }
    } catch {
      // Try the next object start so diagnostics may precede the final document.
    }
  }

  throw unreadableAudit();
};

const getSeverityCounts = (auditDocument) => {
  const vulnerabilities = auditDocument.metadata?.vulnerabilities;
  const counts = {};

  for (const severity of AUDIT_SEVERITIES) {
    const count = vulnerabilities?.[severity];
    if (!Number.isSafeInteger(count) || count < 0) throw unreadableAudit();
    counts[severity] = count;
  }

  return counts;
};

export const evaluateProductionAudit = (rawAuditJson) => {
  const counts = getSeverityCounts(parseProductionAudit(rawAuditJson));

  return {
    ok: counts.high === 0 && counts.critical === 0,
    counts,
  };
};

export const getProductionAuditPackageNames = (rawAuditJson) => {
  const auditDocument = parseProductionAudit(rawAuditJson);
  const advisoryNames = Object.values(auditDocument.advisories ?? {}).map(
    (advisory) => advisory?.module_name,
  );
  const vulnerabilityNames = Object.entries(
    auditDocument.vulnerabilities ?? {},
  ).map(([name, vulnerability]) => vulnerability?.name ?? name);

  return [...new Set([...advisoryNames, ...vulnerabilityNames])]
    .filter((name) => typeof name === "string" && name.length > 0)
    .sort((left, right) => left.localeCompare(right));
};
