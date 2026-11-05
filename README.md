# BUGDATA Agentic OS

BUGDATA is a React/TypeScript application with an Express/tRPC development server and a Supabase Edge Function production API. The public source repository is [bugdata-agentic-os-app](https://github.com/bugdata-commits/bugdata-agentic-os-app).

## Architecture and hosting

The React frontend is built for GitHub Pages at `https://bugdata-commits.github.io/bugdata-agentic-os-app/`. Supabase project `bugdata-agentic-os` provides email/password identity, PostgreSQL persistence, and the production API at `https://maadakjelhkbqgkbwxsy.supabase.co/functions/v1/bugdata-api`. The Express/tRPC server is retained for local Manus Preview and development; production Pages must not depend on it or on a Preview URL.

The Supabase project URL and `sb_publishable_...` key in `shared/supabaseConfig.ts` are intentionally public values. The app sends the publishable key as `apikey` and the signed-in user's JWT as `Authorization`. The Edge Function checks the project key, validates the user token with Supabase Auth, and uses that same token for database calls, so Supabase RLS controls workspace access. Gateway JWT verification is disabled only because the function also exposes safe unauthenticated identity/health responses; every protected procedure still requires a valid signed-in Supabase user. Do not add a service-role/secret key to the frontend, source, workflow, or normal workspace-data path. The existing Manus MySQL tables are legacy and are not the active BUGDATA identity or business-data store.

Hermes is disabled in production until a user-owned OpenAI-compatible provider key is configured in Supabase Function secrets (`HERMES_API_KEY`; `HERMES_API_URL` is optional, and `HERMES_MODEL` defaults to `gpt-4o-mini`). The key never belongs in the public repository or browser bundle. Supabase Free inactivity pauses are an accepted risk; this does not promise always-on availability.

## Supabase Auth launch settings

Before opening account creation to the public, set the Supabase Auth Site URL and allowed redirect URL to `https://bugdata-commits.github.io/bugdata-agentic-os-app/`. The app requests email confirmation back to this exact Pages path. Configure a reliable production SMTP provider for confirmation messages; the default project email sender is for limited testing, not general production delivery.

## Local development

- `pnpm dev`: run the Express/Vite development application on `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm build:pages`: build the static GitHub Pages frontend under the repository base path.
- `pnpm check` / `pnpm test`: type-check and run application tests.
- Apply Supabase SQL changes from the checked-in `supabase/migrations/` directory to the intended project. The legacy `pnpm db:push` / Drizzle files target the old MySQL starter and must not be used to reset or modify the Supabase schema.

The production Edge Function verifies Supabase bearer tokens and forwards the authenticated user's token to Supabase. Initial workspace creation goes through the authenticated `bugdata_ensure_workspace_for_current_user(text)` RPC, allowing the existing RLS policy to add owner membership safely. CORS allows the public Pages origin and local development only. The function exposes a non-sensitive `/health` response; no API operation uses a service-role key.

## Supabase Edge Function references

- [Managing dependencies](https://supabase.com/docs/guides/functions/dependencies) recommends a function-local `deno.json` for npm/Deno dependency configuration.
- [CORS support](https://supabase.com/docs/guides/functions/cors) documents the SDK-maintained CORS header list; the function adds its tRPC request header and restricts allowed origins.
- [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) explains the distinction between a publishable application key and a signed-in user's JWT. This function performs user verification itself before protected procedures.
