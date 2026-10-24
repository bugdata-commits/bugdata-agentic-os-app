import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { createApproval, createLead, decideApproval, getWorkspaceSnapshot, updateLeadStatus } from "./db";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

const requestWindow = new Map<string, { start: number; count: number }>();
const LEAD_STATUSES = ["new", "qualified", "proposal", "won", "lost"] as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    snapshot: protectedProcedure.query(({ ctx }) => getWorkspaceSnapshot(ctx.user.id, ctx.user.name, ctx.supabaseAccessToken!)),
    createLead: protectedProcedure.input(z.object({
      name: z.string().trim().min(1).max(160),
      email: z.string().trim().email().max(320),
      company: z.string().trim().max(160).optional(),
      title: z.string().trim().max(160).optional(),
      source: z.string().trim().max(100).optional(),
    })).mutation(({ ctx, input }) => createLead(ctx.user.id, ctx.user.name, input, ctx.supabaseAccessToken!)),
    updateLeadStatus: protectedProcedure.input(z.object({
      id: z.string().uuid(),
      status: z.enum(LEAD_STATUSES),
    })).mutation(({ ctx, input }) => updateLeadStatus(ctx.user.id, ctx.user.name, input.id, input.status, ctx.supabaseAccessToken!)),
    createApproval: protectedProcedure.input(z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(5000),
      agent: z.string().trim().min(1).max(80).default("Hermes"),
    })).mutation(({ ctx, input }) => createApproval(ctx.user.id, ctx.user.name, input.title, input.description, input.agent, ctx.supabaseAccessToken!)),
    decideApproval: protectedProcedure.input(z.object({
      id: z.string().uuid(),
      status: z.enum(["approved", "rejected"]),
    })).mutation(({ ctx, input }) => decideApproval(ctx.user.id, ctx.user.name, input.id, input.status, ctx.supabaseAccessToken!)),
  }),
  agent: router({
    askHermes: protectedProcedure.input(z.object({ prompt: z.string().trim().min(1).max(1600) })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const prior = requestWindow.get(ctx.user.id);
      if (prior && now - prior.start < 60_000 && prior.count >= 12) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Hermes is taking a short breather. Please try again in a minute." });
      }
      requestWindow.set(ctx.user.id, prior && now - prior.start < 60_000 ? { start: prior.start, count: prior.count + 1 } : { start: now, count: 1 });

      if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The built-in AI service is not configured for this project yet." });
      }
      const response = await fetch(`${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are Hermes, the orchestration agent inside BUGDATA Agentic OS, a business operating system. Help owners reason about sales, marketing, operations, lead follow-up, websites, and workflows. Be concise, specific, and candid about uncertainty. You may suggest and draft plans, but you cannot send messages, change a CRM, spend money, launch campaigns, or execute connected tools. Do not claim that you have performed an external action. Any consequential action must be presented as a draft for explicit human review and approval." },
            { role: "user", content: input.prompt },
          ],
        }),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("[Hermes] Model service returned", response.status, errorText.slice(0, 500));
        throw new TRPCError({ code: response.status === 429 ? "TOO_MANY_REQUESTS" : "BAD_GATEWAY", message: response.status === 429 ? "Hermes is at capacity. Try again shortly." : "Hermes could not reach the AI service. Your prompt is still here; please try again." });
      }
      const result = await response.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string | null } }> };
      if (result.error) throw new TRPCError({ code: "BAD_GATEWAY", message: result.error.message || "Hermes could not complete that request." });
      const content = result.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Hermes returned an empty reply. Your prompt is still here; please try again." });
      }
      return { reply: content.trim() };
    }),
  }),
});

export type AppRouter = typeof appRouter;
