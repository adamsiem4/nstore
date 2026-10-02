import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { PillButton, pillButtonVariants } from "@/components/ui/pill-button";
import { SHIPPING_COUNTRIES } from "@/lib/cart";
import { saveAddress } from "@/server/addresses";
import { getDb } from "@/server/db";
import { addresses } from "@/server/db/schema";

const region = new Intl.DisplayNames("en", { type: "region" });
const countries = SHIPPING_COUNTRIES.map((code) => ({ code, name: region.of(code) ?? code })).sort((a, b) =>
  a.name.localeCompare(b.name),
);

const labelClass = "grid gap-1.5 text-sm font-medium";
const fieldClass = "h-11 px-3";

export async function generateMetadata(props: PageProps<"/account/addresses/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: id === "new" ? "Add address" : "Edit address" };
}

// ponytail: one route for both — /account/addresses/new adds, an id edits.
export default async function AddressFormPage(props: PageProps<"/account/addresses/[id]">) {
  const { userId } = await auth.protect();
  const { id } = await props.params;
  const saved = await getDb().select().from(addresses).where(eq(addresses.clerkUserId, userId));
  const address = saved.find((entry) => entry.id === id);
  if (id !== "new" && !address) notFound();
  // A first address becomes the default unless the box is cleared.
  const isDefault = address ? address.isDefault : !saved.some((entry) => entry.isDefault);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <Link
        href="/account/addresses"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-lg pr-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
        Your addresses
      </Link>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {address ? "Edit address" : "Add address"}
      </h1>

      <form action={saveAddress} className="mt-8 grid gap-5">
        {address && <input type="hidden" name="id" value={address.id} />}
        <label className={labelClass}>
          Country
          <select
            name="country"
            required
            autoComplete="country"
            defaultValue={address?.country ?? ""}
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          >
            <option value="" disabled>
              Select a country
            </option>
            {countries.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Full name
          <Input name="name" required maxLength={100} autoComplete="name" defaultValue={address?.name} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Address
          <Input
            name="line1"
            required
            maxLength={100}
            autoComplete="address-line1"
            placeholder="Street and house number"
            defaultValue={address?.line1}
            className={fieldClass}
          />
        </label>
        <Input
          name="line2"
          maxLength={100}
          autoComplete="address-line2"
          placeholder="Apartment, floor, building (optional)"
          aria-label="Address line 2"
          defaultValue={address?.line2 ?? undefined}
          className={fieldClass}
        />
        <div className="grid gap-5 sm:grid-cols-[2fr_3fr]">
          <label className={labelClass}>
            Postal code
            <Input
              name="postalCode"
              required
              maxLength={20}
              autoComplete="postal-code"
              defaultValue={address?.postalCode}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            City
            <Input
              name="city"
              required
              maxLength={100}
              autoComplete="address-level2"
              defaultValue={address?.city}
              className={fieldClass}
            />
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="isDefault" defaultChecked={isDefault} className="size-4 accent-foreground" />
          Make this my default address
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <PillButton type="submit" className="h-12 px-8 text-base">
            {address ? "Save changes" : "Add address"}
          </PillButton>
          <Link href="/account/addresses" className={pillButtonVariants({ variant: "ghost", className: "h-12 px-6 text-base" })}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
