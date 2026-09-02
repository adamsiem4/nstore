<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data.
Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` - verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git

Never stage, commit, push, merge, rebase, or create PRs.
Only edit files and inspect Git state.
The user handles all Git write operations manually.

# NStore

NStore is a portfolio-grade full-stack e-commerce application.

## Stack

- Next.js App Router
- TypeScript
- Bun
- Tailwind CSS
- shadcn/ui
- Clerk
- PostgreSQL on Neon
- Drizzle ORM
- Stripe
- PostHog
- Sentry
- Resend
- Vercel

Always check `package.json` for exact installed versions before using framework-specific APIs.

## Package Manager

Use Bun only.

```bash
bun install
bun add <package>
bun add -d <package>
bun dev
bun run lint
bun run build
```
