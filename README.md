# BUGDATA Agentic OS

React / Express / tRPC / Drizzle application adapted from the Manus `web-db-user` template.

## View the product

- **Public GitHub Pages showcase:** https://bugdata-commits.github.io/bugdata-agentic-os-app/
- **Source repository:** https://github.com/bugdata-commits/bugdata-agentic-os-app
- **Interactive app:** the Manus-hosted web project and Preview.

GitHub Pages serves the real React frontend built from `client/` under the repository base path. Supabase Auth and browser-safe Supabase configuration are available there; server-only Hermes procedures, privileged jobs, webhooks, and external integrations still require a separate server-capable deployment.

## Local development

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply schema changes.
- `pnpm check` / `pnpm test`: type-check and run application tests.

Platform login, storage, payments, and service contracts are documented in the Webdev skill's shared references. `server/_core/publicConfig.ts` exposes only named public runtime values; private keys stay server-side. The platform serves managed `/manus-storage/` assets.

## Data and deployment

The application uses Supabase Auth and RLS-scoped Supabase data access for the production frontend. GitHub Pages publishes the committed `docs/` Vite artifact, while the Express/tRPC server remains available for server-only capabilities.
