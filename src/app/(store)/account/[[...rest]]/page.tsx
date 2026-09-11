import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function AccountPage() {
  await auth.protect();

  return (
    <main id="content" tabIndex={-1} className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <div className="flex flex-1 justify-center">
        <UserProfile />
      </div>
    </main>
  );
}
