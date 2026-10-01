"use client";

import { UserButton } from "@clerk/nextjs";
import { PackageIcon } from "lucide-react";

// Client-only: UserButton's compound children can't be dotted into from a server component.
export function AccountButton() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link label="My orders" href="/orders" labelIcon={<PackageIcon className="size-4" />} />
      </UserButton.MenuItems>
    </UserButton>
  );
}
