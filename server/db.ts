import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { approvals, activities, InsertUser, leads, LeadStatus, users, workspaces } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

async function ensureWorkspace(ownerId: number, ownerName?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Workspace storage is unavailable");
  const firstName = ownerName?.trim().split(/\s+/)[0];
  const defaultName = firstName ? `${firstName}'s workspace` : "My workspace";
  await db.insert(workspaces).values({ ownerId, name: defaultName }).onDuplicateKeyUpdate({ set: { ownerId } });
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId)).limit(1);
  if (!workspace) throw new Error("Workspace could not be loaded");
  return workspace;
}

export async function getWorkspaceSnapshot(ownerId: number, ownerName?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Workspace storage is unavailable");
  const workspace = await ensureWorkspace(ownerId, ownerName);
  const [leadRows, approvalRows, activityRows] = await Promise.all([
    db.select().from(leads).where(eq(leads.workspaceId, workspace.id)).orderBy(desc(leads.createdAt)).limit(100),
    db.select().from(approvals).where(eq(approvals.workspaceId, workspace.id)).orderBy(desc(approvals.createdAt)).limit(50),
    db.select().from(activities).where(eq(activities.workspaceId, workspace.id)).orderBy(desc(activities.createdAt)).limit(30),
  ]);
  return { workspace, leads: leadRows, approvals: approvalRows, activities: activityRows };
}

export type NewLeadInput = {
  name: string;
  email: string;
  company?: string;
  title?: string;
  source?: string;
};

export async function createLead(ownerId: number, ownerName: string | null, input: NewLeadInput) {
  const db = await getDb();
  if (!db) throw new Error("Workspace storage is unavailable");
  const workspace = await ensureWorkspace(ownerId, ownerName);
  await db.insert(leads).values({
    workspaceId: workspace.id,
    name: input.name,
    email: input.email,
    company: input.company || null,
    title: input.title || null,
    source: input.source || "Manual entry",
  });
  await db.insert(activities).values({ workspaceId: workspace.id, actor: ownerName || "You", description: `Added ${input.name} to the CRM` });
  const [created] = await db.select().from(leads).where(and(eq(leads.workspaceId, workspace.id), eq(leads.email, input.email))).orderBy(desc(leads.id)).limit(1);
  return created;
}

export async function updateLeadStatus(ownerId: number, ownerName: string | null, leadId: number, status: LeadStatus) {
  const db = await getDb();
  if (!db) throw new Error("Workspace storage is unavailable");
  const workspace = await ensureWorkspace(ownerId, ownerName);
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspace.id))).limit(1);
  if (!lead) return null;
  await db.update(leads).set({ status }).where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspace.id)));
  await db.insert(activities).values({ workspaceId: workspace.id, actor: ownerName || "You", description: `Moved ${lead.name} to ${status}` });
  const [updated] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspace.id))).limit(1);
  return updated;
}

export async function createApproval(ownerId: number, ownerName: string | null, title: string, description: string, agent = "Hermes") {
  const db = await getDb();
  if (!db) throw new Error("Workspace storage is unavailable");
  const workspace = await ensureWorkspace(ownerId, ownerName);
  await db.insert(approvals).values({ workspaceId: workspace.id, agent, title, description });
  await db.insert(activities).values({ workspaceId: workspace.id, actor: agent, description: `Prepared “${title}” for your review` });
  const [created] = await db.select().from(approvals).where(eq(approvals.workspaceId, workspace.id)).orderBy(desc(approvals.id)).limit(1);
  return created;
}

export async function decideApproval(ownerId: number, ownerName: string | null, approvalId: number, status: "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Workspace storage is unavailable");
  const workspace = await ensureWorkspace(ownerId, ownerName);
  const [approval] = await db.select().from(approvals).where(and(eq(approvals.id, approvalId), eq(approvals.workspaceId, workspace.id))).limit(1);
  if (!approval || approval.status !== "pending") return null;
  await db.update(approvals).set({ status }).where(and(eq(approvals.id, approvalId), eq(approvals.workspaceId, workspace.id)));
  await db.insert(activities).values({ workspaceId: workspace.id, actor: ownerName || "You", description: `${status === "approved" ? "Approved" : "Rejected"} “${approval.title}”` });
  const [updated] = await db.select().from(approvals).where(and(eq(approvals.id, approvalId), eq(approvals.workspaceId, workspace.id))).limit(1);
  return updated;
}
