import Link from "next/link";
import { ThemePicker } from "@/components/theme-picker";

const columns = [
  {
    heading: "About",
    links: [
      { href: "/about", label: "About us" },
      { href: "/mission", label: "Mission" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
  { heading: "FAQ", links: [] },
] satisfies { heading: string; links: { href: string; label: string }[] }[];

const linkClass =
  "inline-flex min-h-11 items-center rounded-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-card sm:min-h-8";

/** Column nav, wordmark, and copyright shown below every store route. */
export function SiteFooter() {
  return (
    <footer className="rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map(({ heading, links }) => (
          <nav key={heading} aria-labelledby={`footer-${heading.toLowerCase()}`}>
            <h2
              id={`footer-${heading.toLowerCase()}`}
              className="text-xs font-semibold tracking-[0.14em] uppercase"
            >
              {heading}
            </h2>
            {links.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Coming soon.</p>
            ) : (
              <ul className="mt-1 text-sm">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className={linkClass}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        ))}

        <section aria-labelledby="footer-appearance">
          <h2
            id="footer-appearance"
            className="text-xs font-semibold tracking-[0.14em] uppercase"
          >
            Appearance
          </h2>
          <div className="mt-3">
            <ThemePicker />
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1 border-t pt-6 text-sm sm:mt-10">
        <span className="font-semibold tracking-tight">nstore</span>
        <p className="text-muted-foreground">A little better, every day.</p>
        <p className="text-muted-foreground sm:ml-auto">
          © {new Date().getFullYear()} nstore. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
