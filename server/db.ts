import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { InsertUser, User } from "../drizzle/schema";

export type LeadStatus = "new" | "qualified" | "proposal" | "won" | "lost";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type FunnelStatus = "draft" | "published" | "archived";
export type FunnelType = "lead_capture" | "sales" | "webinar" | "course_launch" | "booking" | "custom";
export type FunnelStepType = "landing_page" | "opt_in" | "thank_you" | "sales_page" | "checkout" | "order_bump" | "upsell" | "downsell" | "booking" | "course_access" | "webinar" | "custom";

export type AppWorkspace = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  company: string | null;
  title: string | null;
  status: LeadStatus;
  source: string | null;
  value: number;
  createdAt: string;
  updatedAt: string;
};

export type Approval = {
  id: string;
  workspaceId: string;
  agent: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  workspaceId: string;
  actor: string;
  description: string;
  createdAt: string;
};

export type FunnelStep = {
  id: string;
  funnelId: string;
  position: number;
  name: string;
  stepType: FunnelStepType;
  status: FunnelStatus;
  path: string | null;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type Funnel = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  funnelType: FunnelType;
  status: FunnelStatus;
  description: string | null;
  settings: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  steps: FunnelStep[];
};

let serviceClient: SupabaseClient | null = null;

function getSupabaseClient(accessToken?: string) {
  const url = process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const publishableKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_KEY ?? "";
  if (!url || (!serviceRoleKey && !publishableKey)) throw new Error("Supabase is not configured. Set SUPABASE_URL and a server key.");
  if (serviceRoleKey) {
    if (serviceClient) return serviceClient;
    serviceClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    return serviceClient;
  }
  if (!accessToken) throw new Error("Supabase access token is required for an RLS-scoped request.");
  return createClient(url, publishableKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

function assertNoError(error: { message?: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "workspace";
}

function fullName(firstName: string | null, lastName: string | null, email: string) {
  const value = [firstName, lastName].filter(Boolean).join(" ").trim();
  return value || email;
}

function mapLead(row: any): Lead {
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

function mapApproval(row: any): Approval {
  return { id: row.id, workspaceId: row.workspace_id, agent: row.agent, title: row.title, description: row.description, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapActivity(row: any): Activity {
  return { id: row.id, workspaceId: row.workspace_id, actor: row.actor, description: row.description, createdAt: row.created_at };
}

function mapFunnelStep(row: any): FunnelStep {
  return { id: row.id, funnelId: row.funnel_id, position: row.position, name: row.name, stepType: row.step_type, status: row.status, path: row.path ?? null, content: row.content ?? {}, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapFunnel(row: any, steps: any[] = []): Funnel {
  return { id: row.id, workspaceId: row.workspace_id, name: row.name, slug: row.slug, funnelType: row.funnel_type, status: row.status, description: row.description ?? null, settings: row.settings ?? {}, createdBy: row.created_by ?? null, createdAt: row.created_at, updatedAt: row.updated_at, steps: steps.map(mapFunnelStep) };
}

async function ensureWorkspace(ownerId: string, ownerName: string | null | undefined, accessToken: string) {
  const supabase = getSupabaseClient(accessToken);
  const existing = await supabase.from("workspaces").select("*").eq("owner_id", ownerId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  assertNoError(existing.error, "Workspace could not be loaded");
  if (existing.data) return existing.data as AppWorkspace;

  const name = ownerName?.trim() ? `${ownerName.trim().split(/\s+/)[0]}'s workspace` : "My workspace";
  const baseSlug = slugify(name);
  const created = await supabase.from("workspaces").insert({ owner_id: ownerId, name, slug: `${baseSlug}-${ownerId.slice(0, 8)}` }).select("*").single();
  assertNoError(created.error, "Workspace could not be created");
  if (!created.data) throw new Error("Workspace could not be created");
  return created.data as AppWorkspace;
}

async function addActivity(workspaceId: string, actor: string, description: string, accessToken: string) {
  const result = await getSupabaseClient(accessToken).from("workspace_activities").insert({ workspace_id: workspaceId, actor, description });
  assertNoError(result.error, "Activity could not be recorded");
}

export async function getWorkspaceSnapshot(ownerId: string, ownerName: string | null | undefined, accessToken: string) {
  const supabase = getSupabaseClient(accessToken);
  const workspace = await ensureWorkspace(ownerId, ownerName, accessToken);
  const [contacts, approvals, activities] = await Promise.all([
    supabase.from("contacts").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("agent_approvals").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("workspace_activities").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(30),
  ]);
  assertNoError(contacts.error, "Contacts could not be loaded");
  assertNoError(approvals.error, "Approvals could not be loaded");
  assertNoError(activities.error, "Activity could not be loaded");
  return { workspace, leads: (contacts.data ?? []).map(mapLead), approvals: (approvals.data ?? []).map(mapApproval), activities: (activities.data ?? []).map(mapActivity) };
}

export async function getFunnels(ownerId: string, ownerName: string | null | undefined, accessToken: string) {
  const supabase = getSupabaseClient(accessToken);
  const workspace = await ensureWorkspace(ownerId, ownerName, accessToken);
  const funnels = await supabase.from("funnels").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(100);
  assertNoError(funnels.error, "Funnels could not be loaded");
  const rows = funnels.data ?? [];
  if (!rows.length) return [];
  const steps = await supabase.from("funnel_steps").select("*").in("funnel_id", rows.map(row => row.id)).order("position", { ascending: true }).limit(500);
  assertNoError(steps.error, "Funnel steps could not be loaded");
  const stepsByFunnel = new Map<string, any[]>();
  for (const step of steps.data ?? []) stepsByFunnel.set(step.funnel_id, [...(stepsByFunnel.get(step.funnel_id) ?? []), step]);
  return rows.map(row => mapFunnel(row, stepsByFunnel.get(row.id) ?? []));
}

export type NewFunnelInput = {
  name: string;
  description?: string;
  funnelType: FunnelType;
  steps: Array<{ name: string; stepType: FunnelStepType; path?: string; content?: Record<string, unknown> }>;
};

export async function createFunnel(ownerId: string, ownerName: string | null | undefined, input: NewFunnelInput, accessToken: string) {
  const supabase = getSupabaseClient(accessToken);
  const workspace = await ensureWorkspace(ownerId, ownerName, accessToken);
  const created = await supabase.from("funnels").insert({ workspace_id: workspace.id, name: input.name.trim(), slug: `${slugify(input.name)}-${Date.now().toString(36)}`, funnel_type: input.funnelType, status: "draft", description: input.description?.trim() || null, created_by: ownerId }).select("*").single();
  assertNoError(created.error, "Funnel could not be created");
  if (!created.data) throw new Error("Funnel could not be created");

  const steps = input.steps.map((step, position) => ({ funnel_id: created.data.id, position, name: step.name.trim(), step_type: step.stepType, status: "draft", path: step.path?.trim() || null, content: step.content ?? {} }));
  const createdSteps = await supabase.from("funnel_steps").insert(steps).select("*");
  if (createdSteps.error) {
    await supabase.from("funnels").delete().eq("id", created.data.id).eq("workspace_id", workspace.id);
    throw new Error(createdSteps.error.message || "Funnel steps could not be created");
  }
  await addActivity(workspace.id, ownerName || "You", `Created funnel “${input.name.trim()}”`, accessToken);
  return mapFunnel(created.data, createdSteps.data ?? []);
}

export type NewLeadInput = { name: string; email: string; company?: string; title?: string; source?: string };

export async function createLead(ownerId: string, ownerName: string | null, input: NewLeadInput, accessToken: string) {
  const workspace = await ensureWorkspace(ownerId, ownerName, accessToken);
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const result = await getSupabaseClient(accessToken).from("contacts").insert({ workspace_id: workspace.id, email: input.email.trim().toLowerCase(), first_name: firstName, last_name: rest.join(" ") || null, company: input.company || null, job_title: input.title || null, source: input.source || "Manual entry", pipeline_status: "new", pipeline_value: 0 }).select("*").single();
  assertNoError(result.error, result.error?.code === "23505" ? "A contact with that email already exists in this workspace." : "Contact could not be created");
  if (!result.data) throw new Error("Contact could not be created");
  await addActivity(workspace.id, ownerName || "You", `Added ${input.name} to the CRM`, accessToken);
  return mapLead(result.data);
}

export async function updateLeadStatus(ownerId: string, ownerName: string | null, leadId: string, status: LeadStatus, accessToken: string) {
  const workspace = await ensureWorkspace(ownerId, ownerName, accessToken);
  const existing = await getSupabaseClient(accessToken).from("contacts").select("*").eq("id", leadId).eq("workspace_id", workspace.id).maybeSingle();
  assertNoError(existing.error, "Contact could not be loaded");
  if (!existing.data) return null;
  const updated = await getSupabaseClient(accessToken).from("contacts").update({ pipeline_status: status }).eq("id", leadId).eq("workspace_id", workspace.id).select("*").single();
  assertNoError(updated.error, "Contact status could not be updated");
  await addActivity(workspace.id, ownerName || "You", `Moved ${fullName(existing.data.first_name, existing.data.last_name, existing.data.email)} to ${status}`, accessToken);
  return updated.data ? mapLead(updated.data) : null;
}

export async function createApproval(ownerId: string, ownerName: string | null, title: string, description: string, agent = "Hermes", accessToken: string) {
  const workspace = await ensureWorkspace(ownerId, ownerName, accessToken);
  const result = await getSupabaseClient(accessToken).from("agent_approvals").insert({ workspace_id: workspace.id, agent, title, description }).select("*").single();
  assertNoError(result.error, "Approval could not be created");
  if (!result.data) throw new Error("Approval could not be created");
  await addActivity(workspace.id, agent, `Prepared “${title}” for your review`, accessToken);
  return mapApproval(result.data);
}

export async function decideApproval(ownerId: string, ownerName: string | null, approvalId: string, status: Exclude<ApprovalStatus, "pending">, accessToken: string) {
  const workspace = await ensureWorkspace(ownerId, ownerName, accessToken);
  const existing = await getSupabaseClient(accessToken).from("agent_approvals").select("*").eq("id", approvalId).eq("workspace_id", workspace.id).eq("status", "pending").maybeSingle();
  assertNoError(existing.error, "Approval could not be loaded");
  if (!existing.data) return null;
  const updated = await getSupabaseClient(accessToken).from("agent_approvals").update({ status }).eq("id", approvalId).eq("workspace_id", workspace.id).eq("status", "pending").select("*").single();
  assertNoError(updated.error, "Approval could not be updated");
  await addActivity(workspace.id, ownerName || "You", `${status === "approved" ? "Approved" : "Rejected"} “${existing.data.title}”`, accessToken);
  return updated.data ? mapApproval(updated.data) : null;
}

// Legacy Manus OAuth compatibility exports. Supabase Auth is the active path;
// these remain only so the retired OAuth modules can be removed independently.
export async function upsertUser(_user: InsertUser): Promise<void> { return; }
export async function getUserByOpenId(_openId: string): Promise<User | undefined> { return undefined; }
