# NStore

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-14151A?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](./LICENSE)

NStore is a home appliances and household goods store built with the Next.js
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

- Responsive landing page with keyboard navigation, pausable announcements, and reduced-motion support
- Searchable 50-product catalog and product detail pages
- Six household categories with original 1536×1536, text-free 3D product renders
- Shared storefront layout and shadcn/ui configuration
- Product-card quick-add, cookie-backed `/cart`, quantity controls, and order summary
- Stripe hosted checkout with delivery addresses and paid-return cart clearing
- Clerk sign-in, sign-up, user controls, and protected account page
- Drizzle payment schema and generated PostgreSQL migration
- Stripe webhook signature verification and durable payment-status synchronization
- Idempotent Resend payment-confirmation emails
- PostHog browser analytics and Sentry client/server/edge error monitoring
- Zero-configuration Vercel deployment and CodeRabbit pull-request review

The household catalog lives in `src/server/queries/products.ts`. Its original
WebP renders live in `public/products/`; no rendering library or external image
service is required at runtime. Search matches names, descriptions, and categories.

Product names and specifications remain in HTML rather than baked into the
images, keeping small or floating lettering off the product artwork. When
replacing renders in place, clear `.next/dev/cache/images` to refresh Next.js
development image previews.

Catalog data remains in memory; payment persistence uses Neon. Product-card adds
stay on the catalog; product-detail adds open `/cart`. Shipping is free at checkout.
Cancelled checkout preserves the cart; `/api/checkout/return` clears it only after
Stripe confirms a paid session. Configure `STRIPE_SECRET_KEY` to enable payment.

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
