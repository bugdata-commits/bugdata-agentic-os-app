# BUGDATA launch runbook

## Current production architecture

- **Authentication:** Supabase Auth with email/password sessions.
- **Application API:** Express + tRPC, validating Supabase bearer tokens on every protected request.
- **Business data:** Supabase PostgreSQL with workspace ownership and Row Level Security.
- **Frontend hosting:** GitHub Pages serves the Vite React build at `/bugdata-agentic-os-app/`.
- **Backend connection:** the frontend reads `BUGDATA_API_URL` from the public runtime config and sends tRPC requests to `${BUGDATA_API_URL}/api/trpc`.
- **CORS:** Express allows `https://bugdata-commits.github.io` plus comma-separated `FRONTEND_ORIGINS` values.
- **AI:** Hermes remains server-side and approval-gated.

## Required runtime configuration

Set these values in the production application runtime. Never put a service-role key in browser configuration.

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<publishable-or-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
BUGDATA_API_URL=https://api.example.com
FRONTEND_ORIGINS=https://bugdata-commits.github.io
MANUS_API_URL=<configured-platform-ai-url>
MANUS_API_KEY=<server-only-platform-ai-key>
```

`SUPABASE_SERVICE_ROLE_KEY` is optional for the current RLS-scoped request path, but is recommended for trusted background jobs. Normal user requests use the authenticated user's bearer token and RLS. `SUPABASE_ANON_KEY` is the only Supabase key that may be sent to the browser.

## Supabase Auth settings

Before launch, configure the production site URL and redirect URLs in Supabase Auth. Enable email/password sign-in, decide whether email confirmation is required, and configure SMTP before inviting real users. Add the production origin and the preview origin separately; do not use a wildcard redirect in production.

## Database state

The live project is `bugdata-agentic-os` (`maadakjelhkbqgkbwxsy`). Applied migrations are:

1. `create_agentic_os_growth_schema`
2. `harden_workspace_membership_rls`
3. `add_workspace_activity_and_approval_records`
4. `apply_safe_security_and_index_hardening`
5. `isolate_rls_helpers_in_private_schema`

Every application table has RLS enabled. New users receive a workspace on first authenticated access, and the database trigger adds the owner membership automatically.

Funnels are now connected to the live data path: authenticated users can list their own funnels, create a draft with ordered starter steps, and see the activity entry in Supabase. Funnel publishing, custom page editing, domains, and live conversion event collection remain intentionally gated until those providers and workers are configured.

## Pre-launch verification

1. `GET /api/health` returns HTTP 200 and `checks.supabaseAuth: true`.
2. Create a test account, confirm the email if enabled, and sign in.
3. Confirm a workspace is created once and not duplicated on refresh.
4. Add a contact, reload, and verify it persists.
5. Move the contact through pipeline stages and verify activity history.
6. Ask Hermes for a draft, create an approval, and approve/reject it.
7. Create a funnel draft, refresh, and verify its ordered steps persist.
8. Test a second account and confirm it cannot see the first account's workspace or funnels.
9. Configure email delivery, payment processing, calendar, and background automation providers before advertising those features as live.

## Still intentionally gated

The UI for campaigns, payments, courses, bookings, affiliates, and automation is ready, but external email sending, payments, course delivery, bookings, affiliate payouts, and background workflow execution require their provider credentials and execution workers. Do not label those features live until their end-to-end tests pass.
