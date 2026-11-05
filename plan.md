# BUGDATA Agentic OS — Implementation Plan

## Objective and first delivery

Build BUGDATA Agentic OS as a real managed web application, starting with a polished, usable command-center MVP: business overview, lead CRM, Hermes as an orchestration interface whose production AI remains gated until a user-owned provider is configured, agent roster, human approval queue, workflow and activity surfaces. Provide the broader requested product modules (funnels, marketing, analytics, monetization, and integrations) as intentional, navigable product surfaces so the first release has a coherent OS structure. Clearly distinguish what works in this delivery from areas that still need provider setup or deeper implementation. Do not represent inactive integrations or billing as connected or live.

The scope comes from the complete product brief: website/funnel builder; CRM; marketing; sales agents; agent orchestration, task state and approvals; digital products and monetization; agents Kyla, Hermes, Marketing, Funnel and Analytics; a dashboard/business core/agent/integration architecture; and the stated MVP roadmap, with later commerce, memberships, affiliate, advanced marketing and white-label capabilities.

## Public source and GitHub Pages boundary

The public GitHub repository is the visible source. GitHub Pages serves the real React frontend from `docs/`; it is static hosting and calls the Supabase Edge Function API over HTTPS. Supabase project `bugdata-agentic-os` provides Auth, durable PostgreSQL, and the production API. The app must not use the other Supabase project referenced by an old Pages artifact.

The frontend signs users in with Supabase Auth. The `bugdata-api` Edge Function validates each user's access token with Supabase Auth and makes PostgREST calls using that same token and the public publishable key, so database Row Level Security remains the tenant boundary. Keep the Edge Gateway's `verify_jwt` off only because the function also exposes safe health and identity responses; inside the handler, match the project `apikey` and call Supabase Auth `getUser` before any protected tRPC operation. The publishable key identifies the application but never substitutes for a user session. Do not use Manus OAuth or a Supabase service-role key for app requests. First-workspace onboarding must call the existing authenticated `bugdata_ensure_workspace_for_current_user(text)` function; direct first-owner inserts are blocked by the current RLS policy.

Keep Express/tRPC only for local Manus Preview and development. Production Pages calls `https://maadakjelhkbqgkbwxsy.supabase.co/functions/v1/bugdata-api/api/trpc`; configure CORS for `https://bugdata-commits.github.io` and send both the public publishable key as `apikey` and the signed-in user's access token as `Authorization`. The Pages build contains only the Supabase project URL, its public publishable key, and the API origin; never ship a Manus API or ephemeral Preview URL. Hermes is disabled in production until a user-owned OpenAI-compatible provider key is configured in Supabase Function secrets. The API must report that state clearly and never claim a draft was produced when no provider is configured. The production Site URL and exact confirmation redirect URL must match the Pages origin and repository path. Supabase Free may pause after inactivity; this is accepted, not an always-on guarantee.

Keep `origin/main` as the canonical Manus checkpoint branch and `github/main` as the public source/Pages branch; synchronize intended changes to both without rewriting history.

## Technical approach

- Reuse the initialized React 19 + TypeScript + Vite/Tailwind frontend and Express/tRPC backend in `client/`, `server/` and `shared/`; preserve the existing MySQL tables and data without using them for active BUGDATA sign-in or business records.
- Build a responsive, multi-section workspace with Wouter navigation and Lucide icons. Prioritize a dashboard, contacts/CRM, agent control, workflows, approvals, marketing, funnels, analytics and commerce in the navigation. Keep the main interactions visible and usable on narrow screens.
- Use a distinctive control-room visual language rather than a generic SaaS template: asymmetric workspace, dark ink sidebar, warm paper work surface, signal-green action color, crisp status chips, thin rules, compact metrics and occasional oversized typographic section labels.
- Use Supabase Auth instead of Manus OAuth, and use the existing Supabase PostgreSQL tables for workspaces, contacts, funnels, approvals and activities. Send the signed-in user's access token to each server procedure and rely on RLS. Check in the workspace-onboarding migration; never drop or reset data.
- Implement Hermes on the Edge Function using a user-owned OpenAI-compatible provider configured through Supabase Function secrets (`HERMES_API_KEY`, optional `HERMES_API_URL`). Never bundle the credential. Until it is set, return a clear not-configured response and show Hermes as requiring setup. Hermes may summarize and draft plans; consequential actions require explicit human approval and are not executed automatically. Handle service errors/empty output honestly.
- Add realistic initial product state only in code/demo fixtures or a one-time seed that preserves existing edits. Do not imply that seeded contacts are real customers or that integrations/payments have been connected.
- Keep the GitHub Pages app on the `bugdata-commits.github.io/bugdata-agentic-os-app/` base path, send signup confirmations back to that exact app path, and allow its origin through the Edge Function CORS policy. Build Pages with the correct BUGDATA Supabase URL and publishable key and the stable Edge Function URL, never values from another project, the retired Manus API, or a temporary Preview host.
- Before the first application-code edit, TypeScript diagnostics must be registered and confirmed. This project already reports host-managed TypeScript diagnostics as registered.
- Define the static page route manifest before starting the development server. Start the supplied `pnpm dev` service on its configured port 3000, verify the HTTP health endpoint and route manifest, and use the live Preview for the user's inspection.
- Keep working code, Supabase migrations, and tests in the project; validate through managed diagnostics and `pnpm check`, `pnpm test`, and build paths. Save a Manus checkpoint on canonical `origin/main` before deploying the Edge Function. Do not enable auto-publication or claim production publication unless confirmed.

