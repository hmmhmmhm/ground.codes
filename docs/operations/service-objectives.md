# Production Service Objectives

These initial objectives cover the public API and Web entry point. Review them
after each incident and after enough production history exists to set tighter
targets.

## Objectives

| Signal                     | Monthly objective                                                          | Measurement                                                                                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API readiness              | 99.9% monthly readiness availability                                       | Successful scheduled `GET https://api.ground.codes/readyz` production-smoke checks divided by all scheduled checks in the calendar month. A timeout, non-2xx response, invalid readiness body, or missed scheduled check is unavailable. |
| Web root                   | 99.9% monthly Web-root availability                                        | Successful scheduled `GET https://ground.codes/` production-smoke checks divided by all scheduled checks in the calendar month. A timeout, non-2xx response, invalid page body, or missed scheduled check is unavailable.                |
| Representative API latency | Representative encode and search requests complete in under 2 seconds      | The calendar-month p95 of each scheduled check's elapsed time in production-smoke summaries is below 2,000 ms. Track encode and search separately; treat a failed request as a latency-objective miss.                                   |
| Incident recovery          | A full post-deploy production smoke must pass before an incident is closed | Link the passing full-profile run to the incident issue and confirm its deployed commit before closure.                                                                                                                                  |

The availability error budget is `calendar-month minutes × 0.001` for each
availability objective. A 30-day month therefore permits 43 minutes 12 seconds
of unavailability for readiness and, independently, for the Web root. Do not
discard failed or missed checks because of deploys, retries, or provider
incidents; annotate them so the cause remains visible.

## Evaluation and escalation

Use the [Production Smoke workflow][smoke] as the synthetic source of record.
The 30-minute quick profile measures the two availability signals and
representative request latency continuously. The daily and post-deploy full
profiles provide broader regression evidence. Preserve the workflow timing
summary with the monthly calculation.

Open an incident immediately when readiness or the Web root fails, when a
post-deploy full smoke fails, or when the remaining monthly error budget is
exhausted. Investigate two consecutive latency samples at or above 2 seconds;
open an incident if the latency objective is breached or user impact is
visible. Follow the [incident runbook](./incident-runbook.md) for triage,
rollback, evidence capture, and closure.

[smoke]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/production-smoke.yml
