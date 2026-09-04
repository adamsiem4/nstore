import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/header";

export default async function AccountPage() {
  await auth.protect();

  return (
    <div className="flex flex-col gap-3 rounded-[2rem] bg-muted/50 p-3 sm:rounded-[2.5rem] sm:p-4">
      <SiteHeader />
      <div className="flex justify-center rounded-[1.75rem] bg-card p-6 sm:p-10">
        <UserProfile />
      </div>
    </div>
  );
}
