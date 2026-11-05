import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { corsHeaders as supabaseCorsHeaders } from "@supabase/supabase-js/cors";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { z } from "zod";

type AppUser = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

type AppWorkspace = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
};

type LeadStatus = "new" | "qualified" | "proposal" | "won" | "lost";
type ApprovalStatus = "pending" | "approved" | "rejected";
type FunnelStatus = "draft" | "published" | "archived";
type FunnelType = "lead_capture" | "sales" | "webinar" | "course_launch" | "booking" | "custom";
type FunnelStepType = "landing_page" | "opt_in" | "thank_you" | "sales_page" | "checkout" | "order_bump" | "upsell" | "downsell" | "booking" | "course_access" | "webinar" | "custom";

type Context = {
  user: AppUser | null;
  supabase: SupabaseClient | null;
};

type ProtectedContext = Context & {
  user: AppUser;
  supabase: SupabaseClient;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim() || "https://maadakjelhkbqgkbwxsy.supabase.co";
const ALLOWED_ORIGINS = new Set([
  "https://bugdata-commits.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
const LEAD_STATUSES = ["new", "qualified", "proposal", "won", "lost"] as const;
const FUNNEL_TYPES = ["lead_capture", "sales", "webinar", "course_launch", "booking", "custom"] as const;
const FUNNEL_STEP_TYPES = ["landing_page", "opt_in", "thank_you", "sales_page", "checkout", "order_bump", "upsell", "downsell", "booking", "course_access", "webinar", "custom"] as const;
const requestWindow = new Map<string, { start: number; count: number }>();

function getPublishableKey(): string {
  const namedKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (namedKeys) {
    try {
      const parsed = JSON.parse(namedKeys) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      console.error("[BUGDATA API] Supabase publishable-key configuration is invalid.");
    }
  }
  return Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim()
    || Deno.env.get("SUPABASE_ANON_KEY")?.trim()
    || "";
}

function getHermesConfiguration() {
  const apiKey = Deno.env.get("HERMES_API_KEY")?.trim() || "";
  const model = Deno.env.get("HERMES_MODEL")?.trim() || "gpt-4o-mini";
  const configuredUrl = Deno.env.get("HERMES_API_URL")?.trim().replace(/\/+$/, "") || "https://api.openai.com/v1";
  const endpoint = configuredUrl.endsWith("/chat/completions")
    ? configuredUrl
    : configuredUrl.endsWith("/v1")
      ? `${configuredUrl}/chat/completions`
      : `${configuredUrl}/v1/chat/completions`;
  return { apiKey, endpoint, model, configured: Boolean(apiKey) };
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers(supabaseCorsHeaders);
  const allowedHeaders = headers.get("Access-Control-Allow-Headers") ?? "";
  if (!allowedHeaders.toLowerCase().split(/\s*,\s*/).includes("trpc-accept")) {
    headers.set("Access-Control-Allow-Headers", `${allowedHeaders}, trpc-accept`);
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  headers.delete("Access-Control-Allow-Credentials");
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  } else {
    headers.delete("Access-Control-Allow-Origin");
  }
  return headers;
}

function addCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of corsHeaders(request)) headers.set(name, value);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function jsonResponse(body: unknown, status: number, request: Request): Response {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function createContext(request: Request): Promise<Context> {
  const token = getBearerToken(request);
  const publishableKey = getPublishableKey();
  if (!token || !publishableKey) return { user: null, supabase: null };

  const supabase = createClient(SUPABASE_URL, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return { user: null, supabase: null };
    const metadata = data.user.user_metadata ?? {};
    const name = typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : data.user.email ?? null;
    return {
      user: {
        id: data.user.id,
        openId: data.user.id,
        name,
        email: data.user.email ?? null,
        role: data.user.app_metadata?.role === "admin" ? "admin" : "user",
      },
      supabase,
    };
  } catch (error) {
    console.error("[BUGDATA API] Supabase Auth verification failed:", error instanceof Error ? error.message : "unknown error");
    return { user: null, supabase: null };
  }
}

const t = initTRPC.context<Context>().create({ transformer: superjson });
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.supabase) throw new TRPCError({ code: "UNAUTHORIZED", message: "A valid Supabase session is required." });
  return next({ ctx: ctx as ProtectedContext });
});
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  return next({ ctx: ctx as ProtectedContext });
});

function throwIfError(error: { message?: string } | null, fallback: string): void {
  if (error) throw new Error(error.message || fallback);
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "workspace";
}

function fullName(firstName: string | null, lastName: string | null, email: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || email;
}

function workspaceName(user: AppUser): string {
  return user.name?.trim() ? `${user.name.trim().split(/\s+/)[0]}'s workspace` : "My workspace";
}

