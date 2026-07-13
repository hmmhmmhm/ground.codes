# Production Dependency Audit

Audit date: 2026-07-13

## Policy

Production dependency changes must leave `pnpm security:audit` with zero
critical and zero high-severity findings. High and critical findings are never
waived, including findings introduced only through transitive dependencies. A
remaining moderate finding must have a recorded dependency path, runtime
applicability analysis, mitigating control, and concrete follow-up issue.

## Remediation

The Web runtime dependencies are pinned exactly:

| Package     | Previous manifest range | Audited version |
| ----------- | ----------------------- | --------------- |
| `cesium`    | `^1.141.0`              | `1.143.0`       |
| `next-intl` | `^4.0.2`                | `4.13.2`        |

The root lock policy uses selector-scoped overrides so only the vulnerable
transitive resolutions are replaced:

| Vulnerable resolution | Locked replacement | Rationale                                                                                              |
| --------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| `dompurify@3.4.2`     | `3.4.12`           | Replaces the vulnerable Cesium engine resolution without changing other DOMPurify lines.               |
| `picomatch@2.3.1`     | `2.3.2`            | Replaces the vulnerable matcher resolution used below workspace UI tooling.                            |
| `postcss@8.4.31`      | `8.4.49`           | Replaces the audited vulnerable Next.js PostCSS resolution while retaining Next.js 15.5 compatibility. |
| `postcss@8.5.3`       | `8.5.19`           | Moves the Tailwind PostCSS resolution to an audited release.                                           |
| `protobufjs@8.2.0`    | `8.7.1`            | Replaces the vulnerable Cesium engine/runtime serialization resolution.                                |

`pnpm-lock.yaml` records the exact direct versions and override results. The
production-audit policy contract also verifies that none of the five vulnerable
transitive resolution keys can return to the lock graph.

## Audit Result

| State              | Critical | High | Moderate | Low | Packages reported                                              |
| ------------------ | -------: | ---: | -------: | --: | -------------------------------------------------------------- |
| Before remediation |        0 |    2 |       12 |   3 | `dompurify`, `next-intl`, `picomatch`, `postcss`, `protobufjs` |
| After remediation  |        0 |    0 |        1 |   0 | `postcss`                                                      |

The after-remediation gate passes because critical and high are both zero. The
remaining moderate is documented below; it is not a high/critical waiver.

### Remaining moderate: PostCSS

- Package and advisory: `postcss@8.4.49`,
  [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) /
  CVE-2026-41305, CVSS 6.1. Versions below `8.5.10` are affected by unescaped
  `</style>` output when attacker-controlled CSS is parsed, stringified, and
  embedded in an HTML `<style>` element.
- Production dependency paths:
  - `apps/grok-spiral > next@15.5.18 > postcss@8.4.49`
  - `apps/web > next@15.5.18 > postcss@8.4.49`
  - `apps/web > next-intl@4.13.2 > next@15.5.18 > postcss@8.4.49`
- Runtime applicability: the package is present in the production dependency
  graph, but these applications use PostCSS as part of the trusted Next.js
  stylesheet build pipeline. Repository inspection found no application path
  that accepts user-supplied CSS, stringifies it with PostCSS, or embeds the
  result in a raw `<style>` element. The advisory's required attacker-controlled
  CSS flow is therefore not reachable through the current product interface.
- Mitigating controls: styles remain repository-authored and build-generated;
  application inputs are not treated as CSS; the Tailwind-related PostCSS path
  is already locked to patched `8.5.19`; and the audit gate continues to reject
  every high or critical production finding.
- Follow-up: [ground.codes issue #67](https://github.com/hmmhmmhm/ground.codes/issues/67)
  tracks moving the Next.js PostCSS path to `>=8.5.10` and removing this residual
  finding when the compatible dependency path is available.

## Verification Evidence

| Command                                                                       | Result                                                                                                                                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --test scripts/production-audit-policy.test.mjs` before package changes | RED as intended: rejected transitive `dompurify@3.4.2`; 8 other tests passed.                                                                                  |
| `pnpm --filter web add --save-exact next-intl@4.13.2 cesium@1.143.0`          | Completed; the manifest and lockfile record exact `4.13.2` and `1.143.0`.                                                                                      |
| `pnpm install --frozen-lockfile`                                              | Passed: lockfile up to date and resolution skipped.                                                                                                            |
| `node --test scripts/production-audit-policy.test.mjs` after package changes  | GREEN: 9 passed, 0 failed.                                                                                                                                     |
| `pnpm security:audit`                                                         | Passed policy: `critical=0 high=0 moderate=1 low=0`; advisory package `postcss`.                                                                               |
| `pnpm --filter web test`                                                      | 63 passed, 0 failed.                                                                                                                                           |
| `pnpm --filter web check-types`                                               | Passed with no TypeScript errors.                                                                                                                              |
| `pnpm --filter web build`                                                     | Next.js production build completed successfully.                                                                                                               |
| `pnpm --filter web test:e2e:smoke`                                            | 2 passed, 0 failed. The tracked `region-2.json` fixture was materialized only for the run and the original sparse-worktree exclusions were restored afterward. |
