"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { withPostHog } from "@/lib/posthog";

export function PostHogIdentity() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    withPostHog((posthog) => {
      if (isSignedIn) {
        posthog.identify(user.id);
      } else if (posthog._isIdentified()) {
        // Only on sign-out: resetting every anonymous page load would split a
        // guest into a new person after each full reload, e.g. the Stripe return.
        posthog.reset();
      }
    });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
