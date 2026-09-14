import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mission",
  description: "What we want to build at nstore: a simpler, more thoughtful way to shop for your home.",
};

export default function MissionPage() {
  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 outline-none">
        <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Mission
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Less effort. More feeling at home.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          We want to build a store that makes everyday living easier, starting with how you
          shop. A place where useful products, clear choices, and thoughtful design come
          together without getting in your way.
        </p>

        <section aria-labelledby="useful-heading" className="mt-10 space-y-3">
          <h2 id="useful-heading" className="text-2xl font-semibold tracking-tight">
            Start with what matters
          </h2>
          <p className="leading-7 text-muted-foreground">
            A good essential earns its place in your home. We want to focus on things that
            serve a real purpose: helping you cook, clean, organise, and get comfortable.
            Our goal is a considered selection, not an endless list of things you do not need.
          </p>
        </section>

        <section aria-labelledby="simple-heading" className="mt-10 space-y-3">
          <h2 id="simple-heading" className="text-2xl font-semibold tracking-tight">
            Make choosing simpler
          </h2>
          <p className="leading-7 text-muted-foreground">
            We want every step to be understandable, from exploring a category to checking
            out. That means helpful descriptions, prices that are easy to find, and a store
            that feels good to use on a phone or a larger screen.
          </p>
        </section>

        <section aria-labelledby="trust-heading" className="mt-10 space-y-3">
          <h2 id="trust-heading" className="text-2xl font-semibold tracking-tight">
            Build trust into the details
          </h2>
          <p className="leading-7 text-muted-foreground">
            Our aim is an experience that respects your time and your choices. Clear
            information, accessible design, and control over optional analytics are part
            of that direction. As nstore grows, we want to improve the essentials rather
            than add noise.
          </p>
        </section>

        <p className="mt-10 border-t pt-6 text-lg font-medium">
          A better store for the everyday. A little better, every day.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-flex min-h-11 items-center rounded-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          Explore the essentials
        </Link>
      </main>
    </div>
  );
}
