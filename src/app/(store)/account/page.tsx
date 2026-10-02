import { SignOutButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { HouseIcon, LogOutIcon, PackageIcon, ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Account" };

// ponytail: the hub as data — every card is the same icon, title link and
// list of sub-links, so one map draws them.
const sections = [
  {
    title: "Your orders",
    href: "/orders",
    icon: PackageIcon,
    links: [
      { label: "Order history", href: "/orders" },
      { label: "Returns & refunds", href: "/customer-service#returns" },
      { label: "Delivery costs & countries", href: "/customer-service#shipping" },
    ],
  },
  {
    title: "Login & security",
    href: "/account/profile",
    icon: ShieldCheckIcon,
    links: [
      { label: "Name, email & phone", href: "/account/profile" },
      { label: "Password & signed-in devices", href: "/account/profile/security" },
    ],
  },
  {
    title: "Your addresses",
    href: "/account/addresses",
    icon: HouseIcon,
    links: [
      { label: "Add a new address", href: "/account/addresses/new" },
      { label: "Edit, remove or set default", href: "/account/addresses" },
    ],
  },
];

const cardClass = "flex h-full gap-4 rounded-xl border p-5";
const iconClass = "flex size-12 shrink-0 items-center justify-center rounded-full bg-muted [&_svg]:size-6";

// ponytail: a page instead of Clerk's popover — inside the mobile menu the
// popover stacked a third card over the drawer.
export default async function AccountPage() {
  await auth.protect();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your account</h1>
      {(user?.fullName || email) && (
        <p className="mt-3 truncate text-lg text-muted-foreground">{user?.fullName ?? email}</p>
      )}

      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map(({ title, href, icon: Icon, links }) => (
          <li key={title} className={cardClass}>
            <span className={iconClass}>
              <Icon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                <Link
                  href={href}
                  className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  {title}
                </Link>
              </h2>
              <ul className="mt-1 text-sm text-muted-foreground">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-8 items-center rounded-sm underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
        <li>
          <SignOutButton>
            <button
              type="button"
              className={cn(cardClass, "w-full text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-foreground")}
            >
              <span className={iconClass}>
                <LogOutIcon aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold">Sign out</span>
                {email && <span className="mt-1 block truncate text-sm text-muted-foreground">{email}</span>}
              </span>
            </button>
          </SignOutButton>
        </li>
      </ul>
    </div>
  );
}
