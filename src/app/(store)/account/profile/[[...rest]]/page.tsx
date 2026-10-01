import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

// ponytail: Clerk keeps the forms (name, avatar, email, phone, password,
// sessions, delete account); we strip its card and navbar so it reads as our
// page. The /account list replaces the navbar: /account/profile and
// /account/profile/security. Name and phone fields only render when enabled in
// Clerk Dashboard > User & authentication.
const flat = { background: "transparent", border: "none", borderRadius: 0, boxShadow: "none" };

export default async function AccountProfilePage() {
  await auth.protect();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <Link
        href="/account"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-lg pr-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
        Account
      </Link>
      <UserProfile
        appearance={{
          variables: { fontSize: "0.9375rem" },
          elements: {
            rootBox: { width: "100%" },
            // !important: Clerk's own mobile media queries outrank plain overrides.
            cardBox: { ...flat, width: "100%", maxWidth: "none", display: "block !important" },
            navbar: { display: "none !important" },
            navbarMobileMenuRow: { display: "none !important" },
            scrollBox: { ...flat, margin: 0 },
            pageScrollBox: { padding: 0 },
            profilePageContent: { padding: "1rem 0 0 !important" },
            // Only the page heading; inline forms reuse .cl-headerTitle.
            profilePage: {
              "& > .cl-header .cl-headerTitle": {
                fontSize: "2.25rem",
                lineHeight: 1.1,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                "@media (min-width: 640px)": { fontSize: "3rem" },
              },
            },
            // Profile is name, picture, email, phone — Google sign-in still works.
            profileSection__connectedAccounts: { display: "none" },
            footer: { background: "transparent" },
          },
        }}
      />
    </div>
  );
}