function mapLead(row: any) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: fullName(row.first_name, row.last_name, row.email),
    email: row.email,
    company: row.company ?? null,
    title: row.job_title ?? null,
    status: (row.pipeline_status ?? "new") as LeadStatus,
    source: row.source ?? null,
    value: Number(row.pipeline_value ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApproval(row: any) {
  return { id: row.id, workspaceId: row.workspace_id, agent: row.agent, title: row.title, description: row.description, status: row.status as ApprovalStatus, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapActivity(row: any) {
  return { id: row.id, workspaceId: row.workspace_id, actor: row.actor, description: row.description, createdAt: row.created_at };
}

function mapFunnelStep(row: any) {
  return { id: row.id, funnelId: row.funnel_id, position: row.position, name: row.name, stepType: row.step_type as FunnelStepType, status: row.status as FunnelStatus, path: row.path ?? null, content: row.content ?? {}, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapFunnel(row: any, steps: any[] = []) {
  return { id: row.id, workspaceId: row.workspace_id, name: row.name, slug: row.slug, funnelType: row.funnel_type as FunnelType, status: row.status as FunnelStatus, description: row.description ?? null, settings: row.settings ?? {}, createdBy: row.created_by ?? null, createdAt: row.created_at, updatedAt: row.updated_at, steps: steps.map(mapFunnelStep) };
}

async function ensureWorkspace(ctx: ProtectedContext): Promise<AppWorkspace> {
  const result = await ctx.supabase.rpc("bugdata_ensure_workspace_for_current_user", { workspace_name: workspaceName(ctx.user) });
  throwIfError(result.error, "Workspace could not be loaded or created");
  if (!result.data) throw new Error("Workspace could not be loaded or created");
  return result.data as AppWorkspace;
}

async function addActivity(ctx: ProtectedContext, workspaceId: string, actor: string, description: string): Promise<void> {
  const result = await ctx.supabase.from("workspace_activities").insert({ workspace_id: workspaceId, actor, description });
  throwIfError(result.error, "Activity could not be recorded");
}

async function getWorkspaceSnapshot(ctx: ProtectedContext) {
  const workspace = await ensureWorkspace(ctx);
  const [contacts, approvals, activities] = await Promise.all([
    ctx.supabase.from("contacts").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(100),
    ctx.supabase.from("agent_approvals").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(50),
    ctx.supabase.from("workspace_activities").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(30),
  ]);
  throwIfError(contacts.error, "Contacts could not be loaded");
  throwIfError(approvals.error, "Approvals could not be loaded");
  throwIfError(activities.error, "Activity could not be loaded");
  return { workspace, leads: (contacts.data ?? []).map(mapLead), approvals: (approvals.data ?? []).map(mapApproval), activities: (activities.data ?? []).map(mapActivity) };
}

async function getFunnels(ctx: ProtectedContext) {
  const workspace = await ensureWorkspace(ctx);
  const funnels = await ctx.supabase.from("funnels").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(100);
  throwIfError(funnels.error, "Funnels could not be loaded");
  const rows = funnels.data ?? [];
  if (!rows.length) return [];
  const steps = await ctx.supabase.from("funnel_steps").select("*").in("funnel_id", rows.map(row => row.id)).order("position", { ascending: true }).limit(500);
  throwIfError(steps.error, "Funnel steps could not be loaded");
  const stepsByFunnel = new Map<string, any[]>();
  for (const step of steps.data ?? []) stepsByFunnel.set(step.funnel_id, [...(stepsByFunnel.get(step.funnel_id) ?? []), step]);
  return rows.map(row => mapFunnel(row, stepsByFunnel.get(row.id) ?? []));
}

async function createFunnel(ctx: ProtectedContext, input: {
  name: string;
  description?: string;
  funnelType: FunnelType;
  steps: Array<{ name: string; stepType: FunnelStepType; path?: string; content?: Record<string, unknown> }>;
}) {
  const workspace = await ensureWorkspace(ctx);
  const created = await ctx.supabase.from("funnels").insert({
    workspace_id: workspace.id,
    name: input.name.trim(),
    slug: `${slugify(input.name)}-${Date.now().toString(36)}`,
    funnel_type: input.funnelType,
    status: "draft",
    description: input.description?.trim() || null,
    created_by: ctx.user.id,
  }).select("*").single();
  throwIfError(created.error, "Funnel could not be created");
  if (!created.data) throw new Error("Funnel could not be created");

  const steps = input.steps.map((step, position) => ({
    funnel_id: created.data.id,
    position,
    name: step.name.trim(),
    step_type: step.stepType,
    status: "draft",
    path: step.path?.trim() || null,
    content: step.content ?? {},
  }));
  const createdSteps = await ctx.supabase.from("funnel_steps").insert(steps).select("*");
  if (createdSteps.error) {
    await ctx.supabase.from("funnels").delete().eq("id", created.data.id).eq("workspace_id", workspace.id);
    throw new Error(createdSteps.error.message || "Funnel steps could not be created");
  }
  await addActivity(ctx, workspace.id, ctx.user.name || "You", `Created funnel “${input.name.trim()}”`);
  return mapFunnel(created.data, createdSteps.data ?? []);
}

async function createLead(ctx: ProtectedContext, input: { name: string; email: string; company?: string; title?: string; source?: string }) {
  const workspace = await ensureWorkspace(ctx);
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const result = await ctx.supabase.from("contacts").insert({
    workspace_id: workspace.id,
    email: input.email.trim().toLowerCase(),
    first_name: firstName,
    last_name: rest.join(" ") || null,
    company: input.company || null,
    job_title: input.title || null,
    source: input.source || "Manual entry",
    pipeline_status: "new",
    pipeline_value: 0,
  }).select("*").single();
  throwIfError(result.error, result.error?.code === "23505" ? "A contact with that email already exists in this workspace." : "Contact could not be created");
  if (!result.data) throw new Error("Contact could not be created");
  await addActivity(ctx, workspace.id, ctx.user.name || "You", `Added ${input.name} to the CRM`);
  return mapLead(result.data);
}

async function updateLeadStatus(ctx: ProtectedContext, id: string, status: LeadStatus) {
  const workspace = await ensureWorkspace(ctx);
  const existing = await ctx.supabase.from("contacts").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  throwIfError(existing.error, "Contact could not be loaded");
  if (!existing.data) return null;
  const updated = await ctx.supabase.from("contacts").update({ pipeline_status: status }).eq("id", id).eq("workspace_id", workspace.id).select("*").single();
  throwIfError(updated.error, "Contact status could not be updated");
  await addActivity(ctx, workspace.id, ctx.user.name || "You", `Moved ${fullName(existing.data.first_name, existing.data.last_name, existing.data.email)} to ${status}`);
  return updated.data ? mapLead(updated.data) : null;
}

async function createApproval(ctx: ProtectedContext, input: { title: string; description: string; agent: string }) {
  const workspace = await ensureWorkspace(ctx);
  const result = await ctx.supabase.from("agent_approvals").insert({ workspace_id: workspace.id, agent: input.agent, title: input.title, description: input.description }).select("*").single();
  throwIfError(result.error, "Approval could not be created");
  if (!result.data) throw new Error("Approval could not be created");
  await addActivity(ctx, workspace.id, input.agent, `Prepared “${input.title}” for your review`);
  return mapApproval(result.data);
}

async function decideApproval(ctx: ProtectedContext, id: string, status: Exclude<ApprovalStatus, "pending">) {
  const workspace = await ensureWorkspace(ctx);
  const existing = await ctx.supabase.from("agent_approvals").select("*").eq("id", id).eq("workspace_id", workspace.id).eq("status", "pending").maybeSingle();
  throwIfError(existing.error, "Approval could not be loaded");
  if (!existing.data) return null;
  const updated = await ctx.supabase.from("agent_approvals").update({ status }).eq("id", id).eq("workspace_id", workspace.id).eq("status", "pending").select("*").single();
  throwIfError(updated.error, "Approval could not be updated");
  await addActivity(ctx, workspace.id, ctx.user.name || "You", `${status === "approved" ? "Approved" : "Rejected"} “${existing.data.title}”`);
  return updated.data ? mapApproval(updated.data) : null;
}

async function askHermes(ctx: ProtectedContext, prompt: string): Promise<{ reply: string }> {
  const { apiKey, endpoint, model, configured } = getHermesConfiguration();
  if (!configured) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Hermes AI is not configured in production yet. Add a user-owned AI provider key to Supabase Function secrets before using the assistant." });
  }

  const now = Date.now();
  const prior = requestWindow.get(ctx.user.id);
  if (prior && now - prior.start < 60_000 && prior.count >= 12) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Hermes is taking a short breather. Please try again in a minute." });
  }
  requestWindow.set(ctx.user.id, prior && now - prior.start < 60_000 ? { start: prior.start, count: prior.count + 1 } : { start: now, count: 1 });

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are Hermes, the orchestration agent inside BUGDATA Agentic OS, a business operating system. Help owners reason about sales, marketing, operations, lead follow-up, websites, and workflows. Be concise, specific, and candid about uncertainty. You may suggest and draft plans, but you cannot send messages, change a CRM, spend money, launch campaigns, or execute connected tools. Do not claim that you have performed an external action. Any consequential action must be presented as a draft for explicit human review and approval." },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Hermes could not reach the AI service. Your prompt is still here; please try again." });
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("[Hermes] Provider returned", response.status, errorText.slice(0, 300));
    throw new TRPCError({ code: response.status === 429 ? "TOO_MANY_REQUESTS" : "BAD_GATEWAY", message: response.status === 429 ? "Hermes is at capacity. Try again shortly." : "Hermes could not reach the AI service. Your prompt is still here; please try again." });
  }

  const result = await response.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string | null } }> };
  if (result.error) throw new TRPCError({ code: "BAD_GATEWAY", message: result.error.message || "Hermes could not complete that request." });
  const reply = result.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Hermes returned an empty reply. Your prompt is still here; please try again." });
  }
  return { reply: reply.trim() };
}

