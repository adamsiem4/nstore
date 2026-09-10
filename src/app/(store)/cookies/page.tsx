import type { Metadata } from "next";
import { CookiePreferences } from "@/components/consent/cookie-preferences";
import { SiteHeader } from "@/components/layout/header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How nstore uses necessary storage and optional PostHog analytics.",
};

export default function CookiesPage() {
  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <a
        href="#cookies-content"
        className="sr-only z-50 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-offset-4 focus:outline-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <Separator className="my-6 sm:my-8" />

      <main id="cookies-content" tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 outline-none">
        <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Cookie Policy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Cookies and local storage
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
          nstore uses cookies and browser local storage to keep the shop, sign-in, basket, and theme
          working. Product analytics is optional: PostHog may store analytics data only after you
          accept it.
        </p>

        <CookiePreferences />

        <section aria-labelledby="storage-heading" className="mt-10">
          <h2 id="storage-heading" className="text-2xl font-semibold tracking-tight">
            What we store
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <caption className="sr-only">Cookies and local storage used by nstore</caption>
              <thead className="bg-muted/60">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Purpose</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Retention</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-t">
                  <th scope="row" className="px-4 py-4 font-mono font-medium">cart</th>
                  <td className="px-4 py-4 text-muted-foreground">Stores product IDs and quantities so your basket works between pages.</td>
                  <td className="px-4 py-4 text-muted-foreground">Strictly necessary first-party cookie</td>
                  <td className="px-4 py-4 text-muted-foreground">30 days</td>
                </tr>
                <tr className="border-t">
                  <th scope="row" className="px-4 py-4 font-mono font-medium">__session, __client_uat</th>
                  <td className="px-4 py-4 text-muted-foreground">Maintain and refresh your Clerk sign-in session.</td>
                  <td className="px-4 py-4 text-muted-foreground">Strictly necessary first-party cookies</td>
                  <td className="px-4 py-4 text-muted-foreground">Managed by Clerk according to the configured session lifetime</td>
                </tr>
                <tr className="border-t">
                  <th scope="row" className="px-4 py-4 font-mono font-medium">theme</th>
                  <td className="px-4 py-4 text-muted-foreground">Remembers your light, dark, or system appearance preference.</td>
                  <td className="px-4 py-4 text-muted-foreground">Strictly necessary first-party local storage</td>
                  <td className="px-4 py-4 text-muted-foreground">Until you change it or clear browser storage</td>
                </tr>
                <tr className="border-t">
                  <th scope="row" className="px-4 py-4 font-mono font-medium">cookie-consent</th>
                  <td className="px-4 py-4 text-muted-foreground">Remembers the analytics choice you make on this page or the consent banner.</td>
                  <td className="px-4 py-4 text-muted-foreground">Strictly necessary first-party local storage</td>
                  <td className="px-4 py-4 text-muted-foreground">Until you clear your choice or browser storage</td>
                </tr>
                <tr className="border-t">
                  <th scope="row" className="px-4 py-4 font-mono font-medium">ph_* and PostHog local storage entries</th>
                  <td className="px-4 py-4 text-muted-foreground">Measure product usage to help improve nstore, only after you accept analytics.</td>
                  <td className="px-4 py-4 text-muted-foreground">Optional first-party analytics cookies and local storage; consent required</td>
                  <td className="px-4 py-4 text-muted-foreground">Until consent is withdrawn or the configured PostHog retention period ends</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="stripe-cookies-heading" className="mt-10 space-y-3">
          <h2 id="stripe-cookies-heading" className="text-2xl font-semibold tracking-tight">
            Stripe Checkout
          </h2>
          <p className="leading-7 text-muted-foreground">
            Payment takes place on Stripe Checkout, hosted on stripe.com. Stripe sets its own
            cookies there during payment under Stripe&apos;s cookie information; those are not
            nstore first-party cookies.
          </p>
        </section>
      </main>
    </div>
  );
}
