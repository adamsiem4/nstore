import { SignOutButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { HouseIcon, LogOutIcon, PackageIcon, ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/layout/account-shell";

export const metadata: Metadata = { title: "Account" };

// ponytail: the hub as data — every card is an icon, a plain title and its
// links; only the links are clickable, so one map draws them all.
const sections = [
  {
    title: "Your orders",
    icon: PackageIcon,
    links: [{ label: "Order history", href: "/orders" }],
  },
  {
    title: "Login & security",
    icon: ShieldCheckIcon,
    links: [
      { label: "Name, email & phone", href: "/account/profile" },
      { label: "Password & signed-in devices", href: "/account/profile/security" },
    ],
  },
  {
    title: "Your addresses",
    icon: HouseIcon,
    links: [
      { label: "Add a new address", href: "/account/addresses/new" },
      { label: "Edit, remove or set default", href: "/account/addresses" },
    ],
  },
];

const linkClass =
  "inline-flex min-h-8 items-center rounded-sm text-left underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-foreground";

function Card({ title, icon: Icon, children }: { title: string; icon: typeof PackageIcon; children: ReactNode }) {
  return (
    <li className="flex h-full gap-4 rounded-xl border p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted [&_svg]:size-6">
        <Icon aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ul className="mt-1 text-sm text-muted-foreground">{children}</ul>
      </div>
    </li>
  );
}

// ponytail: a page instead of Clerk's popover — inside the mobile menu the
// popover stacked a third card over the drawer.
export default async function AccountPage() {
  await auth.protect();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <AccountShell back={null} title="Your account" description={user?.fullName || email}>
      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map(({ title, icon, links }) => (
          <Card key={title} title={title} icon={icon}>
            {links.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </Card>
        ))}
        <Card title="Sign out" icon={LogOutIcon}>
          <li>
            <SignOutButton>
              <button type="button" className={linkClass}>
                Sign out of this device
              </button>
            </SignOutButton>
          </li>
        </Card>
      </ul>
    </AccountShell>
  );
}
