import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          nstore
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-600">
          <Link href="/products" className="hover:text-zinc-900">
            Shop
          </Link>
          {/* ponytail: no cart yet — a span, not a dead link */}
          <span className="rounded-full bg-zinc-900 px-4 py-2 text-white">
            Cart (0)
          </span>
        </nav>
      </div>
    </header>
  );
}
