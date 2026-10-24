# BUGDATA launch runbook

## Current production architecture

- **Authentication:** Supabase Auth with email/password sessions.
- **Application API:** Express + tRPC, validating Supabase bearer tokens on every protected request.
- **Business data:** Supabase PostgreSQL with workspace ownership and Row Level Security.
- **Frontend hosting:** the managed application runtime; GitHub Pages remains a static showcase only.
- **AI:** Hermes remains server-side and approval-gated.

## Required runtime configuration

Set these values in the production application runtime. Never put a service-role key in browser configuration.

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<publishable-or-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
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

Every application table has RLS enabled. New users receive a workspace on first authenticated access, and the database trigger adds the owner membership automatically.

## Pre-launch verification

1. `GET /api/health` returns HTTP 200 and `checks.supabaseAuth: true`.
2. Create a test account, confirm the email if enabled, and sign in.
3. Confirm a workspace is created once and not duplicated on refresh.
4. Add a contact, reload, and verify it persists.
5. Move the contact through pipeline stages and verify activity history.
6. Ask Hermes for a draft, create an approval, and approve/reject it.
7. Test a second account and confirm it cannot see the first account's workspace.
8. Configure email delivery, payment processing, calendar, and background automation providers before advertising those features as live.

## Still intentionally gated

The UI for campaigns, payments, courses, bookings, affiliates, and automation is ready, but external email sending, payments, course delivery, bookings, affiliate payouts, and background workflow execution require their provider credentials and execution workers. Do not label those features live until their end-to-end tests pass.
