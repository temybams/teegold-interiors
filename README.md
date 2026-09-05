# Teegold Interiors

Business management and invoicing application for Teegold Interiors — customers, catalogue,
quotations, invoices with measurement-driven pricing, payments and invoice sharing.

## Layout

Client and backend are separate top-level folders, tied together by Yarn workspaces.

```
teegold/
├── client/   Next.js app — everything the browser runs
├── server/   Express API, Prisma and its Postgres compose file
├── shared/   Types, Zod schemas, money and pricing helpers used by both
└── (root)    Yarn workspaces, ESLint, Prettier, base tsconfig
```

Nothing backend lives outside `server/`. `shared/` sits on its own because both sides import it —
it exists so the browser and the API calculate a line total the same way, and the area of a blind
is never worked out twice with two different rounding rules.

## Stack

| Part     | Choice                                        |
| -------- | --------------------------------------------- |
| Monorepo | Yarn workspaces                               |
| `client` | Next.js App Router, TypeScript, Tailwind CSS  |
| `server` | Express, TypeScript, Zod                      |
| `shared` | Types, Zod schemas, money and pricing helpers |
| Database | PostgreSQL via Prisma (Stage 2)               |
| Hosting  | Client on Vercel, server on Render            |

## Requirements

- Node.js 20+
- Yarn 1.x
- Docker (for local Postgres)

## Getting started

```bash
yarn install

cp server/.env.example server/.env
cp client/.env.example client/.env.local

yarn db:up   # starts Postgres on localhost:5432
yarn dev     # server on :4000, client on :3000
```

`yarn dev` builds `shared/` first, then runs both sides together.

## Scripts

| Script                        | What it does                         |
| ----------------------------- | ------------------------------------ |
| `yarn dev`                    | Shared build, then server and client |
| `yarn dev:server`             | Backend only, watch mode             |
| `yarn dev:client`             | Frontend only                        |
| `yarn build`                  | Build shared, server and client      |
| `yarn typecheck`              | TypeScript across every workspace    |
| `yarn lint`                   | ESLint across the repo               |
| `yarn format`                 | Prettier write                       |
| `yarn db:up` / `yarn db:down` | Start / stop local Postgres          |

Postgres is defined in [`server/docker-compose.yml`](server/docker-compose.yml); `yarn db:up`
works from the repo root, and `yarn db:up` inside `server/` does the same thing.

## Build stages

The app is built in stages, each one pushed separately so the work can be followed commit by
commit.

1. **Foundation** — monorepo, TypeScript, API skeleton, design tokens, local Postgres ✅
2. **Auth** — Prisma schema, Admin/Staff roles, JWT login, RBAC, login page
3. **Catalogue and clients** — products with pricing types and soft disable, client records
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
