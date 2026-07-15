FROM node:22-bookworm-slim

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@11.4.0 --activate \
  && curl -fsSL https://bun.sh/install | bash -s -- bun-v1.3.14

WORKDIR /repo

ARG REGION_DATA_BASE_URL=https://region-data.ground.codes

COPY . .

RUN pnpm install --frozen-lockfile
RUN REGION_DATA_BASE_URL="${REGION_DATA_BASE_URL}" \
  node scripts/sync-region-data.mjs --groups region-dist,region-db --prune
RUN pnpm --filter api-ground-codes build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "api-ground-codes", "start"]
