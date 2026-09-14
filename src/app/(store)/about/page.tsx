import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About us",
  description: "Meet nstore: home appliances and household goods for a little better, every day.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 outline-none">
        <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          About us
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          A little better, every day.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Home is made of everyday moments. The first coffee, a shared meal, fresh laundry,
          a corner finally put in order. nstore is a place to find the useful things that
          make those moments feel a little easier.
        </p>

        <section aria-labelledby="store-heading" className="mt-10 space-y-3">
          <h2 id="store-heading" className="text-2xl font-semibold tracking-tight">
            Essentials for the way you live
          </h2>
          <p className="leading-7 text-muted-foreground">
            We bring together home appliances and household goods across kitchen appliances,
            cookware, cleaning, laundry, storage, and home comfort. From preparing dinner to
            making room for the things you love, our focus is on the practical side of home.
          </p>
          <p className="leading-7 text-muted-foreground">
            We believe useful can look good, and shopping for your home should feel as calm
            as the space you want to create. Not more things for the sake of it. The right
            things for your routine.
          </p>
        </section>

        <section aria-labelledby="approach-heading" className="mt-10 space-y-3">
          <h2 id="approach-heading" className="text-2xl font-semibold tracking-tight">
            A store with a simple idea
          </h2>
          <p className="leading-7 text-muted-foreground">
            nstore is built around straightforward browsing, clear product information, and
            an easy path from finding an essential to adding it to your basket. Our ambition
            is to make choosing for your home less of a task and more of a small pleasure.
          </p>
          <Link
            href="/mission"
            className="inline-flex min-h-11 items-center rounded-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            Read our mission
          </Link>
        </section>
      </main>
    </div>
  );
}
