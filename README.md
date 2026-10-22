# BUGDATA Agentic OS

React / Express / tRPC / Drizzle application adapted from the Manus `web-db-user` template.

## View the product

- **Public GitHub Pages showcase:** https://bugdata-commits.github.io/bugdata-agentic-os-app/
- **Source repository:** https://github.com/bugdata-commits/bugdata-agentic-os-app
- **Interactive app:** the Manus-hosted web project and Preview.

The GitHub Pages site is a static visual showcase with fictional sample data. It does not provide sign-in, saved CRM records, Hermes AI calls, approval execution, or external integrations. GitHub Pages cannot run this Express server or the managed database. The interactive application continues to use the Manus backend, Manus sign-in, managed MySQL, and built-in AI service.

## Local development

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply schema changes.
- `pnpm check` / `pnpm test`: type-check and run application tests.

Platform login, storage, payments, and service contracts are documented in the Webdev skill's shared references. `server/_core/publicConfig.ts` exposes only named public runtime values; private keys stay server-side. The platform serves managed `/manus-storage/` assets.

## Data and deployment

The application uses protected server procedures and additive Drizzle migrations against the managed MySQL database. Development and production share that database, so schema work must be additive and data-safe. GitHub Pages publishes only `docs/`; the canonical interactive project and backend remain on Manus.
