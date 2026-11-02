import "server-only";

export function getDevToolsAccess(metadata: Record<string, unknown> | undefined) {
  const allowed = process.env.NODE_ENV === "development" && metadata?.role === "admin";
  return { allowed, enabled: allowed && metadata?.devToolsEnabled === true };
}
