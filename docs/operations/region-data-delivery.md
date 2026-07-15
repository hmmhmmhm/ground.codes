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

| Kind     | Name                               | Consumer                             |
| -------- | ---------------------------------- | ------------------------------------ |
| Secret   | `CLOUDFLARE_ACCOUNT_ID`            | Publisher S3 endpoint                |
| Secret   | `R2_REGION_DATA_ACCESS_KEY_ID`     | Publisher authentication             |
| Secret   | `R2_REGION_DATA_SECRET_ACCESS_KEY` | Publisher authentication             |
| Variable | `REGION_DATA_BASE_URL`             | Read-only sync in CI and deploy jobs |

`REGION_DATA_BASE_URL` is `https://region-data.ground.codes`. Set each secret
in a separate stdin session so its value is absent from command arguments,
shell history, repository files, and logs:

```sh
set +x
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set R2_REGION_DATA_ACCESS_KEY_ID
gh secret set R2_REGION_DATA_SECRET_ACCESS_KEY
gh variable set REGION_DATA_BASE_URL --body \
  https://region-data.ground.codes
```

Paste one value into each secret command's stdin and finish it with EOF. Do not
use `--body` for secrets. The base URL is public and may be passed as an
argument.

Verify only the setting names:

```sh
gh secret list --app actions --json name \
  --jq '.[].name' | rg \
  '^(CLOUDFLARE_ACCOUNT_ID|R2_REGION_DATA_ACCESS_KEY_ID|R2_REGION_DATA_SECRET_ACCESS_KEY)$'
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
- GitHub reported all three secret names present and
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

## Credential rotation

1. Create a replacement R2 S3 token with `Object Read & Write` permission
   scoped only to `ground-codes-region-data`.
2. In separate stdin sessions, replace
   `R2_REGION_DATA_ACCESS_KEY_ID` and
   `R2_REGION_DATA_SECRET_ACCESS_KEY` in GitHub Actions.
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
