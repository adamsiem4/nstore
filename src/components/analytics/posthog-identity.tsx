"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

export function PostHogIdentity() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;

    if (isSignedIn) {
      posthog.identify(user.id);
    } else if (posthog._isIdentified()) {
      // Only on sign-out: resetting every anonymous page load would split a
      // guest into a new person after each full reload, e.g. the Stripe return.
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
