import { SignOutButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ChevronRightIcon, LogOutIcon, PackageIcon, ShieldIcon, UserIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account" };

const rowClass =
  "flex min-h-14 w-full items-center gap-3 px-4 text-left outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset [&_svg]:size-5 [&_svg]:shrink-0";

// ponytail: a page instead of Clerk's popover — inside the mobile menu the
// popover stacked a third card over the drawer.
export default async function AccountPage() {
  await auth.protect();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Account</h1>
      {(user?.fullName || email) && (
        <p className="mt-3 truncate text-lg text-muted-foreground">{user?.fullName ?? email}</p>
      )}

      <ul className="mt-8 divide-y overflow-hidden rounded-xl bg-muted">
        <li>
          <Link href="/orders" className={rowClass}>
            <PackageIcon aria-hidden="true" />
            My orders
            <ChevronRightIcon aria-hidden="true" className="ml-auto text-muted-foreground" />
          </Link>
        </li>
      </ul>

      <h2 id="account-settings" className="mt-8 text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Account settings
      </h2>
      <ul aria-labelledby="account-settings" className="mt-3 divide-y overflow-hidden rounded-xl bg-muted">
        <li>
          <Link href="/account/profile" className={rowClass}>
            <UserIcon aria-hidden="true" />
            Profile
            <ChevronRightIcon aria-hidden="true" className="ml-auto text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link href="/account/profile/security" className={rowClass}>
            <ShieldIcon aria-hidden="true" />
            Security
            <ChevronRightIcon aria-hidden="true" className="ml-auto text-muted-foreground" />
          </Link>
        </li>
        <li>
          <SignOutButton>
            <button type="button" className={rowClass}>
              <LogOutIcon aria-hidden="true" />
              Sign out
            </button>
          </SignOutButton>
        </li>
      </ul>
    </div>
  );
}
