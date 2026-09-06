# Production deploy

Teegold is two apps + one database:

| Piece | Host | What it is |
| --- | --- | --- |
| Web | [Vercel](https://vercel.com) | `client/` (Next.js) |
| API | [Render](https://render.com) | `server/` (Express) |
| Postgres | Render (or Neon) | Prisma migrations |

Cookies already use `Secure` + `SameSite=None` in production so login works across `*.vercel.app` and `*.onrender.com`.

## 0. Push this branch first

Deploy only what is on GitHub. Commit and push the wrap-up work (settings, reports, payments, WebP images, etc.) before creating the hosts.

```bash
git status
# when ready:
# git add … && git commit … && git push -u origin HEAD
```

## 1. Database + API on Render

Easiest path: use the blueprint in `render.yaml`.

1. Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect `temybams/teegold-interiors`
3. Select the branch you pushed
4. Apply the blueprint (`teegold-db` + `teegold-api`)

Then set these env vars on **teegold-api** (Blueprint marks them as fill-in):

| Key | Value |
| --- | --- |
| `CLIENT_ORIGIN` | Your Vercel URL, e.g. `https://teegold.vercel.app` (no trailing slash) |
| `SEED_ADMIN_NAME` | Owner’s name |
| `SEED_ADMIN_EMAIL` | Login email |
| `SEED_ADMIN_PASSWORD` | Strong password (8+ chars) |
| `SMTP_*` | Optional for now — see below |

`DATABASE_URL` and `JWT_SECRET` are filled by the blueprint.

After the first successful deploy, open **Shell** on the API service and seed the admin once:

```bash
yarn db:seed
```

Health check: `https://YOUR-API.onrender.com/api/health` should return `{ "status": "ok", … }`.

> Free Render web services sleep after idle. First request after sleep can take ~30–60s. For day-to-day shop use, upgrade the web service to a paid starter plan when you can.

## 2. Web on Vercel

1. [Vercel](https://vercel.com) → **Add New Project** → import `temybams/teegold-interiors`
2. **Root Directory:** `client`
3. Enable **Include source files outside of the Root Directory** (needed for `@teegold/shared`)
4. **Install Command:**

```bash
yarn --cwd ../shared install && yarn --cwd ../shared build && yarn install
```

5. **Build Command:** `yarn build`
6. **Output:** leave default (Next.js)
7. Environment variable:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |

Deploy. Note the Vercel URL, then go back to Render and set `CLIENT_ORIGIN` to that exact URL (or your custom domain). Redeploy the API so CORS picks it up.

## 3. First business checklist

1. Sign in at `https://YOUR-APP.vercel.app/login` with the seed admin
2. **Settings** → real phone, email, address, bank details
3. **Catalogue** → prices / products
4. **Staff** → invite colleagues (copy link / WhatsApp until SMTP is set)
5. Raise a test invoice → Print / PDF / share link `/i/...`

## 4. Custom domain (recommended)

- Vercel: Project → Domains → add `teegoldinteriors.ng` (or whatever you own)
- Render: optional custom API host, e.g. `api.teegoldinteriors.ng`
- Update both:
  - Vercel `NEXT_PUBLIC_API_URL`
  - Render `CLIENT_ORIGIN`
- Redeploy both after changing either

## 5. SMTP (optional at launch)

Without SMTP the shop still runs: invites and password-reset links appear in the admin UI; invoices can be shared on WhatsApp / link / PDF download.

When you want real email, add to the API service:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="Teegold Interiors <you@gmail.com>"
```

Gmail needs an [App Password](https://myaccount.google.com/apppasswords). Better long-term: Resend, Mailgun, or your domain host’s SMTP.

## 6. Local vs production env reminder

| | Local | Production |
| --- | --- | --- |
| Client | `NEXT_PUBLIC_API_URL=http://localhost:4000` | Render HTTPS URL |
| API `CLIENT_ORIGIN` | `http://localhost:3000` | Vercel / custom HTTPS URL |
| DB | Docker `localhost:5433` | Render / Neon connection string |
| `NODE_ENV` | `development` | `production` |

Never commit real `.env` files.
