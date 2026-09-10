import Link from "next/link";

const legalLinkClass =
  "inline-flex min-h-11 items-center rounded-lg px-2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background";

/** Store wordmark, tagline, and legal links shown on every store route. */
export function SiteFooter() {
  return (
    <footer className="flex min-h-11 flex-wrap items-center gap-x-6 px-2 text-sm sm:px-4">
      <span className="font-semibold tracking-tight">nstore</span>
      <p className="text-muted-foreground">A little better, every day.</p>
      <nav aria-label="Legal" className="ml-auto">
        <ul className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/privacy" className={legalLinkClass}>
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/cookies" className={legalLinkClass}>
              Cookie settings
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
