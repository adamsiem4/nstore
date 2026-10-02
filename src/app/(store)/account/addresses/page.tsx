import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { ChevronLeftIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <Link
        href="/account"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-lg pr-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
        Account
      </Link>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your addresses</h1>
      <p className="mt-3 text-muted-foreground">Checkout fills in your default address for you.</p>

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
    </div>
  );
}
