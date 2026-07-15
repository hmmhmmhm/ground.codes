# Region Data Delivery Operations

This runbook covers the Cloudflare R2 boundary used to publish and retrieve
Ground Codes region data. Publication is private and authenticated. Runtime,
CI, and local materialization read immutable objects through the public custom
domain.

## Infrastructure boundary

| Setting                   | Value                                                      |
| ------------------------- | ---------------------------------------------------------- |
| R2 bucket                 | `ground-codes-region-data`                                 |
| Public read origin        | `https://region-data.ground.codes`                         |
| S3 endpoint               | `https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com` |
| S3 region                 | `auto`                                                     |
| R2 jurisdiction           | `default`                                                  |
| Minimum custom-domain TLS | `1.2`                                                      |
| Managed development URL   | Disabled                                                   |

The [custom domain][r2-public-buckets] exposes object GET and HEAD requests but
does not expose a bucket listing. The managed `r2.dev` URL stays disabled so
the custom domain is the only public read path. Writes use the S3-compatible
endpoint and an [R2 token][r2-authentication] with `Object Read & Write`
permission scoped only to
`ground-codes-region-data`; normal CI and public pull requests never receive
that credential.

Published releases are append-only. Data objects live under their committed
`objects/<sha256>.json.gz` keys and a release manifest is written last. Never
overwrite a conflicting object or manifest, delete an old release as part of
a normal deployment, or grant the publisher bucket-administration access.

## GitHub Actions settings

The repository contains these settings. Record and inspect names or presence,
not values.

| Kind     | Scope                   | Name                               | Consumer                             |
| -------- | ----------------------- | ---------------------------------- | ------------------------------------ |
| Secret   | Repository              | `CLOUDFLARE_ACCOUNT_ID`            | Deploys and publisher S3 endpoint    |
| Secret   | `region-data-publisher` | `R2_REGION_DATA_ACCESS_KEY_ID`     | Publisher authentication             |
| Secret   | `region-data-publisher` | `R2_REGION_DATA_SECRET_ACCESS_KEY` | Publisher authentication             |
| Variable | Repository              | `REGION_DATA_BASE_URL`             | Read-only sync in CI and deploy jobs |

`REGION_DATA_BASE_URL` is `https://region-data.ground.codes`. Set each secret
in a separate stdin session so its value is absent from command arguments,
shell history, repository files, and logs:

```sh
set +x
gh api --silent --method PUT \
  repos/{owner}/{repo}/environments/region-data-publisher \
  -F wait_timer=0 \
  -F 'deployment_branch_policy[protected_branches]=true' \
  -F 'deployment_branch_policy[custom_branch_policies]=false'
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set R2_REGION_DATA_ACCESS_KEY_ID --env region-data-publisher
gh secret set R2_REGION_DATA_SECRET_ACCESS_KEY --env region-data-publisher
gh variable set REGION_DATA_BASE_URL --body \
  https://region-data.ground.codes
```

Paste one value into each secret command's stdin and finish it with EOF. Do not
use `--body` for secrets. The base URL is public and may be passed as an
argument.

Verify only the setting names:

```sh
gh secret list --app actions --json name --jq '.[].name' | \
  rg '^CLOUDFLARE_ACCOUNT_ID$'
gh secret list --env region-data-publisher --json name --jq '.[].name' | \
  rg '^R2_REGION_DATA_(ACCESS_KEY_ID|SECRET_ACCESS_KEY)$'
gh variable get REGION_DATA_BASE_URL
```

## Provision and verify

Use the repository-local Wrangler version and an authenticated Cloudflare
session:

```sh
pnpm exec wrangler r2 bucket create ground-codes-region-data
pnpm exec wrangler r2 bucket list
pnpm exec wrangler r2 bucket info ground-codes-region-data
pnpm exec wrangler r2 bucket domain add ground-codes-region-data \
  --domain region-data.ground.codes \
  --zone-id "$CLOUDFLARE_ZONE_ID" \
  --min-tls 1.2
pnpm exec wrangler r2 bucket domain get ground-codes-region-data \
  --domain region-data.ground.codes
pnpm exec wrangler r2 bucket dev-url get ground-codes-region-data
```

The bucket and domain API responses must identify the expected names, the
custom domain must be enabled with active ownership and SSL, and the managed
development URL must report disabled. Do not paste complete API responses into
issues or logs.

