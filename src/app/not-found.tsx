import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-3 text-muted-foreground">
        That page or product doesn&apos;t exist.
      </p>
      <Link
        href="/products"
        className={buttonVariants({
          className: "mt-8 h-12 px-8 text-base",
        })}
      >
        Back to shop
      </Link>
    </div>
  );
}
