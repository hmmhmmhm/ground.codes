# Production Service Objectives

These initial objectives cover the public API and Web entry point. Review them
after each incident and after enough production history exists to set tighter
targets.

## Objectives

| Signal                | Monthly objective                                                          | Check ID               |
| --------------------- | -------------------------------------------------------------------------- | ---------------------- |
| API readiness         | 99.9% monthly readiness availability                                       | `api.readiness`        |
| Web root              | 99.9% monthly Web-root availability                                        | `web.root`             |
| Representative encode | Every expected request passes in under 2 seconds                           | `earth.english.encode` |
| Representative search | Every expected request passes in under 2 seconds                           | `earth.english.search` |
| Incident recovery     | A full post-deploy production smoke must pass before an incident is closed | Full profile           |

## Reproducible monthly measurement

Evaluate one UTC calendar month at a time. Expected slots are the 30-minute
cron invocations at 00 and 30 minutes of every UTC hour; manual, daily-full,
and post-deploy runs are supplemental evidence and are not added to the monthly
denominator. A missing, cancelled, not created, or non-passing scheduled slot
is a failed slot for every required check it did not pass.

For each availability check ID, calculate monthly availability as:

```text
passed expected slots / all expected slots × 100
```

The failed-slot error budget is
`floor(all expected slots × (1 - 0.999))`. A 30-day month has 1,440 expected
slots, so at most 1 failed slot still meets 99.9%. This synthetic calculation
does not claim that a failed slot represents 30 minutes of actual downtime.

Calculate latency compliance separately for `earth.english.encode` and
`earth.english.search`. An expected slot complies only when the exact check ID
passes and its recorded `durationMs` < 2,000 ms. Monthly latency compliance is
`passing-and-fast expected slots / all expected slots`; every missing, errored,
or slow check is a latency miss. Do not assign a numeric duration to a check
that did not complete.

## Evaluation and escalation

Use the [Production Smoke workflow][smoke] as the synthetic source of record.
Preserve the expected-slot list, matched workflow run, exact check ID, outcome,
and elapsed time with the monthly calculation. The daily and post-deploy full
profiles provide broader regression evidence.

Open an incident immediately when readiness or the Web root fails, when a
post-deploy full smoke fails, or when the remaining monthly error budget is
exhausted. Record every latency miss; open an incident after two consecutive
latency misses or immediately when user impact is visible. Follow the
[incident runbook](./incident-runbook.md) for triage, rollback, evidence
capture, and closure.

[smoke]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/production-smoke.yml
