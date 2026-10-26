import type { ReactNode } from "react";
import { AccountShell } from "@/components/layout/account-shell";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

const cardSkeletons = [
  { key: "orders", lines: 1 },
  { key: "security", lines: 2 },
  { key: "addresses", lines: 2 },
  { key: "sign-out", lines: 1 },
];

function OrderItemSkeleton() {
  return (
    <li className="flex items-center gap-4 py-4">
      <Skeleton className="size-20 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32 max-w-full" />
          <Skeleton className="mt-2 h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-16 shrink-0" />
      </div>
    </li>
  );
}

function OrderCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted px-5 py-3">
        <div className="flex gap-x-8">
          <div>
            <Skeleton className="h-3 w-14" />
            <Skeleton className="mt-1 h-5 w-20" />
          </div>
          <div>
            <Skeleton className="h-3 w-10" />
            <Skeleton className="mt-1 h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <ul className="divide-y px-5">
        <OrderItemSkeleton />
        <OrderItemSkeleton />
      </ul>
    </li>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <h2 className="bg-muted px-5 py-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function SkeletonField({ labelWidth = "w-20" }: { labelWidth?: string }) {
  return (
    <div className="grid gap-1.5">
      <Skeleton className={`h-5 ${labelWidth}`} />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

export function AccountHubSkeleton() {
  return (
    <LoadingRegion label="Loading account" className="flex flex-1 flex-col">
      <AccountShell back={null} title="Your account">
        <Skeleton className="mt-3 h-7 w-48 max-w-full" />
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cardSkeletons.map(({ key, lines }) => (
            <li key={key} className="flex h-full gap-4 rounded-xl border p-5">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-7 w-32 max-w-full" />
                <div className="mt-1">
                  {Array.from({ length: lines }, (_, index) => (
                    <div key={index} className="flex min-h-8 items-center">
                      <Skeleton className="h-4 w-40 max-w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </AccountShell>
    </LoadingRegion>
  );
}

export function AddressesSkeleton() {
  return (
    <LoadingRegion label="Loading addresses" className="flex flex-1 flex-col">
      <AccountShell title="Your addresses" description="Checkout fills in your default address for you.">
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <li>
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          </li>
          {["first", "second"].map((key) => (
            <li key={key} className="flex min-h-48 flex-col rounded-xl border p-5">
              <Skeleton className="h-5 w-28" />
              <div className="mt-2 grid gap-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-4 w-52 max-w-full" />
                <Skeleton className="h-4 w-32 max-w-full" />
              </div>
              <div className="mt-auto flex gap-4 pt-4">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-5 w-16" />
              </div>
            </li>
          ))}
        </ul>
      </AccountShell>
    </LoadingRegion>
  );
}

export function AddressFormSkeleton() {
  return (
    <LoadingRegion label="Loading address" className="flex flex-1 flex-col">
      <AccountShell back={{ href: "/account/addresses", label: "Your addresses" }}>
        <Skeleton className="h-10 w-48 sm:h-12 sm:w-60" />
        <div className="mt-8 grid max-w-lg gap-5">
          <SkeletonField labelWidth="w-16" />
          <SkeletonField labelWidth="w-20" />
          <SkeletonField labelWidth="w-16" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <div className="grid gap-5 sm:grid-cols-[2fr_3fr]">
            <SkeletonField labelWidth="w-24" />
            <SkeletonField labelWidth="w-10" />
          </div>
          <div className="flex min-h-11 items-center gap-3">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-12 w-36 rounded-full" />
            <Skeleton className="h-12 w-24 rounded-full" />
          </div>
        </div>
      </AccountShell>
    </LoadingRegion>
  );
}

export function OrdersSkeleton() {
  return (
    <LoadingRegion label="Loading orders" className="flex flex-1 flex-col">
      <AccountShell title="Your orders">
        <Skeleton className="mt-8 h-12 w-full rounded-full" />
        <ol className="mt-8 flex flex-col gap-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </ol>
      </AccountShell>
    </LoadingRegion>
  );
}

export function OrderDetailSkeleton() {
  return (
    <LoadingRegion label="Loading order details" className="flex flex-1 flex-col">
      <AccountShell back={{ href: "/orders", label: "Your orders" }}>
        <Skeleton className="h-10 w-64 max-w-full sm:h-12" />
        <div className="mt-2 flex items-center gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="mt-8 grid gap-6">
          <DetailSection title="Items">
            <ul className="divide-y px-5">
              <OrderItemSkeleton />
              <OrderItemSkeleton />
            </ul>
            <div className="grid gap-2 border-t px-5 py-4">
              {["subtotal", "shipping", "tax"].map((key) => (
                <div key={key} className="flex justify-between gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
              <div className="mt-1 flex justify-between gap-4 border-t pt-3">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </DetailSection>

          <div className="grid gap-6 sm:grid-cols-2">
            <DetailSection title="Shipping address">
              <div className="grid gap-2 px-5 py-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
            </DetailSection>
            <DetailSection title="Payment">
              <div className="grid gap-2 px-5 py-4">
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-5 w-10" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-36 max-w-full" />
                </div>
              </div>
            </DetailSection>
          </div>

          <DetailSection title="Returns">
            <div className="border-t px-5 py-4">
              <Skeleton className="h-10 w-40 rounded-full" />
            </div>
          </DetailSection>
        </div>
      </AccountShell>
    </LoadingRegion>
  );
}

export function CheckoutSuccessSkeleton() {
  return (
    <LoadingRegion label="Validating order" className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10 text-center">
        <Skeleton className="mx-auto h-5 w-28" />
        <Skeleton className="mx-auto mt-3 h-10 w-4/5 sm:h-12" />
        <Skeleton className="mx-auto mt-4 h-7 w-3/5" />
        <ul className="mt-8 flex flex-col gap-2">
          {["first", "second", "shipping"].map((key) => (
            <li key={key} className="flex items-center justify-between gap-4 border-b pb-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-16 shrink-0" />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Skeleton className="h-12 w-44 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
      </div>
    </LoadingRegion>
  );
}