Before the first release, both the root and an unknown object must return a
non-success status and no XML or JSON object listing. After publication, repeat
the unknown-object check and make a GET for one exact object key from the
committed manifest; expect the unknown path to remain non-successful and the
published object to return `200` with `Content-Type: application/gzip`.

```sh
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  https://region-data.ground.codes/
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  https://region-data.ground.codes/not-a-published-object
```

## Provisioning evidence

The boundary was provisioned and re-read on 2026-07-15:

- Wrangler reported `ground-codes-region-data` in the default jurisdiction
  with Standard storage and an empty initial inventory.
- `region-data.ground.codes` was enabled with active ownership and SSL, minimum
  TLS 1.2, while the managed `r2.dev` URL remained disabled.
- The custom-domain root and an unknown object both returned `404`; neither
  response exposed a bucket listing.
- The `ground-codes-region-data-publisher` token was active, its S3 credentials
  listed the target bucket, and the same credentials received `403` for a
  different account bucket. This proves the token is bucket-scoped rather than
  an R2 administrator credential.
- GitHub reported the Cloudflare account ID at repository scope, the two R2
  publisher secret names in the protected environment, and
  `REGION_DATA_BASE_URL=https://region-data.ground.codes`.

For the initial operator-run publication, the owner explicitly approved a
local escrow copy at
`$HOME/Documents/personal-agent/secrets/r2-region-data.env`. It is outside a
Git worktree, its parent directory is mode `700`, and the file is mode `600`.
Do not copy it into this repository, attach it to an issue or artifact, or use
it in read-only CI. Revalidate its permissions during rotation and remove or
replace it when the associated Cloudflare token is revoked.

## Initial release evidence

The first release was generated and shadow-verified on 2026-07-15 with Node
22.23.1. The `region-dist` and `region-db` trees at branch commit `8547f41`
matched `origin/main` commit `827847ddf42f5432f104b40eaf3ec9791d5e0581`
before generation.

| Measurement               |                                                                    Result |
| ------------------------- | ------------------------------------------------------------------------: |
| Version                   | `sha256-4b6d31b92ce300ca4ca6d98fb24d966fad61b098639e51f33134b5922ccd3190` |
| Manifest SHA-256          |        `bf3068b4d416287d617332b3d77f92f9d8c6dbcbdf4c32ab7b9b07056a36a9f1` |
| Logical entries           |                                                                     2,031 |
| `region-dist` entries     |                                                                       901 |
| `region-db` entries       |                                                                     1,130 |
| Deduplicated gzip objects |                                                                     1,044 |
| Uncompressed bytes        |                                                             8,971,117,492 |
| Compressed object bytes   |                                                               738,078,307 |
| Pointer bytes             |                                                                       187 |
| Manifest bytes            |                                                                   759,643 |

The first publication uploaded all 1,044 objects and 738,078,307 bytes, then
uploaded the manifest. An immediate second publication uploaded zero objects
and zero bytes, skipped all 1,044 verified objects, and did not upload the
existing byte-identical manifest.

Two independent runs started from an empty shadow directory with no R2 write
credentials in the environment. Each public sync selected and downloaded all
2,031 entries, skipped zero local files, and materialized 8,971,117,492 bytes.
Each subsequent source-vs-shadow exact verification reported the same version
and inventory with zero missing, extra, changed, or unreadable paths. A public
object GET returned `200 application/gzip`, the release manifest returned
`200 application/json`, and an unpublished object path returned `404`.

## Phase A shadow rollout evidence

Phase A merged through [pull request 68][phase-a-pr] on 2026-07-15 as commit
`781350d71cfbb0f8add1cf872f8cf5aa4ad879df`. Its authoritative
[pull-request CI][phase-a-pr-ci] and [merged-main CI][phase-a-main-ci] passed
the public R2 sync, security and data audits, unit and coverage suites, build,
and browser smoke gates. The [API deployment][phase-a-api-deploy] also passed,
including the verified R2 materialization, PostGIS work, deployment, and
production smoke steps.

