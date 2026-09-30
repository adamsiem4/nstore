"use client";

import posthog, { type Properties } from "posthog-js";
import { useEffect } from "react";

/** Lets a Server Component record one PostHog event when its page mounts. */
export function CaptureEvent({
  event,
  properties,
  uuid,
}: {
  event: string;
  properties: Properties;
  uuid?: string;
}) {
  useEffect(() => {
    posthog.capture(event, properties, { uuid });
  }, [event, properties, uuid]);

  return null;
}
