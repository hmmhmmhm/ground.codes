const AUDIT_SEVERITIES = ["critical", "high", "moderate", "low"];

const unreadableAudit = () =>
  new Error("Expected a readable pnpm audit JSON document.");

const findFinalObjectStart = (text) => {
  let depth = 0;
  let insideString = false;

  for (let index = text.length - 1; index >= 0; index -= 1) {
    const character = text[index];
    if (character === '"') {
      let precedingBackslashes = 0;
      for (
        let escapeIndex = index - 1;
        escapeIndex >= 0 && text[escapeIndex] === "\\";
        escapeIndex -= 1
      ) {
        precedingBackslashes += 1;
      }
      if (precedingBackslashes % 2 === 0) insideString = !insideString;
    } else if (!insideString && character === "}") {
      depth += 1;
    } else if (!insideString && character === "{") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
};

export const parseProductionAudit = (rawAuditJson) => {
  if (typeof rawAuditJson !== "string") throw unreadableAudit();

  const trimmed = rawAuditJson.trim();
  const finalDocumentStart = findFinalObjectStart(trimmed);
  if (finalDocumentStart === -1) throw unreadableAudit();

  try {
    const document = JSON.parse(trimmed.slice(finalDocumentStart));
    if (document && typeof document === "object" && !Array.isArray(document)) {
      return document;
    }
  } catch {
    // Normalize parser details so raw audit diagnostics are never propagated.
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

const getPackageNames = (auditDocument) => {
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

export const analyzeProductionAudit = (rawAuditJson) => {
  const auditDocument = parseProductionAudit(rawAuditJson);
  const counts = getSeverityCounts(auditDocument);

  return {
    ok: counts.high === 0 && counts.critical === 0,
    counts,
    packageNames: getPackageNames(auditDocument),
  };
};

export const evaluateProductionAudit = (rawAuditJson) => {
  const { counts, ok } = analyzeProductionAudit(rawAuditJson);

  return { ok, counts };
};
