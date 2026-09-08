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

Production runs behind an **existing Traefik** on the host (running in
`network_mode: host`) — a `websecure` (443) entrypoint, a `letsencrypt`
certresolver, and a global `:80 → :443` redirect. `docker-compose.prod.yml`
only attaches routers to it: the stack brings up its own `novalup-prod-web`
bridge and Traefik reaches the containers by their IP on it (the
`traefik.docker.network` label). Nothing to pre-create; leave `TRAEFIK_NETWORK`
unset. (If your Traefik instead shares a user-defined network with its backends,
set `TRAEFIK_NETWORK` to it and flip `web` to `external: true` in the compose file.)

- `ai.novaluptech.com` → `web` (marketing site)
- `photos.novaluptech.com` → `product-photos` (the app) + a container Postgres
  (`pgdata` volume, no host port)

### One-time setup

1. **DNS:** point `A` records `ai` and `photos` (under `novaluptech.com`) at the
   server IP **before deploying** — the `letsencrypt` resolver uses the ACME
   HTTP-01 challenge, which needs the names resolving to the host for cert issuance.
2. **Google OAuth:** in Google Cloud Console, on the Web OAuth client, add
   - Authorized redirect URI: `https://photos.novaluptech.com/api/auth/callback/google`
   - Authorized JavaScript origin: `https://photos.novaluptech.com`
3. **Env:** on the server, `cp .env.production.example .env.production` and fill it in.
   Regenerate `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and set a strong
   `POSTGRES_PASSWORD`. `.env.production` is gitignored — it lives only on the server.

### SEO / Analytics (apps/web)

- **Google Search Console:** add a **Domain property** for `novaluptech.com`
  (covers every subdomain, incl. `ai.` and `photos.`). Verify by adding the
  `google-site-verification=…` **TXT record** it gives you to the DNS zone —
  no code or redeploy. Then submit `https://ai.novaluptech.com/sitemap.xml`.
- **Google Analytics 4:** create a GA4 property (or a new web data stream on an
  existing one) for `ai.novaluptech.com`, then put its Measurement ID in
  `NEXT_PUBLIC_GA_ID` in `.env.production` and redeploy with `--build`. Blank =
  Analytics not loaded. Link the GA4 property to the Search Console property
  under GA4 Admin → Product links.
- `NEXT_PUBLIC_SITE_URL` (default `https://ai.novaluptech.com`) drives canonicals,
  `sitemap.xml`, `robots.txt` and OG URLs.

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
