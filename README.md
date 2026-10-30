# NStore

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-1.4-14151A?logo=bun&logoColor=white)](https://bun.sh)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Stripe](https://img.shields.io/badge/Stripe-22-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E)](./LICENSE)

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

## Architecture

- One Next.js application; no separate frontend or backend repository
- Server Components by default, with narrow Client Component boundaries
- Server-only database access, secrets, authorization, and business logic
- Server Actions for application mutations and Route Handlers for HTTP endpoints
- Clerk for authentication and authorization
- Drizzle's Neon HTTP driver for PostgreSQL access
- Signed Stripe webhooks as the source of truth for payment state

## Project structure

```text
src/
├── app/                App Router pages, API routes, sign-in and sign-up
├── components/
│   ├── account/        profile phone form
│   ├── analytics/      PostHog identity and events
│   ├── cart/           cart drawer, buttons, and shipping progress
│   ├── consent/        cookie banner and preferences
│   ├── help/           help center
│   ├── layout/         header, footer, account shell, and theme picker
│   ├── loading/        skeleton loaders
│   ├── orders/         order list, items, and returns
│   ├── products/       product cards, grids, and images
│   └── ui/             shadcn/ui primitives and in-house UI
├── lib/                cart math, consent, and formatting helpers
├── server/
│   ├── actions/        Server Actions
│   ├── db/             Drizzle client, schema, and seed data
│   ├── emails/         order email templates
│   ├── queries/        server-only reads
│   └── services/       Stripe and Resend clients
└── types/              shared types
tests/                  bun test suites, mirroring src/
drizzle/                generated SQL migrations
public/
├── icons/              favicons and manifest icons
└── products/           catalog renders
```

## Implemented

- Responsive landing page with keyboard navigation and reduced-motion support
- Searchable 50-product catalog, and product pages with key details, a specification table, materials, box contents, and care
- Six household categories with original 1536×1536, text-free 3D product renders
- Shared storefront layout and shadcn/ui configuration
- Responsive, theme-aware skeletons for catalog/search, cart, account/addresses, orders, and checkout validation; static content and navigation stream immediately, product images resolve independently, and pulses respect reduced motion. Unknown row counts use representative placeholders; Clerk retains control of its internal loading UI.
- Product-card quick-add with animated purple success/red error feedback, a slide-out cart drawer, cookie-backed `/cart`, quantity controls, a free-shipping countdown, in-cart suggestions, and order summary
- Stripe hosted checkout with delivery addresses (a signed-in user's default saved address pre-fills it via a Stripe customer whose id lives in Clerk private metadata) and paid-return cart clearing
- Clerk sign-in, sign-up, a protected Amazon-style `/account` hub (cards with sub-links for orders, login & security, addresses, plus sign out) that the desktop avatar and the mobile menu link to; Clerk profile at `/account/profile` and security at `/account/profile/security` restyled to match the store, with an optional phone number kept in Clerk private metadata and sent to the Stripe customer at checkout; an `/account/addresses` book (add, edit, remove, one default enforced by a partial unique index); and a signed-in `/orders` history built from webhook-recorded payments
- Return requests from paid orders: an inline item/reason form, persisted confirmation, ownership checks, duplicate protection, and fully refunded-order blocking
- Drizzle catalog (`products` + `product_details`), payment and saved-address schemas with generated PostgreSQL migrations and an atomic seed script
- Stripe webhook signature verification and durable payment-status synchronization
- Idempotent Resend confirmation emails for paid orders, using one branded HTML and plain-text template that also covers the shipped and delivered steps
- Order-page delivery tracker and status badge, with fulfillment stored on the Stripe payment's metadata; a development-only Dev tools panel moves your own orders through the steps and sends each step's email, since no warehouse integration exists
- Consent-gated PostHog analytics, loaded only after the visitor accepts (pageviews, autocapture, Clerk identity, `Products Searched` / `Product Added` (with `source`) / `Product Removed` / `Checkout Started` / `Order Completed` ecommerce events) and Sentry client/server/edge error monitoring
- Zero-configuration Vercel deployment

Catalog reads go through `src/server/queries/`. Its original
WebP renders live in `public/products/`; no rendering library or external image
service is required at runtime. Search matches names, descriptions, and categories.

Product names and specifications remain in HTML rather than baked into the
images, keeping small or floating lettering off the product artwork. When
replacing renders in place, clear `.next/dev/cache/images` to refresh Next.js
development image previews.

Catalog and payment data both live in Neon via Drizzle; catalog source data is in
`src/server/db/seed/`. Product-card adds stay on the catalog; product-detail adds
show confirmation and slide the cart drawer open. The header bag opens the same
drawer — a native modal `<dialog>` —
whose "View cart" link leads to the full `/cart` page, which also serves direct
visits and no-JS form posts.
Buttons respond immediately on click, hold bright purple success feedback for two
seconds, and show red retry feedback for three seconds on failure. Feedback uses
global color tokens in both themes and respects reduced-motion preferences.
Orders from €60 ship free; below that, Stripe Checkout adds a €4.95 flat rate,
and the cart counts down to the threshold.
Cancelled checkout preserves the cart; `/api/checkout/return` clears it only after
Stripe confirms a paid session. Configure `STRIPE_SECRET_KEY` to enable payment.

Signed-in customers can request a return from `/orders`. Requests are stored on
the Stripe PaymentIntent as `returnStatus=requested` and `returnDetails`; review
them on the payment in the Stripe dashboard. The 30-day window starts at
delivery; the request flow does not enforce it, so eligibility is checked during
manual review rather than inferred from the payment date. Return instructions and
refunds are handled manually; submitting a request does not issue a refund or
send an email. No database migration or new environment variable is required.
Order headers and return controls use distinct per-order keys when passed into
the client-rendered order list.

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
| `SENTRY_AUTH_TOKEN` | sentry.io > Settings > Auth Tokens; only needed to upload source maps (org and project are set in `next.config.ts`) |

Every value is optional except Clerk and `DATABASE_URL`: an empty variable
disables its integration, and server code throws a named error instead of
failing silently.

## Development

Use Node.js 24 LTS (24.22.1, pinned in `.node-version`) and Bun 1.4.4.
Node is the Next.js runtime; Bun is the only package manager. `package.json`
declares the supported runtime versions and pins the package-manager version.
If using fnm, run `fnm install` and `fnm use` to select the pinned Node version.

```bash
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

Useful checks:

```bash
bun run test
bun run lint
bunx tsc --noEmit
bun run build
```

Dependency updates use `bun update` for existing version ranges. Update pinned
Next.js and `eslint-config-next` together, and React and React DOM together;
major-version migrations are separate work. Keep `package.json` and `bun.lock`
in sync, run the checks above, and smoke-test the production storefront and cart.

The latest dependency refresh uses Next.js and `eslint-config-next` 16.4.3,
React and React DOM 19.3.1, Node 24 type definitions, and `posthog-js` 1.438.23.
Compatible transitive dependencies were refreshed without changing lifecycle-script trust.
Clerk, Sentry, Lucide, Resend, shadcn, and cn are also updated. Stripe stays on 22.x because
23.x changes its API contract; ESLint stays on 9.x because the React, import,
and accessibility plugins do not declare ESLint 10 support. TypeScript stays
on 5.9.x rather than taking a compiler-major migration; TypeScript 7 is outside
the current typescript-eslint peer range.

## Database

- Schema: `src/server/db/schema.ts`
- Queries: `src/server/queries/`
- Schema changes: edit the schema → `bun run db:generate` → review SQL in `drizzle/` → `bun run db:migrate`
- Catalog changes: edit `src/server/db/seed/*` → `bun run db:seed`; it replaces `products` and `product_details` in one transaction, leaving payments untouched
- Browse data: `bun run db:studio`
- `bun run test` loads `.env.local`; the query suites read the seeded database

Add shadcn/ui components with:

```bash
bunx --bun shadcn@latest add button
```

The generated components import `cn` from `@/lib/utils`.

For Stripe, register `/api/webhooks/stripe` and subscribe to
`payment_intent.*` events.

Deploy by importing the repository into Vercel and adding the variables from
`.env.example`. Vercel detects Next.js and installs from `bun.lock`.

## License

MIT — see [LICENSE](./LICENSE).
