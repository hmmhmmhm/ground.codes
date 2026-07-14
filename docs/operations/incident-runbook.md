# Production Incident Runbook

Use this runbook for a production-smoke failure, SLO alert, elevated API error
rate, or a bad Worker/Pages deployment.

## 1. Declare and contain

1. Open an [incident issue][new-incident]. Record the UTC start time, incident
   owner, affected objective, user impact, and links to the triggering signal.
2. Check the [Production Smoke history][smoke] and preserve the failed run's
   profile, check timings, logs, and commit. Do not paste request data into the
   issue.
3. Read [`/metrics`][metrics] and `/readyz`. Record `runtimeCommit`, service,
   scope, startup time, counters, and the observation time. `/metrics` is a
   single Worker-isolate snapshot, not globally aggregated history.
4. Pause further production changes until an owner chooses mitigation or
   rollback. Keep the incident issue current with decisions and timestamps.

## 2. Query Cloudflare observability

In Cloudflare Workers Observability, select the `api-ground-codes` Worker and
the incident window, then start with the exact structured-log filter:

```text
event = "api.request.completed"
```

This is the `event=api.request.completed` signal; use Cloudflare's field/value
filter controls if its query view does not accept the displayed syntax.

Narrow or group the result without inspecting request content:

- **Status family:** filter `status` by `5xx`, then `4xx`, `3xx`, and `2xx`
  families (the field is a status-code string). Compare counts and rates.
- **Route duration:** filter or group by the route template, for example
  `route = "/v1/encode"` or `route = "/v1/search"`, and sort `durationMs`
  descending. Use `durationMs >= 2000` to inspect objective misses.
- **Deployment:** filter `runtimeCommit` to the 40-character SHA reported by
  `/metrics`; compare it with the preceding known-good SHA.
- **Shape check:** every completion record contains only `event`, `service`,
  `route`, `method`, `status`, `durationMs`, and `runtimeCommit`.

Logs must never include coordinates, search strings, ground codes, IP
addresses, headers, or credentials. Do not add these values to Cloudflare
queries, GitHub issues, screenshots, step summaries, or webhook messages.

## 3. Roll back to the last known-good SHA

1. Identify the last full [Production Smoke run][smoke] that passed before the
   incident. Verify its SHA against the applicable [API Worker][worker-history]
   or [Web Pages][web-history] deployment history; use the deployed artifact,
   not an unverified local build.
2. In the Cloudflare Workers & Pages deployment history, select the deployment
   tagged with that last known-good SHA and use **Rollback**. For a Web-only
   incident, roll back the Web Pages project; for an API incident, roll back
   the Worker. The [Grok Spiral Pages history][grok-history] is separate.
3. Confirm `/readyz` and `/metrics` report the expected runtime. Run the manual
   full [Production Smoke workflow][smoke] against production.
4. If the platform rollback cannot be used, revert the bad change on `main`
   with a normal reviewed commit and let the relevant deployment workflow
   publish it. Never force-push or move `main` to the old SHA.
5. Record the bad SHA, known-good SHA, deployment/run URLs, operator, and UTC
   timestamps in the incident issue.

## 4. Validate and close

Keep the issue open until user impact has stopped, readiness and Web-root
checks are healthy, Cloudflare filters show no continuing error spike, and the
active `runtimeCommit` is the remediated or rolled-back SHA. A full post-deploy
production smoke must pass before closure; link that run in the issue. Record
the error-budget impact, root cause, follow-up owner, and due date before
closing.

[new-incident]: https://github.com/hmmhmmhm/ground.codes/issues/new?labels=incident&title=Production%20incident%3A%20
[smoke]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/production-smoke.yml
[worker-history]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/deploy-api.yml
[web-history]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/deploy-web.yml
[grok-history]: https://github.com/hmmhmmhm/ground.codes/actions/workflows/deploy-grok-spiral.yml
[metrics]: https://api.ground.codes/metrics