The Web and Grok Spiral deployments exposed a pnpm 11 command-name collision
after the Phase A merge: `pnpm --filter <package> deploy` selected pnpm's
built-in deploy command instead of the package script. [Pull request
70][phase-a-hotfix-pr] changed both calls to `pnpm --filter <package> run
deploy` and merged as
`8d748dc10b9d88a9d76a02d89bb7d3fcc7db1c09`. Its [merged-main
CI][phase-a-hotfix-ci], [Web deployment][phase-a-web-deploy], and [Grok Spiral
deployment][phase-a-grok-deploy] all passed. The subsequent [full production
smoke][phase-a-production-smoke] exercised every language profile and the API
documentation, ASCII Earth, biased region search, undecodable-code,
missing-region, and unsupported-route operational checks successfully.

A post-merge verification then started from an empty directory with all R2
write credential variables explicitly absent. Public synchronization from
`https://region-data.ground.codes` downloaded all 2,031 selected entries,
skipped zero, pruned zero, and materialized 8,971,117,492 bytes. The public
manifest SHA-256 was
`bf3068b4d416287d617332b3d77f92f9d8c6dbcbdf4c32ab7b9b07056a36a9f1`.
Exact manifest-to-filesystem verification reported 901 `region-dist` entries,
1,130 `region-db` entries, and zero missing, extra, changed, or unreadable
paths for release
`sha256-4b6d31b92ce300ca4ca6d98fb24d966fad61b098639e51f33134b5922ccd3190`.
These checks completed before any Phase B deletion began.

## Phase B fresh-checkout evidence

Phase B commit `4b84d1fdb73e727d824d352fbc53f879cd0c06b4` removed both
managed data trees from the Git tree. On 2026-07-15, the opt-in verifier
created a shallow detached checkout of that exact commit in a temporary
directory and confirmed that neither managed directory initially existed. It
then ran with all Cloudflare and R2 write credential variables explicitly
removed:

```sh
node scripts/region-data/fresh-checkout.mjs --run
```

The first public synchronization selected and downloaded all 2,031 entries,
skipped zero, pruned zero, and materialized 8,971,117,492 bytes. Exact
verification matched release
`sha256-4b6d31b92ce300ca4ca6d98fb24d966fad61b098639e51f33134b5922ccd3190`
and manifest SHA-256
`bf3068b4d416287d617332b3d77f92f9d8c6dbcbdf4c32ab7b9b07056a36a9f1`,
with 901 `region-dist` entries, 1,130 `region-db` entries, and zero missing,
extra, changed, or unreadable paths.

The clean checkout passed the frozen install, security audit, formatting and
source-size gates, runtime-pin and operational script tests, data and language
audits, lint, type checks, all package unit and coverage suites, all six build
tasks, and both Playwright smoke tests. Cloudflare Worker packaging also
passed in `--dry-run` mode, and the verifier confirmed that public R2 sync
precedes PostGIS schema, change detection, and import steps in the API deploy
workflow. No production service or R2 object was mutated.

After those checks, the verifier deleted both local managed directories.
LevelDB-backed tests can update local metadata while reading a materialized
database, so this deletion prevents test-side metadata changes from being
mistaken for source changes. A second public synchronization again downloaded
all 2,031 entries and 8,971,117,492 bytes with zero skipped or pruned paths;
exact verification reproduced the same version, manifest, 901/1,130 group
counts, and zero mismatches. The temporary checkout and both materializations
were then removed automatically. This proves that a Git-only Phase B checkout
can be reconstructed twice from the public, immutable R2 release without
write credentials.

## Protected publication workflow

`.github/workflows/publish-region-data.yml` is a manual, main-branch-only
workflow. Its job uses the `region-data-publisher` environment, serializes
publication attempts, and has only `contents: write` and
`pull-requests: write` repository permissions. R2 write credentials are
referenced only by the immutable publication step; active-release sync,
audits, ordinary CI, and pull requests use only the public base URL.

The environment boundary was provisioned and re-read on 2026-07-15. GitHub
reported protected-branch deployments enabled, custom branch policies
disabled, and exactly the two R2 publisher secret names in the environment.
The repository-level secret inventory retained `CLOUDFLARE_ACCOUNT_ID` but no
`R2_REGION_DATA_*` write credential. Repository workflow permissions remained
read-only by default, while the Actions pull-request setting was enabled so
the publisher's explicit `pull-requests: write` grant can open its release PR.
No secret values were read back.

