FROM node:22-bookworm-slim

ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git unzip \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.0.0 --activate \
  && curl -fsSL https://bun.sh/install | bash -s -- bun-v1.3.14

WORKDIR /repo

ARG RAILWAY_GIT_COMMIT_SHA

RUN git init \
  && git remote add origin https://github.com/hmmhmmhm/ground.codes.git \
  && git sparse-checkout init --cone \
  && git sparse-checkout set \
    .npmrc \
    package.json \
    pnpm-lock.yaml \
    pnpm-workspace.yaml \
    turbo.json \
    apps/api-ground-codes \
    packages/codebook \
    packages/geoint \
    packages/ground-codes \
    packages/typescript-config \
  && if [ -n "$RAILWAY_GIT_COMMIT_SHA" ]; then \
    git fetch --depth 1 origin "$RAILWAY_GIT_COMMIT_SHA"; \
  else \
    git fetch --depth 1 origin main; \
  fi \
  && git checkout --detach FETCH_HEAD \
  && rm -rf .git

RUN pnpm install --frozen-lockfile
RUN pnpm --filter api-ground-codes build

EXPOSE 3000

CMD ["pnpm", "--filter", "api-ground-codes", "start"]
