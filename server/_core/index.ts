import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { supabaseAuthConfigured } from "./supabaseAuth";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => {
    const supabase = supabaseAuthConfigured();
    res.status(supabase ? 200 : 503).json({ status: supabase ? "ok" : "degraded", checks: { supabaseAuth: supabase } });
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  app.get("/manus-routes.json", (_req, res) => {
    res.set("Cache-Control", "no-cache").json({ routes: [
      { path: "/", title: "Overview" },
      { path: "/crm", title: "CRM" },
      { path: "/agents", title: "Agents" },
      { path: "/workflows", title: "Workflows" },
      { path: "/automations", title: "Automations" },
      { path: "/approvals", title: "Approvals" },
      { path: "/funnels", title: "Websites & funnels" },
      { path: "/marketing", title: "Campaigns & email" },
      { path: "/analytics", title: "Analytics" },
      { path: "/commerce", title: "Products & payments" },
      { path: "/courses", title: "Courses & memberships" },
      { path: "/bookings", title: "Bookings" },
      { path: "/affiliates", title: "Affiliates" },
      { path: "/integrations", title: "Integrations" },
      { path: "/settings", title: "Settings" },
    ] });
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
