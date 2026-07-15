# Coverage policy

The coverage baseline was measured on 2026-07-14 with Bun 1.3.1 and c8 11.0.0.
The API branch baseline was recalibrated after the completion-boundary change
against authoritative GitHub Actions run `29303671837` on Ubuntu with Node 22.
The operations boundary was expanded on 2026-07-15 and measured with Node
22.23.1 and c8 11.0.0 after adding the R2 delivery modules and their behavior
tests.
Line and function minimums are fixed at 0.8 for every target. Branch minimums
are each measured ratio rounded down by less than 0.001.

| Target       |                          Lines |                    Functions |                     Branches | Branch minimum |
| ------------ | -----------------------------: | ---------------------------: | ---------------------------: | -------------: |
| ground-codes | 3288/4053 (0.8112509252405625) |   78/88 (0.8863636363636364) | 695/998 (0.6963927855711423) |          0.696 |
| api          | 1847/2005 (0.9211970074812967) | 115/130 (0.8846153846153846) | 256/353 (0.7252124645892352) |          0.725 |
| web          |   647/648 (0.9984567901234568) |    36/37 (0.972972972972973) | 289/485 (0.5958762886597938) |          0.595 |
| operations   | 2500/2635 (0.9487666034155597) | 135/136 (0.9926470588235294) | 757/862 (0.8781902552204176) |          0.878 |

## Source boundaries

- ground-codes includes `packages/ground-codes/src/**/*.ts`, excluding only
  declarations.
- api includes all 22 maintained `apps/api-ground-codes/src/**/*.ts` runtime
  sources, excluding tests and declarations.
- web includes the six critical runtime sources for the Ground Codes client,
  share URLs, locale mapping, celestial-body maps, Google Maps availability,
  and browser zoom prevention declared in `scripts/coverage-policy.json`.
- operations includes the audit, smoke, workflow, governance, and coverage
  policy modules plus the R2 `manifest.mjs`, `generate-release.mjs`, `sync.mjs`,
  `publish.mjs`, and `verify.mjs` modules declared in
  `scripts/coverage-policy.json`.

Bun LCOV remains authoritative for API and Web line/function coverage. Genuine
Node/tsx behavior probes collect c8 branches over the complete declared target,
and the validated BRDA/BRF/BRH records are merged into the Bun reports. Test
files, declarations, generated tables, build output, and third-party assets are
outside these maintained-source boundaries; ordinary runtime modules are not.

After authoritative CI calibration, thresholds may only increase. This API
correction replaces the pre-CI local baseline; it does not permit routine
downward ratcheting. A changed source boundary or instrumentation tool requires
a newly documented measurement and must not be used to hide a regression.
