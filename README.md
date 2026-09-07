# Novalup AI — monorepo

pnpm workspaces:

- `apps/web` — marketing homepage (Next.js, `next-intl`, port 3100)
- `apps/product-photos` — the AI Product Photos MVP (Next.js, Prisma, Auth.js, port 3000)
- `packages/brand` — shared Tailwind preset

## Product Photos — run locally with Docker

1. **Create `.env`:** `cp .env.example .env`
2. **Google OAuth:** create an OAuth client (Web) in Google Cloud Console.
   Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
   Put the id/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
   Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
3. **Kie.ai:** create an API key at kie.ai and set `KIE_API_KEY`. The app
   uses model `nano-banana-2`.
4. **FormSubmit:** set `FORMSUBMIT_EMAIL` to the address that should receive
   feedback. FormSubmit sends a one-time confirmation email the first time
   the app posts feedback — click the link in it to activate delivery.
5. **Run:** `docker compose up --build` → open `http://localhost:3000`
6. **Migrations:** run automatically on container start
   (`prisma migrate deploy`). To run them manually:
   `docker compose run --rm product-photos pnpm exec prisma migrate deploy`.
   To create a new migration during development:
   `pnpm --filter product-photos exec prisma migrate dev --name <name>`
   (needs a local Postgres running — `docker compose up -d postgres` — and `apps/product-photos/.env` with `DATABASE_URL`).

## Local development without Docker

```bash
pnpm install
docker compose up -d postgres
# apps/product-photos/.env → DATABASE_URL=postgresql://novalup:novalup@localhost:5432/product_photos
pnpm --filter product-photos prisma:deploy
pnpm dev:photos        # http://localhost:3000
pnpm dev:web           # http://localhost:3100
```

## Deploy to production

Production runs behind an **existing shared Traefik** on the host — an external
Docker network `web`, a `websecure` (443) entrypoint, and a `letsencrypt`
certresolver. `docker-compose.prod.yml` only attaches routers to it.

- `ai.novaluptech.com` → `web` (marketing site)
- `photos.novaluptech.com` → `product-photos` (the app) + a container Postgres
  (`pgdata` volume, no host port)

### One-time setup

1. **DNS:** point `A` records `ai` and `photos` (under `novaluptech.com`) at the server IP.
2. **Google OAuth:** in Google Cloud Console, on the Web OAuth client, add
   - Authorized redirect URI: `https://photos.novaluptech.com/api/auth/callback/google`
   - Authorized JavaScript origin: `https://photos.novaluptech.com`
3. **Env:** on the server, `cp .env.production.example .env.production` and fill it in.
   Regenerate `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and set a strong
   `POSTGRES_PASSWORD`. `.env.production` is gitignored — it lives only on the server.

### Deploy / redeploy

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Images build on the server. Migrations (`prisma migrate deploy`) run automatically
when the `product-photos` container starts.

### After the first deploy

- Check HTTPS and a valid cert on both hosts.
- Sign in with Google end to end, then run one generation.
- Submit feedback once and click the FormSubmit activation email (delivery stays
  off until you do).

### Postgres backups

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U novalup product_photos | gzip > backup-$(date +%F).sql.gz
```

## Tests

`pnpm --filter product-photos test`
