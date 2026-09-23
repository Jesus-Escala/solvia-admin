# Solvia — Backoffice

The platform backoffice of **Solvia**, a multi-tenant SaaS for credit management and collections. Solvia staff use it to watch every business on the platform, onboard new businesses, manage their users and plans, and handle the access requests that arrive from the public landing page.

It is a single-page app built with React 19, TypeScript, Vite 7, TailwindCSS 4, React Router 7, React Query 5 and Recharts 3. It is installable as a PWA and talks to the `/api/admin` routes of the Solvia API over same-origin URLs.

---

## Features

- **Platform sign-in** with a platform admin account. These accounts are separate from business users: a business account can't sign in here, and platform tokens are rejected by the business API. In development builds the login page shows the demo credentials.
- **Overview (`/`):** KPIs (businesses, active and suspended, users, customers, receivables, outstanding balance, collected in the last 30 days, new this month) and a **pending access requests** KPI that links to the inbox. It also has charts for the plan mix, 12-month sign-ups, 6-month collections and the top businesses by outstanding balance.
- **Businesses (`/tenants`):** search by business name or any user's email, filter by plan and status, sort, paginate. **"Nueva empresa"** creates a business and its first admin, generates a temporary password and shows it once, with copy and "send via WhatsApp" buttons.
- **Business detail (`/tenants/:id`):** usage metrics, a plan change, suspend and reactivate (with confirmation), and **user management**: add a user with a temporary password, rename, change role, deactivate or reactivate, and reset the password. The API blocks removing a business's last active admin.
- **Solicitudes (`/requests`):** the inbox of "Solicitar acceso" submissions from the landing page. You can filter by status (`pending`, `converted`, `dismissed`) and search by business, contact, email or phone. Each request has these actions:
  - **Convert:** opens "Nueva empresa" prefilled from the request, including the plan. The plan is the first `free`, `starter` or `pro` found in the message (the landing adds `Plan de interés: …`), and `free` otherwise. Creating the business marks the request as `converted`.
  - Open the business it was converted into.
  - Contact the requester via WhatsApp or email.
  - Dismiss the request, or restore a dismissed one.
- **"Open the app"** link to the business web app (`VITE_APP_URL`).
- Spanish (default) and English, a light, dark or system theme, and a responsive layout.

## Requirements

- **Node.js 22** and npm.
- A running **Solvia API** (by default on `http://localhost:4000`) with a platform admin account. The API's seed creates `admin@solvia.app` / `Password123!` unless `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` are set.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5175
```

The dev server listens on port **5175** (`host: true`) and proxies `/api` to `VITE_PROXY_TARGET`.

## Environment variables

Vite inlines `VITE_*` values **at build time**.

| Variable            | Default                 | Read by                            | Description                                                                                                                                                      |
| ------------------- | ----------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`      | `/api`                  | `src/ui/lib/http.ts`               | Base URL of the Solvia API. Keep `/api` to use the dev proxy or nginx                                                                                            |
| `VITE_PROXY_TARGET` | `http://localhost:4000` | `vite.config.ts` (dev server only) | Where the dev server proxies `/api`                                                                                                                              |
| `VITE_CURRENCY`     | `PEN`                   | `src/ui/i18n/I18nProvider.tsx`     | ISO 4217 currency used to format amounts                                                                                                                         |
| `VITE_APP_URL`      | `http://localhost:5173` | `src/lib/config.ts`                | URL of the business web app. It is used for the "Open the app" link and for the sign-in URL (`${VITE_APP_URL}/login`) in the temporary-password WhatsApp message |

`import.meta.env.DEV` decides whether the demo credentials appear on the login page. They never appear in production builds.

## Scripts

| Script                                    | What it does                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`                             | Vite dev server with HMR on port 5175 (PWA enabled in development too)      |
| `npm run build`                           | Type-check (`tsc -b`) and build to `dist/`                                  |
| `npm run preview`                         | Serve the production build locally (reuses the dev proxy)                   |
| `npm run typecheck`                       | `tsc -b --noEmit` (also checks that `en.ts` matches `es.ts`)                |
| `npm run lint` / `npm run lint:fix`       | ESLint (`eslint.config.js`)                                                 |
| `npm run format` / `npm run format:check` | Prettier (`.prettierrc`)                                                    |
| `npm run icons`                           | Regenerate the PWA icons from `public/favicon.svg` (`pwa-assets-generator`) |

## Project structure

```
.
├── index.html               Theme pre-paint script, beforeinstallprompt capture, icon links
├── vite.config.ts           React, Tailwind, PWA, @ alias, dev proxy (/api), vendor chunks
├── pwa-assets.config.ts     Icon generation (npm run icons)
├── Dockerfile               Multi-stage build: Node 22 → nginx 1.27
├── nginx.conf.template      SPA fallback + proxy of /api and /files to ${API_UPSTREAM}
├── public/                  favicon.svg and the generated PWA icons
└── src/
    ├── main.tsx             ThemeProvider → I18nProvider → QueryClientProvider → BrowserRouter
    │                        → AuthProvider → FeedbackProvider → App + PwaManager
    ├── App.tsx              /login · RequireAuth → AdminShell (/, /tenants, /tenants/:id, /requests, 404)
    ├── ui/                  This project's copy of the Solvia UI kit, imported as '@/ui'
    ├── auth/                AuthContext (platform session), RequireAuth
    ├── lib/                 api.ts (token store "solvia.admin" + API client), config.ts, types.ts
    ├── hooks/queries.ts     useMe, useOverview, useTenants, useTenant, useUpdateTenant, useCreateTenant,
    │                        useTenantUserActions, useAccessRequests, useUpdateAccessRequest
    ├── i18n/                I18nProvider and typed useI18n; messages/es.ts (source of truth) and en.ts
    ├── components/          AdminShell (navigation), Badges, MonthlyBarChart, NewTenantModal, PwaManager
    └── pages/               LoginPage, OverviewPage, TenantsPage, TenantDetailPage, AccessRequestsPage
