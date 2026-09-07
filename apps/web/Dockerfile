# syntax=docker/dockerfile:1
#
# Build + run the marketing site (apps/web) from the monorepo ROOT context.
# The build context MUST be the repo root — docker-compose.prod.yml sets `context: .`.
# To build by hand:
#
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_PRODUCT_PHOTOS_URL=https://photos.novaluptech.com \
#     -t novalup-web .
#
# Like apps/product-photos/Dockerfile, the image keeps the full node_modules
# (next.config.ts has no `output: "standalone"`) so the `@novalup/brand`
# workspace package resolves at build time and Next resolves its own deps at
# runtime. Acceptable size trade-off for a small marketing site.

FROM node:22-slim AS base
RUN corepack enable
WORKDIR /repo


# ---- build stage: install workspace deps, next build ----
FROM base AS build

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so the
# public URL of the Product Photos app has to be known HERE, not at runtime.
# docker-compose.prod.yml passes it through as a build arg.
ARG NEXT_PUBLIC_PRODUCT_PHOTOS_URL=http://localhost:3000
ENV NEXT_PUBLIC_PRODUCT_PHOTOS_URL=$NEXT_PUBLIC_PRODUCT_PHOTOS_URL

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# `--filter web...` pulls in @novalup/brand (used by tailwind.config.ts).
RUN pnpm install --frozen-lockfile --filter web...
RUN pnpm --filter web build


# ---- runner stage ----
FROM base AS runner
ENV NODE_ENV=production

# Run as the unprivileged `node` user shipped in the base image. It needs write
# access to /repo (Next writes its cache).
COPY --from=build --chown=node:node /repo /repo
USER node

WORKDIR /repo/apps/web
EXPOSE 3100

# Bind to 0.0.0.0 so Traefik reaches the process inside the container.
CMD ["sh", "-c", "pnpm exec next start -p 3100 -H 0.0.0.0"]
