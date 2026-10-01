"use client";

import { UserButton } from "@clerk/nextjs";
import { PackageIcon } from "lucide-react";

// Client-only: UserButton's compound children can't be dotted into from a server component.
export function AccountButton() {
  return (
    // "Manage account" goes to our /account page instead of Clerk's modal.
    <UserButton userProfileMode="navigation" userProfileUrl="/account">
      <UserButton.MenuItems>
        <UserButton.Link label="My orders" href="/orders" labelIcon={<PackageIcon className="size-4" />} />
      </UserButton.MenuItems>
    </UserButton>
  );
}
