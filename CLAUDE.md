# solvia-admin

Solvia platform backoffice for the Solvia team: platform overview (KPIs, sign-ups, collections,
plans), businesses (create, change plan, suspend/reactivate, manage their users), and the access
requests inbox coming from the landing page. React 19 + TypeScript + Vite 7 + Tailwind v4 + React
Router 7 + TanStack Query 5 + Recharts. Installable as an app (PWA).

It depends only on the **solvia-backend** API, **platform realm** (`/api/admin/*`, platform tokens
stored under `solvia.admin.*` — never the business session). Related repositories:
`solvia-landing` (produces the access requests), `solvia-app` (where the businesses and users
created here sign in; linked with `VITE_APP_URL`). See `../CLAUDE.md` if present.

## Commands

```bash
npm run dev          # http://localhost:5175 (proxies /api to VITE_PROXY_TARGET, default :4000)
npm run lint         # ESLint              npm run format  # Prettier
npm run typecheck    # tsc -b --noEmit     npm run build   # tsc + vite build (+ service worker)
npm run preview      # serve the build     npm run icons   # regenerate PWA icons
```

The API must be running (`solvia-backend`). CI runs `npm ci`, lint, format:check, build. Demo
login: `admin@solvia.app` / `Password123!`.

## Structure

- `src/ui/` — this app's copy of the Solvia UI kit, imported as `@/ui` (same kit as solvia-app,
  minus the phone field). When you fix a kit file, apply the same change in the other repos.
- `src/pages/` — LoginPage, OverviewPage, TenantsPage, TenantDetailPage (plan, status, users via
  the kit's `TeamUsers`), AccessRequestsPage (convert to business, dismiss, WhatsApp/email).
- `src/components/` — AdminShell (sidebar, topbar, bottom nav), NewTenantModal (creates a business
  and its first admin, optionally from a request; shows the temporary password once),
  MonthlyBarChart, Badges, PwaManager.
- `src/hooks/queries.ts` — API hooks; `src/lib/types.ts` — **must mirror** the `/api/admin`
  responses; `src/lib/api.ts` — client with platform refresh (`/admin/auth/refresh`).

## Rules

- UI text through i18n (`src/i18n/messages/es.ts` source of truth, `en.ts` mirrors it).
- Semantic color tokens only; tables with `<Page fill>` + `<DataTable>`; `<Modal>` for dialogs;
  `useFeedback()` for toasts/confirmations (destructive actions always confirm).
- Backend contract changes → update `src/lib/types.ts` and hooks; new error codes → texts in
  `src/ui/i18n/messages.ts`.
- Before committing: `npm run lint && npm run build`, and check it in the browser.
