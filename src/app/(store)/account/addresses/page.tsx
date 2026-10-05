import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/layout/account-shell";
import { Badge } from "@/components/ui/badge";
import { deleteAddress, setDefaultAddress } from "@/server/addresses";
import { getDb } from "@/server/db";
import { addresses } from "@/server/db/schema";

export const metadata: Metadata = { title: "Your addresses" };

const region = new Intl.DisplayNames("en", { type: "region" });

const actionClass =
  "rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-foreground";

export default async function AddressesPage() {
  const { userId } = await auth.protect();
  const saved = await getDb()
    .select()
    .from(addresses)
    .where(eq(addresses.clerkUserId, userId))
    .orderBy(desc(addresses.isDefault), addresses.createdAt);

  return (
    <AccountShell title="Your addresses" description="Checkout fills in your default address for you.">
      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/account/addresses/new"
            className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <PlusIcon aria-hidden="true" className="size-8" />
            <span className="font-semibold">Add address</span>
          </Link>
        </li>
        {saved.map((address) => {
          const label = <span className="sr-only">, {address.name}, {address.line1}</span>;
          return (
            <li key={address.id} className="flex min-h-48 flex-col rounded-xl border p-5">
              {address.isDefault && (
                <Badge variant="secondary" className="mb-3">
                  Default
                </Badge>
              )}
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">{address.name}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.postalCode} {address.city}
                </p>
                <p>{region.of(address.country)}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
                <Link href={`/account/addresses/${address.id}`} className={actionClass}>
                  Edit{label}
                </Link>
                {/* ponytail: removes without a confirm step; re-adding costs one form. */}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" className={actionClass}>
                    Remove{label}
                  </button>
                </form>
                {!address.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className={actionClass}>
                      Set as default{label}
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </AccountShell>
  );
}
