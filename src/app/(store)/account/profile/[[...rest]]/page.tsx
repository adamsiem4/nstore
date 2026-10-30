import { UserProfile } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PhoneForm } from "@/components/account/phone-form";
import { AccountShell } from "@/components/layout/account-shell";

// ponytail: Clerk keeps the forms (name, avatar, email, password, sessions,
// delete account); we strip its card and navbar so it reads as our page. The
// /account list replaces the navbar: /account/profile and
// /account/profile/security. Name fields only render when enabled in Clerk
// Dashboard > User & authentication. Phone is ours: Clerk's needs paid SMS.
const flat = { background: "transparent", border: "none", borderRadius: 0, boxShadow: "none" };

export default async function AccountProfilePage(props: PageProps<"/account/profile/[[...rest]]">) {
  await auth.protect();
  const { rest } = await props.params;
  const user = rest ? null : await currentUser();
  const phone = user?.privateMetadata.phone;

  return (
    <AccountShell>
      <UserProfile
        appearance={{
          variables: { fontSize: "0.9375rem" },
          elements: {
            rootBox: { width: "100%" },
            // !important: Clerk's own mobile media queries outrank plain overrides.
            // overflow: focus rings on the rows' right edge reach past the card.
            cardBox: { ...flat, width: "100%", maxWidth: "none", height: "auto !important", display: "block !important", overflow: "visible !important" },
            navbar: { display: "none !important" },
            navbarMobileMenuRow: { display: "none !important" },
            scrollBox: { ...flat, margin: 0, overflow: "visible !important" },
            // The card sizes to its content, so nothing needs to scroll inside it. Without
            // this, Clerk's form transitions flash a scrollbar and its gutter narrows the rows.
            pageScrollBox: { padding: 0, overflow: "visible clip !important", scrollbarGutter: "auto !important" },
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
            // A closing form fades at full height while its row shrinks; keep it inside the row.
            // The margin leaves room for focus rings. Not padding: Clerk centres the Profile
            // label from this box's height, so padding moves it.
            profileSectionContent: { overflow: "clip", overflowClipMargin: "6px" },
            // Forms open inside the row, lined up with its text, instead of in a box.
            actionCard: { ...flat, padding: "0.25rem 0 0.25rem 0.625rem" },
            // A verified primary email's only menu action is Remove; Clerk has no per-email switch.
            profileSectionItem__emailAddresses: {
              "&:has([data-localization-key='badge__primary']):not(:has([data-localization-key='badge__unverified'])) .cl-menuButton":
                { display: "none" },
            },
            footer: { background: "transparent" },
          },
        }}
      />
      {!rest && <PhoneForm phone={typeof phone === "string" ? phone : ""} />}
    </AccountShell>
  );
}
