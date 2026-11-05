import { SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY } from "../../shared/supabaseConfig";

// Only these public values may reach the browser. Never serialize process.env.
export function publicPlatformConfig(env: NodeJS.ProcessEnv = process.env) {
  const configuredApiUrl = env.BUGDATA_API_URL?.trim();
  const staticPagesBuild = Boolean(configuredApiUrl || env.GITHUB_PAGES === "1");
  return {
    // Express Preview is same-origin; static Pages builds supply the Supabase Function URL.
    apiUrl: configuredApiUrl || (env.GITHUB_PAGES === "1" ? `${SUPABASE_PROJECT_URL}/functions/v1/bugdata-api` : ""),
    projectId: staticPagesBuild ? "" : env.MANUS_PROJECT_ID ?? "",
    oauthPortalUrl: staticPagesBuild ? "" : env.MANUS_OAUTH_PORTAL_URL ?? "",
    apiBrowserKey: staticPagesBuild ? "" : env.MANUS_API_BROWSER_KEY ?? "",
    supabaseUrl: SUPABASE_PROJECT_URL,
    supabaseAnonKey: SUPABASE_PUBLISHABLE_KEY,
  };
}

export function publicPlatformScript(env: NodeJS.ProcessEnv = process.env): string {
  const json = JSON.stringify(publicPlatformConfig(env)).replaceAll("<", "\\u003c");
  return `window.__MANUS_CONFIG__=${json};`;
}
