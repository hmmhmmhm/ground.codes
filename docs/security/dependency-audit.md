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

| Package        | Previous manifest range | Audited or peer-compatible version |
| -------------- | ----------------------- | ---------------------------------- |
| `@swc/helpers` | Transitive `0.5.15`     | `0.5.17`                           |
| `cesium`       | `^1.141.0`              | `1.143.0`                          |
| `next-intl`    | `^4.0.2`                | `4.13.2`                           |

The root lock policy uses selector-scoped overrides so only the vulnerable or
peer-incompatible transitive resolutions are replaced:

| Superseded resolution | Locked replacement | Rationale                                                                                                                                                                                          |
| --------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@swc/helpers@0.5.15` | `0.5.17`           | Aligns the `next-intl` SWC path with `@swc/core@1.15.43`, whose optional helper peer requires `>=0.5.17`.                                                                                          |
| `dompurify@3.4.2`     | `3.4.12`           | Replaces the vulnerable Cesium engine resolution without changing other DOMPurify lines.                                                                                                           |
| `picomatch@2.3.1`     | `2.3.2`            | Replaces the vulnerable matcher resolution used below workspace UI tooling.                                                                                                                        |
| `postcss@8.4.31`      | `8.4.49`           | Replaces the audited vulnerable Next.js PostCSS resolution while retaining Next.js 15.5 compatibility.                                                                                             |
| `postcss@8.5.3`       | `8.5.19`           | Moves the Tailwind PostCSS resolution to an audited release.                                                                                                                                       |
| `protobufjs@8.2.0`    | `8.7.1`            | Cesium 1.143 already moves the active graph to `^8.6.5`, resolved as `8.7.1`; this selector remains a defense-in-depth lock against reintroducing the vulnerable `8.2.0` resolution through drift. |

`pnpm-lock.yaml` records the exact direct versions and override results. The
production-audit policy contract also verifies that none of the five vulnerable
transitive resolution keys can return and that the `next-intl` SWC path binds a
peer-compatible helper version.

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
| `pnpm install --offline --frozen-lockfile --strict-peer-dependencies`         | Passed: lockfile up to date, offline packages reused, and no peer warnings.                                                                                    |
| `node --test scripts/production-audit-policy.test.mjs` after package changes  | GREEN: 9 passed, 0 failed.                                                                                                                                     |
| `pnpm security:audit`                                                         | Passed policy: `critical=0 high=0 moderate=1 low=0`; advisory package `postcss`.                                                                               |
| `pnpm --filter web test`                                                      | 63 passed, 0 failed.                                                                                                                                           |
| `pnpm --filter web check-types`                                               | Passed with no TypeScript errors.                                                                                                                              |
| `pnpm --filter web build`                                                     | Next.js production build completed successfully.                                                                                                               |
| `pnpm --filter web test:e2e:smoke`                                            | 2 passed, 0 failed. The tracked `region-2.json` fixture was materialized only for the run and the original sparse-worktree exclusions were restored afterward. |

## Reproducible GitHub Governance

Repository governance is declared by `scripts/github-governance.mjs` and is
available through two root commands:

- `pnpm github:governance:apply` idempotently creates `main-protection` when it
  is absent or updates the ruleset with the same ID when it already exists. It
  also enables automatic merged-branch deletion, Dependabot security updates,
  secret scanning, push protection, and optional secret-scanning features that
  the public-repository API reports as supported.
- `pnpm github:governance:verify` performs read-only checks for the active
  `main` ruleset, strict required `verify` status, administrator-only bypass,
  branch protections, and repository security settings.

Both commands default to `hmmhmmhm/ground.codes`; an explicit target can be
supplied as `--repository owner/name` when testing the script against another
repository. Normal output contains only setting names, enabled/disabled state,
the ruleset ID, and named optional-feature warnings. Subprocess diagnostics,
credentials, and environment values are never printed.

Unsupported `secret_scanning_non_provider_patterns` or
`secret_scanning_validity_checks` fields are reported as named warnings. Secret
scanning and push protection are core controls: failure to enable or verify
either one stops the command. The unit tests use an injected API client and do
not make network calls.

## Applied Repository Controls

The controls were applied to `hmmhmmhm/ground.codes` and then re-read with the
read-only verifier at `2026-07-14T00:27:21+09:00`.

- Ruleset `main-protection` is active with ID `18880399`. It targets
  `refs/heads/main`, requires the strict `verify` status, blocks deletion and
  non-fast-forward updates, and permits bypass only for the repository
  administrator role.
- Draft PR [#68](https://github.com/hmmhmmhm/ground.codes/pull/68) exposed the
  stable `verify` check before the ruleset was activated. The initial check
  completed successfully in
  [Actions run 29261831398](https://github.com/hmmhmmhm/ground.codes/actions/runs/29261831398/job/86856845479).
- Automatic merged-branch deletion, Dependabot alerts, Dependabot security
  updates, secret scanning, and push protection all verify as enabled.
- Actions secret `MOSHI_WEBHOOK_TOKEN` is present; GitHub reports its update at
  `2026-07-13T15:21:36Z`. Only the secret name and timestamp were read or
  recorded, never its value.
- `secret_scanning_non_provider_patterns` and
  `secret_scanning_validity_checks` remain named `unsupported` warnings. GitHub
  reports the fields for this user-owned public repository but leaves them
  disabled because the features require an eligible organization plan with
  Secret Protection. Their absence does not weaken the enabled core secret
  scanning or push-protection controls.

Read-only API evidence is available at:

- `https://api.github.com/repos/hmmhmmhm/ground.codes/rulesets/18880399`
- `https://api.github.com/repos/hmmhmmhm/ground.codes`
- `https://api.github.com/repos/hmmhmmhm/ground.codes/vulnerability-alerts`
- `https://api.github.com/repos/hmmhmmhm/ground.codes/automated-security-fixes`

## CI Security Gate

The stable `verify` job installs the frozen lockfile and then immediately runs
`pnpm security:audit`. A high or critical production advisory therefore stops
CI before formatting, builds, browser installation, or deployment-relevant
tests consume additional runner time.

The same job runs `pnpm runtime:check-pins` and `pnpm scripts:test` before the
build. The script test glob includes the production-audit policy and runner,
the API runtime-pin contract, the GitHub governance contract, and the workflow
supply-chain contract. This keeps the dependency, action-pin, and repository
governance policies under the single required `verify` status that will be
activated during the external repository configuration step.
