import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-3 text-zinc-600">
        That page or product doesn&apos;t exist.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-zinc-900 px-8 font-medium text-white hover:bg-zinc-700"
      >
        Back to shop
      </Link>
    </div>
  );
}
