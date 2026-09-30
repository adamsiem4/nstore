"use client";

import posthog, { type Properties } from "posthog-js";
import { useEffect } from "react";

/**
 * Lets a Server Component record one PostHog event when its page mounts.
 * Keyed by value: a router refresh re-sends equal props as a new object.
 */
export function CaptureEvent({
  event,
  properties,
  uuid,
}: {
  event: string;
  properties: Properties;
  uuid?: string;
}) {
  const payload = JSON.stringify(properties);

  useEffect(() => {
    posthog.capture(event, JSON.parse(payload), { uuid });
  }, [event, payload, uuid]);

  return null;
}
