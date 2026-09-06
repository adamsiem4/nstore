import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/header";
import { Separator } from "@/components/ui/separator";

export default async function AccountPage() {
  await auth.protect();

  return (
    <main className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <SiteHeader />
      <Separator className="my-6 sm:my-8" />
      <div className="flex flex-1 justify-center">
        <UserProfile />
      </div>
    </main>
  );
}
