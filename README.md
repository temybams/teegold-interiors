# Teegold Interiors

Business management and invoicing application for Teegold Interiors — customers, catalogue,
quotations, invoices with measurement-driven pricing, payments and invoice sharing.

## Layout

Two independent projects. Each has its own `package.json`, its own `node_modules` and is
installed, run and deployed on its own.

```
teegold/
├── client/   Next.js + TypeScript + Tailwind  (browser)
└── server/   Express + TypeScript + Zod       (API, Prisma, Postgres)
```

### Inside `server/src`

| Folder         | Holds                                                            |
| -------------- | ---------------------------------------------------------------- |
| `config/`      | Environment parsing and app constants                            |
| `routes/`      | URL to handler wiring only                                       |
| `controllers/` | Request handling for one endpoint                                |
| `services/`    | Business logic and the only place that talks to Prisma           |
| `validations/` | Zod schemas plus the `validate` middleware that enforces them    |
| `middlewares/` | Cross-cutting concerns: auth, RBAC, 404s, the error handler      |
| `utils/`       | Pure helpers — money, pricing, passwords, tokens, HTTP errors    |
| `lib/`         | The shared Prisma client instance                                |
| `generated/`   | Prisma client output. Generated, gitignored, never edited        |

Requests flow one way: `routes → validations → controllers → utils`. Nothing untrusted reaches a
controller, because `validate()` rejects it at the route.

## Requirements

- Node.js 20+
- Yarn 1.x
- Docker (for local Postgres)

## Getting started

Two terminals, one per side.

```bash
# terminal 1 — server
cd server
yarn install
cp .env.example .env   # then fill in JWT_SECRET and the SEED_ADMIN_* values
yarn db:up             # Postgres in Docker, on localhost:5433
yarn db:migrate        # creates the tables
yarn db:seed           # creates the first admin from SEED_ADMIN_*
yarn dev               # http://localhost:4000

# terminal 2 — client
cd client
yarn install
cp .env.example .env.local
yarn dev               # http://localhost:3000
```

Generate a secret for `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The container publishes Postgres on host port **5433**, not 5432, so it cannot collide with
another Postgres already running on this machine.

## Production

Host the web app on **Vercel**, the API + Postgres on **Render**. Step-by-step:
[DEPLOY.md](DEPLOY.md).

## Scripts

Both sides share the same script names.

| Script           | Server                     | Client                   |
| ---------------- | -------------------------- | ------------------------ |
| `yarn dev`       | tsx watch on `src/index.ts` | `next dev` on port 3000 |
| `yarn build`     | `tsc` to `dist/`            | `next build`            |
| `yarn start`     | `node dist/index.js`        | `next start`            |
| `yarn typecheck` | ✅                          | ✅                       |
| `yarn lint`      | ✅                          | ✅                       |
| `yarn format`    | ✅                          | ✅                       |

The server adds database scripts of its own:

| Script             | Does                                                  |
| ------------------ | ----------------------------------------------------- |
| `yarn db:up`       | Starts Postgres in Docker on port 5433                |
| `yarn db:down`     | Stops it, keeping the volume                          |
| `yarn db:generate` | Regenerates the Prisma client into `src/generated`    |
| `yarn db:migrate`  | Creates and applies a migration                       |
| `yarn db:seed`     | Upserts the admin from `SEED_ADMIN_*`                 |
| `yarn db:studio`   | Opens Prisma Studio to browse the data                |

Run `yarn db:generate` after every `git pull` that touches `prisma/schema.prisma`, because the
generated client is not committed.

## API

| Method  | Path                    | Access | Purpose                                       |
| ------- | ----------------------- | ------ | --------------------------------------------- |
| `GET`   | `/api/health`           | Public | Liveness, service name, version, uptime       |
| `POST`  | `/api/pricing/preview`  | Public | Validates a line, returns area and line total  |
| `POST`  | `/api/auth/login`       | Public | Sets httpOnly cookies and returns the user     |
| `POST`  | `/api/auth/refresh`     | Cookie | Issues a fresh 12-hour access cookie           |
| `POST`  | `/api/auth/logout`      | Public | Clears cookies and the stored refresh token    |
| `GET`   | `/api/auth/me`          | Signed in | The current user, re-read from the database |
| `POST`  | `/api/auth/password-reset` | Public | Emails a reset link (always looks successful) |
| `GET`   | `/api/users`            | Admin  | Lists staff and admins                         |
| `POST`  | `/api/users/invites`    | Admin  | Invites staff; emails the link when SMTP is set |
| `PATCH` | `/api/users/:id/status` | Admin  | Activates or suspends an account               |
| `GET`   | `/api/products`         | Signed in | Catalogue list                              |
| `POST`  | `/api/products`         | Admin  | Add a product                                  |
| `PATCH` | `/api/products/:id`     | Admin  | Edit a product                                 |
| `PATCH` | `/api/products/:id/status` | Admin | Enable or disable a product                 |
| `GET`   | `/api/customers`        | Signed in | Client list, optional `?q=`                 |
| `POST`  | `/api/customers`        | Signed in | Add a client                                 |
| `PATCH` | `/api/customers/:id`    | Signed in | Edit a client                                |

The session lives in httpOnly cookies (`teegold_access`, `teegold_refresh`), not in
`localStorage`. Suspending someone takes effect on their next click: `requireAuth` re-reads
the user, so an already-issued cookie stops working rather than lasting until it expires.

Every failure returns the same shape, with `issues` present on validation errors:

```json
{
  "error": {
    "message": "Please check the highlighted fields",
    "code": "VALIDATION_ERROR",
    "issues": [{ "field": "width", "message": "Width is required for products priced per m²" }]
  }
}
```

## Build stages

1. **Foundation** — two projects, TypeScript, server validation, design tokens, local Postgres ✅
2. **Auth** — Prisma schema, Admin/Staff roles, JWT login, RBAC, login page ✅
3. **Catalogue and clients** — products with pricing types and soft disable, client records ✅
4. **Invoices** — product-driven measurement, totals, discount, frozen invoice date
5. **Print and share** — printable invoice, PDF, WhatsApp / link / email
6. **Quotations and payments** — quotations, convert to invoice, payment status, list filters
7. **Dashboard, reports and settings**
8. **Public landing page** — marketing site and request-a-quote

## Design tokens

The admin app carries the full indigo palette; the public landing page uses a quieter
warm-neutral set and only accents with indigo. Tokens live in
[`client/src/app/globals.css`](client/src/app/globals.css).

| Token       | Hex       | Use                                |
| ----------- | --------- | ---------------------------------- |
| Canvas      | `#FAFAFF` | App background                     |
| Ink         | `#16162B` | Text and totals                    |
| Indigo      | `#4F46E5` | Primary buttons, active nav, links |
| Deep indigo | `#1E1B3A` | Sidebar, mobile top bar            |
| Lilac       | `#EDEBFE` | Area result, total band, pills     |
| Hairline    | `#E7E7F0` | Borders and row separators         |
| Paid        | `#067647` | Status only                        |
| Pending     | `#B4690E` | Status only                        |
| Cancelled   | `#B42318` | Status only                        |
