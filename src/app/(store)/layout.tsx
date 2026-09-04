import type { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[100rem] p-3 sm:p-4">{children}</div>
  );
}