const appRouter = t.router({
  system: t.router({
    health: publicProcedure.input(z.object({ timestamp: z.number().min(0, "timestamp cannot be negative") })).query(() => ({ ok: true })),
    notifyOwner: adminProcedure.input(z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required"),
    })).mutation(() => {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Owner notifications are not configured in the Supabase production runtime." });
    }),
  }),
  auth: t.router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
  }),
  workspace: t.router({
    snapshot: protectedProcedure.query(({ ctx }) => getWorkspaceSnapshot(ctx)),
    funnels: protectedProcedure.query(({ ctx }) => getFunnels(ctx)),
    createFunnel: protectedProcedure.input(z.object({
      name: z.string().trim().min(1).max(160),
      description: z.string().trim().max(2000).optional(),
      funnelType: z.enum(FUNNEL_TYPES).default("lead_capture"),
      steps: z.array(z.object({
        name: z.string().trim().min(1).max(160),
        stepType: z.enum(FUNNEL_STEP_TYPES),
        path: z.string().trim().max(240).optional(),
        content: z.record(z.string(), z.unknown()).optional(),
      })).min(1).max(20),
    })).mutation(({ ctx, input }) => createFunnel(ctx, input)),
    createLead: protectedProcedure.input(z.object({
      name: z.string().trim().min(1).max(160),
      email: z.string().trim().email().max(320),
      company: z.string().trim().max(160).optional(),
      title: z.string().trim().max(160).optional(),
      source: z.string().trim().max(100).optional(),
    })).mutation(({ ctx, input }) => createLead(ctx, input)),
    updateLeadStatus: protectedProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(LEAD_STATUSES) }))
      .mutation(({ ctx, input }) => updateLeadStatus(ctx, input.id, input.status)),
    createApproval: protectedProcedure.input(z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(5000),
      agent: z.string().trim().min(1).max(80).default("Hermes"),
    })).mutation(({ ctx, input }) => createApproval(ctx, input)),
    decideApproval: protectedProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }))
      .mutation(({ ctx, input }) => decideApproval(ctx, input.id, input.status)),
  }),
  agent: t.router({
    status: protectedProcedure.query(() => ({ hermesConfigured: getHermesConfiguration().configured })),
    askHermes: protectedProcedure.input(z.object({ prompt: z.string().trim().min(1).max(1600) }))
      .mutation(({ ctx, input }) => askHermes(ctx, input.prompt)),
  }),
});

