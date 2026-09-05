import type { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  // ponytail: 8/12px gutter — wide enough that the panel reads as its own
  // surface instead of hugging the browser frame
  return <div className="w-full p-2 sm:p-3">{children}</div>;
}
