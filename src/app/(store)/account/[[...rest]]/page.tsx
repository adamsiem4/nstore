import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function AccountPage() {
  await auth.protect();

  return (
    <div className="flex flex-1 justify-center">
      <UserProfile />
    </div>
  );
}
