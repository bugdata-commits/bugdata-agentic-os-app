import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ ownerUnique: uniqueIndex("workspaces_owner_unique").on(table.ownerId) })
);

export const leads = mysqlTable(
  "leads",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    company: varchar("company", { length: 160 }),
    title: varchar("title", { length: 160 }),
    status: mysqlEnum("status", ["new", "qualified", "proposal", "won", "lost"]).default("new").notNull(),
    source: varchar("source", { length: 100 }),
    value: int("value").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ workspaceCreatedIdx: index("leads_workspace_created_idx").on(table.workspaceId, table.createdAt) })
);

export const approvals = mysqlTable(
  "approvals",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    agent: varchar("agent", { length: 80 }).notNull().default("Hermes"),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ workspaceStatusIdx: index("approvals_workspace_status_idx").on(table.workspaceId, table.status) })
);

export const activities = mysqlTable(
  "activities",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    actor: varchar("actor", { length: 80 }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ workspaceCreatedIdx: index("activities_workspace_created_idx").on(table.workspaceId, table.createdAt) })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type LeadStatus = Lead["status"];
