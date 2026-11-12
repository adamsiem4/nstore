import { SignIn } from "@clerk/nextjs";

// Clerk reads the URL while rendering its form; this page is allowed to wait for it.
export const instant = false;

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
