<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NStore

Portfolio-grade full-stack e-commerce app: Next.js App Router, React, TypeScript, Tailwind CSS v4, shadcn/ui, Clerk, Neon Postgres with Drizzle ORM, Stripe, PostHog, Sentry, Resend, deployed on Vercel. Exact versions live in `package.json`.

## Git

The user owns every Git write. Agents edit files and inspect Git state only: never stage, commit, push, merge, rebase, or open PRs.

## Latest idioms

Write for the versions installed in `package.json`, using each library's current idiom:

- **Next.js**: read the matching guide in `node_modules/next/dist/docs/` before using an API (e.g. this version uses `src/proxy.ts`, which replaced `middleware.ts`).
- **Tailwind CSS v4**: use the built-in utility whenever one covers an arbitrary value (`scrollbar-none` over `[scrollbar-width:none]`, `data-stuck:` over `data-[stuck]:`, `min-w-3xl` over `min-w-[48rem]`). Apply the IDE's canonical-class suggestions.
- **Deprecations**: a deprecation warning from lint, tsc, build, or the IDE is a bug; migrate to the replacement.
- **New dependencies**: add one only when the installed stack cannot reasonably do the job, with `bun add <pkg>@latest`.

## Workflow

1. Search the project for an existing component, utility, type, query, or pattern before writing a new one; reuse it and follow its conventions.
2. Make the smallest coherent change: edit existing files, add abstractions only when the task needs them, refactor at scale only when required.
3. Verify (below).

## Server and client

- Default to Server Components; keep `"use client"` boundaries small.
- Keep database access, secrets, Stripe server logic, authorization, and business logic on the server.
- Use Route Handlers only for real HTTP endpoints, such as webhooks.

## Tooling

Bun only: `bun install`, `bun add`, `bunx`, `bun run <script>`. Scripts are in `package.json`.

## Verification

After a change, run these and fix until all pass:

```bash
bun run lint
bunx tsc --noEmit
bun run test
bun run build
```
