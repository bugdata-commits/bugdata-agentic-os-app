# BUGDATA Agentic OS — Build outcomes

## Historical first-build record

These results describe the original Manus OAuth/MySQL implementation, not the current Supabase-native branch. Re-verify current behavior after the Supabase connection is completed.

- [x] Responsive BUGDATA control-room shell with private sign-in and navigable dashboard/module surfaces; the first-build sign-in layout was inspected on desktop and phone.
- [x] The initial version stored workspace, CRM leads, approvals and activity in additive Manus-managed MySQL tables, scoped by workspace. This is historical; current active business data is Supabase Postgres.
- [x] The initial protected Hermes endpoint called the built-in Manus AI service, rate-limited requests and drafted actions without claiming external execution.
- [x] The first version created, approved and rejected human-review records; an approval did not trigger external sending, purchasing or workflow execution.
- [x] TypeScript, production build, app health, route manifest and anonymous workspace access were checked for the first version; these checks must be rerun after current backend changes.

## 1. Business command center and workspace shell

- [ ] Deliver a responsive SaaS dashboard with an AI command interface, builders, analytics access and clear business activity.
- [ ] Present BUGDATA as an operating system for businesses: owners can state outcomes and delegate work to coordinated AI agents rather than manually operating disconnected tools.
- [ ] Include a business core capable of representing users, organizations/workspaces, contacts, offers, funnels, products, payments and permissions; do not imply unsupported modules are already production-ready.
- [ ] Show useful business performance, lead/pipeline movement, agent activity and the next owner decision in the main dashboard.

## 2. Agentic CRM and sales operations

- [ ] Manage lead/contact records, customer details, conversations, sales-pipeline stages and follow-ups in an agentic CRM.
- [ ] Provide lead capture and a navigable, usable sales pipeline.
- [ ] Include Kyla, the Sales Agent, for prospect conversations, qualification and high-ticket sales support; show when a human should take over.
- [ ] Provide one working sales-agent workflow in the MVP, with responsible permission boundaries and reviewable execution history.

## 3. Coordinated AI agents and Hermes command interface

- [ ] Include Hermes as the orchestration agent, able to coordinate business tasks and specialized agents rather than act as an isolated chatbot.
- [ ] Include a Marketing Agent for content, campaigns and audience growth; a Funnel Agent for websites and conversion funnels; and an Analytics Agent for business interpretation and recommended actions.
- [ ] Keep relevant agents, business records, tools, context/memory, task state, orchestration and execution history connected through a coherent agent layer.
- [ ] Let users ask for business outcomes using an AI command interface; show the response and proposed work honestly, without claiming an action ran when it did not.
- [ ] Gate consequential actions behind explicit human approval and show approval policy, action scope, status and execution history.

## 4. Workflow automation, permissions and approvals

- [ ] Coordinate agents, connect tools, trigger workflows, maintain task state and request human approvals.
- [ ] Provide visible workflows and approval states, including pending, approved and rejected outcomes.
- [ ] Use appropriate permissions for agents and humans; keep sensitive or consequential operations reviewable and auditable.

## 5. Website, funnels and lead capture

- [ ] Support creation of landing pages, websites, lead-capture forms and sales funnels from a prompt or brief.
- [ ] Include a Funnel Agent that can generate and improve websites and conversion funnels.
- [ ] Connect funnel/website capture to CRM leads; distinguish a designed surface from a deployed live customer website.

## 6. Autonomous marketing

- [ ] Support creating marketing campaigns, social content, email sequences and lead-generation strategies.
- [ ] Include the Marketing Agent for content creation, campaign work and audience growth.
- [ ] Require suitable human review before external campaigns or messages are sent; do not claim delivery without a connected provider and confirmed execution.

## 7. Products, payments and monetization

- [ ] Support monetizing services and digital products, including offers and payment/subscription concepts.
- [ ] The roadmap includes courses, memberships, services, digital products, subscriptions and affiliate programs; courses, memberships, affiliate management and advanced monetization can follow the core MVP.
- [ ] Do not claim that checkout, subscriptions or affiliate payments are live unless a provider is configured and the behavior has been implemented.

## 8. Integrations and product architecture

- [ ] Structure the product around a frontend/dashboard, business core, agent layer and integrations.
- [ ] Plan integration surfaces for email, WhatsApp, calendars, payment providers, webhooks and external services.
- [ ] Keep external service status explicit and never present an unconnected integration as active.
- [ ] Advanced marketing and white-label capabilities remain later roadmap scope unless delivered and verified.

## 9. Project integrity, data and delivery