## Product and interaction decisions

- **Dashboard:** a live-feeling operator home with business pulse, leads, pipeline and agent activity, open approvals, and the next recommended action.
- **CRM:** searchable/filterable contact list and a meaningful lead detail/creation path, with pipeline status, source and follow-up state.
- **Hermes:** command composer plus conversation; ask, summarize and draft actions. Show scope and required approval before any consequential action.
- **Agent control:** clear roles, capabilities and operational status for Kyla, Hermes, Marketing, Funnel and Analytics; avoid suggesting autonomy beyond enabled capabilities.
- **Approvals/workflows:** visible pending/approved/rejected states and a workflow catalogue with explicit triggers and actions.
- **Expansion areas:** differentiated surfaces for funnels/sites, campaigns, analytics and offers/monetization; label unavailable integrations/checkout as not connected until actually configured.

## Project structure

- `client/src/App.tsx`: product shell and route map.
- `client/src/pages/`: dashboard and product module screens.
- `client/src/components/`: shared navigation, command bar, status, table and dashboard components.
- `client/src/index.css`: global design tokens, typography and responsive refinements.
- `server/routers.ts`: local Preview tRPC procedure composition and authorization boundaries.
- `server/`: local Preview Express server, Supabase domain queries and HTTP routes.
- `supabase/functions/bugdata-api/`: production tRPC Fetch adapter, user-token verification, RLS-scoped Supabase operations, CORS, health status, and the optional server-side Hermes provider call.
- `supabase/migrations/`: checked-in Supabase database setup, including the authenticated first-workspace bootstrap function; `drizzle/` remains legacy and is not dropped.
- `shared/`: data contracts/constants shared across client and server.
- `client/public/manus-routes.json`: static Pages route manifest; Express Preview also exposes the same complete routes at `/manus-routes.json`.
- `plan.md` and `TODO.md`: design/build decisions and feature delivery state.

## Design direction

Three intentionally uncommon style directions considered (probabilities are low-tail samples, each below 0.10):

- **Analog mission-control / field operations — 0.06:** Warm paper, deep ink, precise instrument typography, green live-state markers; chosen for confident, legible business operations.
- **Prismatic neon laboratory — 0.08:** Dark glass panels and iridescent gradients signal experimental AI, but weaken everyday CRM legibility.
- **Soft organic atelier — 0.05:** Muted clay and flowing forms suggest approachable creativity, but underplay orchestration and operational rigor.

### Chosen style: Analog mission-control / field operations

- **Design movement:** Swiss editorial systems blended with analog industrial instrumentation.
- **Core principles:** high signal-to-noise; every state is legible; functional density without visual clutter; automation remains inspectable.
- **Color philosophy:** warm ivory reads like a working logbook, dark ink provides authority, and acidic leaf green means “live/approved/ready.” Cobalt is reserved for links and secondary intelligence; amber marks review; coral marks risk.
- **Layout paradigm:** persistent narrow left navigation, compact top command rail, offset main canvas with large asymmetric content panels and a slim right-side activity/approval rail on wide screens; mobile collapses rails into overlays and stacked regions.
- **Signature elements:** hairline rule dividers; numbered section labels in monospaced caps; tiny agent-state LEDs and pill-shaped approval stamps.
- **Interaction philosophy:** keep actions explicit and reversible; show preview/approval before execution; use row expansion and contextual drawers instead of unnecessary page hops.
- **Animation:** restrained 140–220 ms transitions, subtle indicator pulse only for genuinely live/pending state, reduced-motion support, no ambient motion.
- **Typography system:** Manrope or a clean system sans for interface and headings, paired with IBM Plex Mono/system monospace for IDs, timestamps and labels; establish strong contrast between large editorial title and compact data labels.
- **Brand essence:** the accountable command center for owner-led teams, distinct because coordinated AI agents operate through shared business context and approval gates; **decisive, capable, transparent**.
- **Brand voice:** specific, calm, active. Example lines: “Your pipeline is moving. Two decisions need you.” “Hermes drafted the follow-up. Review it before it goes out.”
- **Wordmark & logo:** custom “B” formed from two offset routing chevrons inside an open square, paired with BUGDATA in a wide-tracked wordmark.
- **Signature brand color:** **Signal Leaf `#B9F342`**, reserved for active system states and the primary command action.

## Build phases

1. **Command center foundation:** responsive app frame, dashboard, seeded workspace view, agent status, approval attention and activity.
2. **Working agentic loop:** Hermes real-model conversation, tool-safe action proposals, approval state transitions and clear error handling.
3. **Business operations:** searchable CRM interactions, lead/status management, activity continuity and workflows.
4. **Expansion surfaces:** distinct funnels, campaigns, analytics, offers/monetization and integrations views; ship functioning behavior where practical and clearly mark what needs setup or later work.
5. **Persistence and release:** maintain user-edited state, additive database integration/migration if appropriate, diagnostics, route/health checks, checkpoint.

This plan describes a first substantial product release, not a claim that every roadmap module has a connected production integration or fully autonomous capability. Keep unresolved outcomes visible in `TODO.md`.
