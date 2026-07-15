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
