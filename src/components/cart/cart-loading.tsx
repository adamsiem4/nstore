import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

export function CartLoading() {
  return (
    <LoadingRegion label="Loading cart" className="-m-2 flex flex-1 flex-col sm:m-0">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">My cart</h1>
      <div className="mt-6 flex min-h-64 flex-1 items-center justify-center rounded-xl border border-dashed">
        <div className="w-full max-w-sm space-y-4 p-6">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </LoadingRegion>
  );
}
