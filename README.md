# NStore

NStore is a single full-stack e-commerce application built with the Next.js
App Router, TypeScript, Bun, and Tailwind CSS.

## Stack

- Next.js App Router
- TypeScript
- Bun
- Tailwind CSS
- shadcn/ui
- Clerk
- Neon PostgreSQL
- Drizzle ORM
- Stripe
- Resend
- PostHog
- Sentry
- Vercel
- CodeRabbit

## Architecture

- One Next.js application; no separate frontend or backend repository
- Server Components by default, with narrow Client Component boundaries
- Server-only database access, secrets, authorization, and business logic
- Server Actions for application mutations and Route Handlers for HTTP endpoints
- Clerk for authentication and authorization
- Drizzle's Neon HTTP driver for PostgreSQL access
- Signed Stripe webhooks as the source of truth for payment state

## Implemented

- Landing page, product catalog, and product detail pages
- Shared storefront layout and shadcn/ui configuration
- Clerk sign-in, sign-up, user controls, and protected account page
- Drizzle payment schema and generated PostgreSQL migration
- Stripe webhook signature verification and durable payment-status synchronization
- Idempotent Resend payment-confirmation emails
- PostHog browser analytics and Sentry client/server/edge error monitoring
- Zero-configuration Vercel deployment and CodeRabbit pull-request review

Product catalog data remains in memory until a Neon product migration is
defined. Payment persistence uses Neon now.

## Environment

One file holds values: `.env.local`, git-ignored, never committed.
`.env.example` is the committed template with the same names in the same
order — copy it and fill in. Where each value comes from:

| Variable | Source |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | `bunx clerk@latest init`, or dashboard.clerk.com > API keys |
| `NEXT_PUBLIC_CLERK_SIGN_*` | routes in this app; defaults already set |
| `DATABASE_URL` | console.neon.tech > Connect > pooled connection string |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com in Test mode > API keys |
| `STRIPE_WEBHOOK_SECRET` | `bunx stripe listen` locally, or the endpoint's signing secret |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | resend.com > API keys; sender on a verified domain |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` | app.posthog.com > Settings > Project |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io > project > Client Keys (DSN) |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | sentry.io; only needed to upload source maps |

Every value is optional except Clerk and `DATABASE_URL`: an empty variable
disables its integration, and server code throws a named error instead of
failing silently.

## Development

```bash
bun install
bun run db:migrate
bun run dev
```

Useful checks:

```bash
bun run test
bun run lint
bunx tsc --noEmit
bun run build
```

Add shadcn/ui components with:

```bash
bunx --bun shadcn@latest add button
```

The generated components import `cn` from `@/lib/utils`; that helper was
removed with the unused button, so restore it (and `clsx` plus
`tailwind-merge`) when adding the first component.

For Stripe, register `/api/webhooks/stripe` and subscribe to
`payment_intent.*` events.

Deploy by importing the repository into Vercel and adding the variables from
`.env.example`. Vercel detects Next.js and installs from `bun.lock`.

## License

MIT — see [LICENSE](./LICENSE).