The `transformation` input is a closed choice rather than a shell command.
`none` verifies that the current materialization remains reproducible.
`region-1` rebuilds the tracked level-1 source inputs and then reconstructs
the embedded databases. Any additional transformation must first be added to
the workflow's explicit `case` statement in a reviewed pull request.

Every dispatch synchronizes the active release, runs the selected reviewed
transformation, executes the data and 180-language quality audits, and
generates a deterministic staged release. If the generated pointer is
byte-identical to the active pointer, the workflow exits successfully without
calling the publisher, pushing a branch, or opening a pull request.

The local no-content path was exercised on 2026-07-15 with all write
credential variables absent. Public sync downloaded the active 2,031 entries
and both data-audit suites passed, including 180/180 language completeness and
an 85.7% average quality score with no score below 80%. Deterministic
generation produced the same
`sha256-4b6d31b92ce300ca4ca6d98fb24d966fad61b098639e51f33134b5922ccd3190`
version, 2,031 entries, and 1,044 unique objects. The tracked pointer remained
byte-identical, so the publisher and pull-request paths were not invoked.

The first GitHub-hosted `none` dispatch then completed in [publication run
29389992473][phase-b-publish-none]. It regenerated the same version from all
2,031 entries and 1,044 unique objects, reported `changed=false`, and skipped
the publisher, public re-materialization, documentation, branch, and pull
request steps. GitHub had no `data-release/*` ref or pull request afterward.

For changed content, the workflow publishes immutable objects and the
manifest, deletes its local managed directories, reconstructs both groups
through the public endpoint, and performs exact manifest verification. It
then records the run below and accepts exactly these two staged paths:

- `packages/geoint/region-data-release.json`
- `docs/operations/region-data-delivery.md`

Materialized data and staging output remain ignored and are never staged. Any
other tracked change or unignored new file—including a credential file or an
unrelated source path—makes commit validation fail. A successful run pushes
`data-release/<version>` and opens a normal pull request against `main`; the
release does not become active until that pull request passes CI and merges.

Before the first content-changing production dispatch, run the publisher
fixture test against a separate non-production bucket and credentials. Require
one missing object upload, an immutable manifest written last, a second
idempotent publication with zero uploads, and an exact public
materialization. Record the bucket, run, and cleanup evidence here without
recording credential values. No content-changing production dispatch occurred
during this cutover; this remains a hard prerequisite for the first one.

## Phase B stage-gate evidence

[Pull request 81][phase-b-pr] removed the managed data from Git, proved a
fresh R2-only checkout, and added the protected publisher. Its first browser
smoke attempt exposed Playwright's automatic CI diff capture trying to buffer
the multi-gigabyte deletion. Commit `9c7b601a52a7e95bae997eaa064e4cb66d985b22`
kept commit metadata but disabled diff capture, after which the authoritative
[PR CI][phase-b-pr-ci] passed public materialization, security, formatting,
source-size, runtime-pin, operational, geoint, data, language, lint, type,
package, coverage, build, and browser gates.

The PR merged as `105334d9b5cec32abc4d68290d6eac46b42d1f6e`.
Its [main CI][phase-b-main-ci] and applicable [Web deployment][phase-b-web-deploy]
passed. The first API deployment stopped before any production mutation:
after syncing only `region-dist`, the tests correctly failed because the
Git-removed embedded `region-db` was absent. [Pull request
82][phase-b-api-hotfix-pr] changed the deploy verifier to materialize both
groups; its [PR CI][phase-b-api-hotfix-ci] passed and it merged as
`c232408950f494bd12bf425f5a3f8c13aa764c7e`. The final [main
CI][phase-b-final-main-ci] and [API deployment][phase-b-api-deploy] both
passed. The API run materialized both groups, passed the previously failing
tests, applied the PostGIS schema, detected no changed dataset, skipped import,
deployed the Worker, and passed commit-pinned production smoke. Grok Spiral
did not run because neither merge changed its path-filtered app, UI, workflow,
or root dependency files.

An independent [full production smoke][phase-b-production-smoke] checked out
the final main commit and passed readiness, Web metadata, every supported
language profile, API documentation, region search, and error-route checks.
A direct `/metrics` validation reported service `api-ground-codes`, scope
`worker-isolate`, runtime commit
`c232408950f494bd12bf425f5a3f8c13aa764c7e`, and an uptime consistent with the
isolate's `startedAt` timestamp. The API deployment's own smoke also required
that exact runtime commit before succeeding.

