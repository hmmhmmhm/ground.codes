# Private self-hosted Supabase connection

This Worker uses PostgreSQL through `HYPERDRIVE`; changing `api.aka.page` DNS does not move its database connection. Keep `SUPABASE_DB_URL` out of source control.

The local connection is Worker → Hyperdrive → Workers VPC TCP service → Cloudflare Tunnel → PostgreSQL. The database must have TLS with a trusted certificate and hostname verification (`verify_full`). Do not publish PostgreSQL port 5432 on the Mac or add a public TCP proxy.

Use a dedicated database role with SELECT on `public.ground_code_regions`, schema access and the required PostGIS functions. Do not use the Supabase service-role API key as a PostgreSQL password. Preserve the existing Hyperdrive configuration until the new route has passed an actual region query.

The active Hyperdrive ID is `ca33d9b7bc8240b88e02f40a8ab6492b`; the rollback ID is `bcd8dcf99beb470b9d4e3f1e0259878e`. On 2026-10-04, the Worker binding was updated without changing its deployed code. A Seoul encode query returned `Seoul-Beechcruet`, and the local database showed the `ground_reader` connection. The VPC service verifies the certificate and hostname with `verify_full`. The DB TLS certificate expires on 2029-10-03 and must be renewed before then.

After configuring the private route, update only the `HYPERDRIVE` ID, build and deploy this Worker, then verify coordinate encode/decode and nearest-region lookup. The public service URL stays `https://api.ground.codes`. If the Mac sleeps or loses Internet connectivity, database-backed region queries become unavailable.

Rollback: redeploy the prior Worker version or restore the prior Hyperdrive ID. Keep the managed database intact during the rollback window; reconcile any changed data before switching back.

Reference: https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database-vpc/

## Region maintenance

GitHub-hosted runners cannot reach the private database directly. `SUPABASE_DB_MAINTENANCE_ENABLED=false` prevents deployment jobs from applying schema or importing into the retained managed connection. When region datasets change, deployment fails explicitly: import and verify them on the Mac, then dispatch the workflow with `import_all_regions=false`. Do not enable remote DB maintenance unless a separately approved private runner/network path and appropriate credentials have been configured. The runtime `ground_reader` cannot import data.