- [ ] Preserve the initialized managed project and Supabase Auth conventions; keep development and published data safe.
- [ ] Use the user's Supabase project for persistent application behavior where implemented, with additive migrations only; leave existing Manus MySQL data untouched.
- [ ] Provide useful responsive behavior for the operating dashboard and its core interactions.
- [ ] Maintain an accurate route manifest; pass project diagnostics and applicable check/build/health checks.
- [ ] Save the implementation as a canonical Manus checkpoint before publishing; do not imply production publication unless successful publication is confirmed.
- [ ] Serve the React application from the public GitHub Pages URL `https://bugdata-commits.github.io/bugdata-agentic-os-app/`, with Supabase Auth/Postgres connected to `bugdata-agentic-os` and tRPC pointed to the stable published API origin. Do not ship the stale `carfinder` project URL or an ephemeral Manus Preview host.

## 10. Systeme.io-inspired frontend foundation

- [x] Add navigable frontend surfaces for funnels, campaigns and email, automations, products and payments, courses and memberships, bookings, affiliates, and analytics.
- [x] Add local design-mode interactions for funnel selection, campaign tabs, workflow toggles, progress views, booking availability, partner states, conversion charts, and guided create actions without pretending that external execution is live.
- [ ] Keep the existing CRM, Hermes, approvals, Supabase authentication, and human-review boundary intact while making growth modules visually consistent with the BUGDATA control-room design.
- [x] Connect funnel drafts, ordered funnel steps, workspace activity logging, and protected create/list procedures to Supabase with RLS.
- [ ] Connect campaigns, permissions, payments, email delivery, course access, booking records, affiliate payouts, analytics events, and workflow execution to Supabase/provider services.

## 11. Supabase-native identity and persistence

- [x] Create the Supabase project schema for workspaces, contacts, tags, funnels, funnel events, campaigns, campaign steps, campaign contacts, email events, approvals, and workspace activity.
- [x] Replace Manus OAuth/session authentication with Supabase Auth email/password sessions and server-verified bearer tokens.
- [x] Move the CRM, workspace snapshot, approvals, activity and funnel persistence path to UUID-backed Supabase Postgres records.
- [x] Bootstrap a signed-in user's first workspace through the authenticated `bugdata_ensure_workspace_for_current_user(text)` RPC so the user receives owner membership under RLS; do not attempt a direct first-workspace insert. The migration is applied and its execution grants were verified.
- [x] Keep tenant isolation enforced by Supabase RLS and authenticated user-token requests; never use a service-role key for normal app requests.
- [x] Configure the Supabase production Site URL and allowed confirmation redirect URL for the exact GitHub Pages app path; the user confirmed these settings are saved.
- [ ] Configure reliable SMTP before opening signup to the public.

## 12. Stable live backend connection

- [ ] Configure every frontend/backend runtime to use the user's `bugdata-agentic-os` Supabase project URL and its public publishable key; the URL must be the project root, not `/rest/v1/`, and no value from another Supabase project may remain in the deployed Pages artifact.
- [x] Verify the local Express API (Preview/development only) checks Supabase Auth tokens and uses each user's bearer token with the publishable key for database access, preserving RLS; never embed or use a Supabase service-role/secret key. Automated tests cover valid, missing and invalid bearer tokens.
- [ ] Deploy the production tRPC API as the Supabase Edge Function `bugdata-api` at `https://maadakjelhkbqgkbwxsy.supabase.co/functions/v1/bugdata-api`; preserve `system.health`, the active workspace snapshot and funnels, lead create/status, approval create/decision, and Hermes procedures. Keep Express/tRPC available only for local Preview/development.
- [ ] Keep each business-data procedure private to the signed-in Supabase user. Validate the caller's Supabase Auth access token inside the Edge Function; pass the same caller token and the public publishable key to Supabase queries so existing RLS remains enforced. Never use a service-role/secret key for normal workspace operations. Only non-sensitive health/identity responses may be unauthenticated.
- [ ] Set the GitHub Pages production API base to the Supabase Function URL, send the project publishable key as `apikey` and the user's access token as `Authorization`, and allow `https://bugdata-commits.github.io` through the API CORS policy. Remove the retired Manus API and all Preview-only URLs from the published build.
- [ ] Ensure the Pages app is built for `/bugdata-agentic-os-app/` and Supabase email confirmation returns to that path; expose a non-sensitive API health response and ensure anonymous requests cannot read or mutate workspace data.
- [ ] Keep Hermes disabled until a user-owned OpenAI-compatible provider key is configured in Supabase Function secrets; accept optional `HERMES_API_URL` and `HERMES_MODEL` provider settings (default model `gpt-4o-mini`); keep the key out of source and browser output, and clearly report when Hermes is not configured.
- [x] Use Supabase Free with the user's accepted inactivity-pause risk; explain that inactivity may pause the database/API and that this is not an always-on guarantee. Production business data/API no longer depends on Manus server hosting; Hermes availability additionally depends on a user-owned AI provider key and service.
- [ ] Save a canonical Manus checkpoint and synchronize the intended commit to the public GitHub `main`; confirm the API publication and Pages build before describing the live app as working.