GitHub API re-reads found only
`packages/geoint/region-data-release.json` among the pointer and two managed
tree prefixes. The active `main-protection` ruleset still required strict
`verify` and prevented deletion and non-fast-forward updates. Dependabot
alerts and security updates, secret scanning, and push protection remained
enabled. All check runs on the final merge were green. The publisher
environment still allowed protected branches only, contained exactly the two
R2 write-secret names, and repository workflow permissions remained read-only
by default.

The final local stage gate began with both managed directories absent. Public
sync downloaded all 2,031 entries and 8,971,117,492 bytes. Independent exact
manifest verification reproduced version
`sha256-4b6d31b92ce300ca4ca6d98fb24d966fad61b098639e51f33134b5922ccd3190`,
901 `region-dist` entries, 1,130 `region-db` entries, and zero missing, extra,
changed, or unreadable paths. The materialization was removed afterward.

### Publication history

<!-- region-data-release-history -->

- `sha256-4b6d31b92ce300ca4ca6d98fb24d966fad61b098639e51f33134b5922ccd3190`
  was the initial operator-published release; see Initial release evidence.

## Credential rotation

1. Create a replacement R2 S3 token with `Object Read & Write` permission
   scoped only to `ground-codes-region-data`.
2. In separate stdin sessions, replace
   `R2_REGION_DATA_ACCESS_KEY_ID` and
   `R2_REGION_DATA_SECRET_ACCESS_KEY` in the `region-data-publisher`
   environment.
3. Run the publisher against the current release. It must complete
   idempotently without uploading or changing existing objects.
4. Revoke the previous token in Cloudflare, then verify that only the
   replacement token remains active. Record the rotation time and operator,
   never either credential value.

Rotate immediately after suspected disclosure, operator access removal, or a
scope error. Routine rotation should also confirm that the account ID and base
URL settings are unchanged.

## Rollback and deprovisioning

A release rollback changes only the committed release pointer in a normal,
reviewed pull request. Old immutable manifests and objects remain readable, so
restoring the previous pointer does not require an R2 mutation.

At this stage gate, Git history contains only the initial R2 release pointer,
so there is no distinct predecessor to restore. The final clean sync and exact
verification above prove that this retained immutable release remains
readable. After the first content-changing release, rollback means copying the
canonical pointer from the last known-good commit into a new branch, opening a
normal pull request, and requiring CI to materialize and verify that older
release before merge. Never overwrite an object or manifest to roll back.

For an infrastructure rollback, first stop publisher workflows, then revoke
the publisher token and remove the two R2 credential secrets. Disable or remove
the custom domain only after confirming that no active deployment references
it. Keep the bucket and immutable releases until the repository pointer and all
deployments have moved away from R2 and the retention decision has been
reviewed. Bucket deletion is a separate destructive operation and is never a
routine rollback step.

[r2-authentication]: https://developers.cloudflare.com/r2/api/tokens/
[r2-public-buckets]: https://developers.cloudflare.com/r2/buckets/public-buckets/
[phase-a-api-deploy]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29383869833
[phase-a-grok-deploy]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29384373708
[phase-a-hotfix-ci]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29384373695
[phase-a-hotfix-pr]: https://github.com/hmmhmmhm/ground.codes/pull/70
[phase-a-main-ci]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29383869899
[phase-a-pr]: https://github.com/hmmhmmhm/ground.codes/pull/68
[phase-a-pr-ci]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29383546050
[phase-a-production-smoke]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29384519200
[phase-a-web-deploy]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29384373723
[phase-b-api-deploy]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29389806946
[phase-b-api-hotfix-ci]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29389464495
[phase-b-api-hotfix-pr]: https://github.com/hmmhmmhm/ground.codes/pull/82
[phase-b-final-main-ci]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29389806941
[phase-b-main-ci]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29389253996
[phase-b-pr]: https://github.com/hmmhmmhm/ground.codes/pull/81
[phase-b-pr-ci]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29388901071
[phase-b-production-smoke]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29390670878
[phase-b-publish-none]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29389992473
[phase-b-web-deploy]: https://github.com/hmmhmmhm/ground.codes/actions/runs/29389254015
