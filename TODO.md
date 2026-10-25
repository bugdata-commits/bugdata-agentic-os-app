# BUGDATA Agentic OS — Build outcomes

## Verified in this first build

- [x] Responsive BUGDATA control-room shell with real Manus sign-in, private workspace identity, and navigable dashboard/module surfaces; phone and desktop sign-in layouts were inspected.
- [x] User-owned workspace, CRM leads, approval records, and activity stored in additive MySQL tables; each authenticated user’s records are scoped through their workspace.
- [x] Protected Hermes command endpoint calls the built-in platform AI service from the server, rate-limits requests, and describes drafts without claiming to execute outside actions.
- [x] Human review records can be created, approved, or rejected; recorded approval does not trigger external sending, purchasing, or workflow execution.
- [x] TypeScript, production build, app health endpoint, public route manifest, and unauthenticated workspace access control were checked successfully.

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

- [ ] Preserve the initialized managed project and existing starter/authentication conventions; keep development and published data safe.
- [ ] Use the project’s server/database capabilities for persistent application behavior where implemented, with additive migrations only.
- [ ] Provide useful responsive behavior for the operating dashboard and its core interactions.
- [ ] Maintain an accurate route manifest; pass project diagnostics and applicable check/build/health checks.
- [ ] Save the implementation as a canonical Manus checkpoint; do not imply production publication unless successful publication is confirmed.
- [x] Make the app source public and enable GitHub Pages for a clearly labeled static showcase; identify sample data as fictional and explain that sign-in, the backend, AI, persistence, and integrations remain on Manus.

## 10. Systeme.io-inspired frontend foundation

- [x] Add navigable frontend surfaces for funnels, campaigns and email, automations, products and payments, courses and memberships, bookings, affiliates, and analytics.
- [x] Add local design-mode interactions for funnel selection, campaign tabs, workflow toggles, progress views, booking availability, partner states, conversion charts, and guided create actions without pretending that external execution is live.
- [x] Keep the existing CRM, Hermes, approvals, Manus authentication, and human-review boundary intact while making the new growth modules visually consistent with the BUGDATA control-room design.
- [x] Connect funnel drafts, ordered funnel steps, workspace activity logging, and protected create/list procedures to Supabase with RLS.
- [ ] Connect campaigns, permissions, payments, email delivery, course access, booking records, affiliate payouts, analytics events, and workflow execution to Supabase/provider services.

## 11. Supabase-native launch foundation

- [x] Create the production Supabase project schema for workspaces, contacts, tags, funnels, funnel events, campaigns, campaign steps, campaign contacts, email events, approvals, and workspace activity.
- [x] Replace active Manus session verification with Supabase Auth bearer-token verification and persistent browser sessions.
- [x] Move the live CRM, workspace snapshot, approvals, and activity persistence path to Supabase UUID-backed records.
- [x] Enforce tenant isolation with Supabase RLS and authenticated-token database requests; add automatic workspace-owner membership.
- [x] Add a production launch runbook and a health endpoint that reports Supabase Auth configuration.
- [ ] Configure production Auth redirect URLs, SMTP, and provider credentials; complete end-to-end multi-account isolation and provider tests before public launch.
