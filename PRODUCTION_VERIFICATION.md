# Production verification snapshot

**Observed:** 2026-11-05 (UTC). This snapshot records externally observable Supabase and GitHub Pages deployment facts; re-check before relying on them for a later release.

## Supabase production API

The active project is `maadakjelhkbqgkbwxsy` (`bugdata-agentic-os`), and its `bugdata-api` Edge Function is `ACTIVE`, deployed version `2`. The public function endpoint is <https://maadakjelhkbqgkbwxsy.supabase.co/functions/v1/bugdata-api>.

The function gateway has `verify_jwt=false` so public health and identity procedures can respond. The function itself validates Supabase Auth bearer tokens before protected operations; normal database requests use the same caller token and the project publishable key so RLS remains in force. No service-role key is used for workspace operations.

| Live request | Observed result |
| --- | --- |
| `GET /health` | HTTP 200; `status: ok`; Supabase is configured; Hermes is not configured. |
| `OPTIONS /api/trpc/workspace.snapshot` from `https://bugdata-commits.github.io` | HTTP 204 with an empty body; CORS allows the Pages origin and `apikey`, `authorization`, and `trpc-accept`. |
| `GET /api/trpc/auth.me` with only the public project key | HTTP 200 with a `null` user. |
| `GET /api/trpc/workspace.snapshot` with only the public project key | HTTP 401 (`UNAUTHORIZED`); no workspace data is returned. |

RLS is enabled on all seven live business tables: workspaces, workspace members, contacts, funnels, funnel steps, agent approvals, and workspace activity. Their policies use the caller's membership/owner relationship. The private membership and role helpers now have an empty search path, deny `anon`, and return `false`/`NULL` when given a user ID other than `auth.uid()`; the live database check confirmed those results. The applied source migration is `20261105000000_guard_rls_helpers_to_current_user.sql`.

### Supabase security-advisor warning

The security advisor reports one warning, `authenticated_security_definer_function_executable`, for the public `bugdata_ensure_workspace_for_current_user(text)` onboarding RPC. Its authenticated execution is intentional: signup needs this function to create or return the caller's first workspace under existing RLS. The live definition checks `auth.uid()`, uses `SET search_path = ''` and schema-qualified objects, and grants execution to `authenticated` while denying `anon`/`PUBLIC`; it does not accept a caller-supplied owner ID. The current warning is therefore documented rather than disabled. See Supabase's [remediation guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Hermes remains gated. The live health response reports it unconfigured; AI requests stay disabled until a user-owned OpenAI-compatible key is added to Supabase Function secrets. `HERMES_API_URL` and `HERMES_MODEL` are optional provider settings.

## GitHub Pages

The live site is <https://bugdata-commits.github.io/bugdata-agentic-os-app/>. The Pages workflow run [42098217396](https://github.com/bugdata-commits/bugdata-agentic-os-app/actions/runs/42098217396) completed successfully for commit `56eab130205637f1c358a1f4c46d837514971c40`.

The live runtime configuration at <https://bugdata-commits.github.io/bugdata-agentic-os-app/api/platform/config.js?v=api-2> points to the Supabase function URL above and omits legacy Manus OAuth/browser credentials. The served route manifest at <https://bugdata-commits.github.io/bugdata-agentic-os-app/manus-routes.json> declares 15 application routes. The live HTML/runtime config did not contain the retired Manus API or Preview host.

## Source URLs

- [Edge Function health endpoint](https://maadakjelhkbqgkbwxsy.supabase.co/functions/v1/bugdata-api/health)
- [Live Pages runtime configuration](https://bugdata-commits.github.io/bugdata-agentic-os-app/api/platform/config.js?v=api-2)
- [Live Pages route manifest](https://bugdata-commits.github.io/bugdata-agentic-os-app/manus-routes.json)
- [Public GitHub repository commit](https://github.com/bugdata-commits/bugdata-agentic-os-app/commit/56eab130205637f1c358a1f4c46d837514971c40)