Deno.serve(async (request: Request) => {
  const url = new URL(request.url);
  const cors = corsHeaders(request);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const path = url.pathname;
  if (request.method === "GET" && path.endsWith("/health")) {
    const supabaseConfigured = Boolean(SUPABASE_URL && getPublishableKey());
    return jsonResponse({
      status: supabaseConfigured ? "ok" : "degraded",
      checks: { supabaseConfigured, hermesConfigured: getHermesConfiguration().configured },
    }, supabaseConfigured ? 200 : 503, request);
  }

  const expectedApiKey = getPublishableKey();
  if (!expectedApiKey || request.headers.get("apikey") !== expectedApiKey) {
    return jsonResponse({ error: "A valid project publishable key is required." }, 401, request);
  }

  const routeMarker = "/api/trpc";
  const routeIndex = path.indexOf(routeMarker);
  if (routeIndex < 0) return jsonResponse({ error: "Not found" }, 404, request);
  const endpoint = `${path.slice(0, routeIndex)}${routeMarker}`;

  try {
    const response = await fetchRequestHandler({
      endpoint,
      req: request,
      router: appRouter,
      createContext: () => createContext(request),
    });
    return addCors(response, request);
  } catch (error) {
    console.error("[BUGDATA API] Request failed:", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "The API could not complete this request." }, 500, request);
  }
});
