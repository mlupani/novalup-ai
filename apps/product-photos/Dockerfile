# syntax=docker/dockerfile:1
#
# Build + run the product-photos app from the monorepo ROOT context.
# The build context MUST be the repo root — docker-compose.yml sets `context: .`.
# To build by hand:
#
#   docker build -f apps/product-photos/Dockerfile -t novalup-product-photos .
#
# The image keeps the full node_modules (next.config.ts has no `output: "standalone"`)
# so the Prisma CLI, the pg driver adapter, and the `@novalup/brand` workspace package
# all resolve at runtime. Acceptable size trade-off for a locally-run MVP.

FROM node:22-slim AS base
# openssl: Prisma needs it at generate/runtime. ca-certificates: outbound TLS to
# Kie.ai, Google OAuth and FormSubmit.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo


# ---- build stage: install workspace deps, generate the Prisma client, next build ----
FROM base AS build

# A throwaway DATABASE_URL so Prisma can resolve `env("DATABASE_URL")` from
# prisma.config.ts. `prisma generate` runs twice here — once via the
# product-photos `postinstall`, once via the `build` script (`prisma generate &&
# next build`) — and neither opens a connection, so the value is never used.
# Set BEFORE `pnpm install` so the postinstall generate sees it too.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/product-photos ./apps/product-photos

# No `--prod`: the runner stage needs the `prisma` CLI + `dotenv` (devDeps) to run
# `prisma migrate deploy`. `--filter product-photos...` pulls in @novalup/brand.
RUN pnpm install --frozen-lockfile --filter product-photos...
RUN pnpm --filter product-photos build


# ---- runner stage ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/product-photos
EXPOSE 3000

# Apply pending migrations, then start Next.js bound to 0.0.0.0 so the published
# port reaches the process inside the container.
#
# Fallback if `prisma migrate deploy` in this CMD proves flaky (e.g. a migration
# race on first boot): reduce the CMD to just
#     CMD ["sh", "-c", "pnpm exec next start -p 3000 -H 0.0.0.0"]
# and apply migrations as a one-off step instead:
#     docker compose run --rm product-photos pnpm exec prisma migrate deploy
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec next start -p 3000 -H 0.0.0.0"]
