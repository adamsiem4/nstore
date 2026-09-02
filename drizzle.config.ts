import { defineConfig } from "drizzle-kit";

// drizzle-kit runs under Node, which never sees Bun's auto-loaded .env.local.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Not present in CI/Vercel — DATABASE_URL comes from the real environment.
}

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  ...(databaseUrl && { dbCredentials: { url: databaseUrl } }),
});