```

### The UI kit (`src/ui`)

`src/ui` holds the Solvia design system: components, brand, theme, i18n core, charts, the API client, `useUrlState`, the PWA helpers and `styles.css`. The team-management components (`TeamUsers`, `TemporaryPasswordDialog`) come from here too, the same ones the web app uses.

- Import it only as `'@/ui'`. The `@` alias maps to `src/` in `vite.config.ts` and `tsconfig.app.json`.
- It is a **copy** of the web app's kit; the two started out identical. There is no shared package, so a change that should apply to both apps has to be made in both projects.
  - The web app's phone field (`PhoneInput`, `phoneCountries`, with the `libphonenumber-js` and `country-flag-icons` dependencies) is **not** in this copy. The backoffice doesn't edit phone numbers.
  - This copy does have the `Popover` behavior (menus inside a modal render within the `<dialog>`) and the modal entrance animation with `backwards` fill.

## Talking to the Solvia API

- The client in `src/lib/api.ts` uses the `/admin/auth/*` session: tokens are stored under `solvia.admin.*` (so they never mix with a business session in the same browser) and are refreshed through `/admin/auth/refresh`.
- **Development:** the Vite dev server proxies `/api` to `VITE_PROXY_TARGET` (default `http://localhost:4000`).
- **Docker / production:** nginx proxies `/api/` (and `/files/`) to `API_UPSTREAM` (default `http://backend:4000`). Use the API origin without a path, because nginx keeps the `/api/...` path.
- Endpoints used: `/admin/auth/login|refresh|me`, `/admin/overview`, `/admin/tenants` (GET, POST), `/admin/tenants/:id` (GET, PATCH), `/admin/tenants/:id/users` (POST), `/admin/tenants/:id/users/:userId` (PATCH), `/admin/tenants/:id/users/:userId/reset-password` (POST), `/admin/access-requests` (GET) and `/admin/access-requests/:id` (PATCH).

## Docker

| Build arg          | Default                 | Used by this app                                        |
| ------------------ | ----------------------- | ------------------------------------------------------- |
| `VITE_API_URL`     | `/api`                  | yes                                                     |
| `VITE_CURRENCY`    | `PEN`                   | yes                                                     |
| `VITE_APP_URL`     | `http://localhost:8080` | yes ("Open the app", sign-in link in WhatsApp messages) |
| `VITE_LANDING_URL` | `http://localhost:8081` | no (declared for parity with the other frontends)       |

| Runtime env    | Default               | Description                               |
| -------------- | --------------------- | ----------------------------------------- |
| `API_UPSTREAM` | `http://backend:4000` | Where nginx proxies `/api/` and `/files/` |

```bash
docker build -t solvia-admin --build-arg VITE_APP_URL=https://app.solvia.example.com .
docker run --rm -p 8082:80 -e API_UPSTREAM=http://host.docker.internal:4000 solvia-admin
# → http://localhost:8082
```

nginx serves `sw.js` and `manifest.webmanifest` without caching, caches `/assets/` for a year and falls back to `index.html`. `.dockerignore` excludes `.env`.

In production, keep the backoffice reachable only by staff (VPN, IP allowlist or an identity-aware proxy), in addition to its own login.

## PWA (installable app)

- The manifest is "Solvia Admin" (`display: standalone`). Workbox precaches the build, and `/api/` and `/files/` are excluded from the navigation fallback.
- `devOptions.enabled` turns the service worker on in `npm run dev` too, which generates `dev-dist/` (gitignored).
- `registerType: 'prompt'`: `PwaManager` checks for updates every hour and shows an update card.
- The login page has an install chip, and the account menu has "Install as an app".
- **Icons:** edit `public/favicon.svg`, then run `npm run icons` and commit the generated files.

## i18n and theming

- Spanish (default) and English: `src/i18n/messages/es.ts` (source of truth) and `en.ts` (typed from it). Kit strings and API error codes are in `src/ui/i18n/messages.ts`.
- Light, dark or system theme (`solvia.theme`, applied as `data-theme` before React loads). Design tokens are in `src/ui/styles.css`.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests: Node 22, `npm ci`, `npm run lint`, `npm run format:check` and `npm run build`, which also type-checks with `tsc -b`. Run the same commands locally before pushing.

## Running it with the whole platform

The `solvia-backend` repository has the Docker Compose files for the full system. Clone the four repositories (`solvia-backend`, `solvia-app`, `solvia-admin`, `solvia-landing`) side by side, then run this from `solvia-backend`:

```bash
docker compose -f docker-compose.yml -f docker-compose.full.yml up -d --build
```

That builds this repository's image from `${SOLVIA_REPOS_DIR:-..}/<repo>`, with the same build args and `API_UPSTREAM=http://backend:4000`. To run only the API and database for local development, use `docker compose up -d --build` in `solvia-backend` and `npm run dev` here.

## Related projects

- **`solvia-backend`** (Solvia API): serves the `/api/admin/*` platform routes this app uses. They have their own tokens (audience `solvia-platform`) and are separate from the business routes.
- **`solvia-app`** (web app): the app businesses use every day. The businesses and users created here sign in there, and are forced to change their temporary password on first sign-in.
- **`solvia-landing`** (landing page): the public site whose "Solicitar acceso" form fills this app's **Solicitudes** inbox.
