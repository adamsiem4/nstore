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
    } else {
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
