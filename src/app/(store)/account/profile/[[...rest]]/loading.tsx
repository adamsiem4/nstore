import { AccountShell } from "@/components/layout/account-shell";
import { LoadingRegion } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading profile" className="flex flex-1 flex-col">
      <AccountShell>{null}</AccountShell>
    </LoadingRegion>
  );
}
