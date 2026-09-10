import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/header";
import { Separator } from "@/components/ui/separator";

// ponytail: swap this placeholder for the real privacy address before launch.
const CONTACT_EMAIL = "privacy@nstore.example";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How nstore collects, uses, shares, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <a
        href="#privacy-content"
        className="sr-only z-50 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-offset-4 focus:outline-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <Separator className="my-6 sm:my-8" />

      <main id="privacy-content" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 outline-none">
        <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Privacy Policy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Your data at nstore
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          This policy explains what personal data nstore uses, why it is used, and the choices and
          rights available to you.
        </p>

        <section aria-labelledby="controller-heading" className="mt-10 space-y-3">
          <h2 id="controller-heading" className="text-2xl font-semibold tracking-tight">
            Controller and contact
          </h2>
          <p className="leading-7 text-muted-foreground">
            nstore is the controller responsible for the personal data described here. For privacy
            questions or to exercise your rights, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section aria-labelledby="collection-heading" className="mt-10 space-y-3">
          <h2 id="collection-heading" className="text-2xl font-semibold tracking-tight">
            What we collect and why
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>
              <strong className="text-foreground">Account data:</strong> Clerk handles your email,
              name, and authentication data so we can create and secure your account and perform our
              contract with you.
            </li>
            <li>
              <strong className="text-foreground">Orders and payments:</strong> We use order,
              delivery, contact, and payment-status data to fulfil purchases. Stripe is our payment
              processor. Card details go directly to Stripe and never touch nstore.
            </li>
            <li>
              <strong className="text-foreground">Order emails:</strong> Resend processes your email
              address and order-message contents to send transactional updates.
            </li>
            <li>
              <strong className="text-foreground">Catalog and order storage:</strong> Neon Postgres
              stores catalog and order records. Data is held in an EU region when the Neon project is
              configured for one.
            </li>
            <li>
              <strong className="text-foreground">Error diagnostics:</strong> Sentry receives
              technical error and device or request context needed to diagnose failures, under our
              legitimate interest in keeping nstore reliable and secure.
            </li>
            <li>
              <strong className="text-foreground">Product analytics:</strong> PostHog measures how
              nstore is used only when you consent to optional analytics.
            </li>
          </ul>
        </section>

        <section aria-labelledby="bases-heading" className="mt-10 space-y-3">
          <h2 id="bases-heading" className="text-2xl font-semibold tracking-tight">
            Legal bases
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>Article 6(1)(b), contract, for accounts, orders, payments, and order communications.</li>
            <li>Article 6(1)(f), legitimate interests, for security and error monitoring.</li>
            <li>Article 6(1)(a), consent, for optional PostHog product analytics.</li>
          </ul>
        </section>

        <section aria-labelledby="processors-heading" className="mt-10 space-y-3">
          <h2 id="processors-heading" className="text-2xl font-semibold tracking-tight">
            Processors and transfers
          </h2>
          <p className="leading-7 text-muted-foreground">
            We use these providers only for the services listed:
          </p>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>Vercel for hosting and application delivery</li>
            <li>Neon for Postgres data storage</li>
            <li>Clerk for accounts and authentication</li>
            <li>Stripe for payments and hosted checkout</li>
            <li>Resend for transactional order emails</li>
            <li>PostHog for consent-only product analytics</li>
            <li>Sentry for error diagnostics</li>
          </ul>
          <p className="leading-7 text-muted-foreground">
            Where a provider processes personal data outside the European Economic Area,
            international transfers are covered by Standard Contractual Clauses where required.
          </p>
        </section>

        <section aria-labelledby="retention-heading" className="mt-10 space-y-3">
          <h2 id="retention-heading" className="text-2xl font-semibold tracking-tight">
            Retention
          </h2>
          <p className="leading-7 text-muted-foreground">
            Order records are kept for applicable statutory accounting periods. Optional analytics
            is tied to your consent and is no longer collected after you withdraw it; PostHog data is
            retained according to the configured analytics retention period.
          </p>
        </section>

        <section aria-labelledby="rights-heading" className="mt-10 space-y-3">
          <h2 id="rights-heading" className="text-2xl font-semibold tracking-tight">
            Your rights
          </h2>
          <p className="leading-7 text-muted-foreground">
            Subject to applicable law, you may request access, rectification, erasure, restriction,
            or portability of your personal data, and you may object to processing based on
            legitimate interests. You can withdraw analytics consent at any time on the{" "}
            <Link
              href="/cookies"
              className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              cookies page
            </Link>
            . You also have the right to lodge a complaint with your national data protection
            supervisory authority.
          </p>
        </section>

        <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
          Last updated: 10 September 2026
        </p>
      </main>
    </div>
  );
}
