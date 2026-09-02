import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          nstore
        </Link>
        <nav className="flex items-center gap-2 text-sm text-zinc-600 sm:gap-4">
          <Link href="/products" className="hidden hover:text-zinc-900 sm:inline">
            Shop
          </Link>
          <Show when="signed-out">
            <Link href="/sign-in" className="hover:text-zinc-900">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-zinc-900 px-4 py-2 text-white"
            >
              Sign up
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/account" className="hover:text-zinc-900">
              Account
            </Link>
            <UserButton />
          </Show>
          {/* ponytail: no cart yet — a span, not a dead link */}
          <span className="hidden rounded-full bg-zinc-900 px-4 py-2 text-white sm:inline-flex">
            Cart (0)
          </span>
        </nav>
      </div>
    </header>
  );
}
