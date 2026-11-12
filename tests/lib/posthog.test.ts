import assert from "node:assert/strict";
import { mock, test } from "bun:test";
import { setConsent } from "@/lib/consent";

// Read once when the module loads, so it has to be set before the import below.
process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test";

// The two browser globals consent lives on: one localStorage key and one window event.
const stored = new Map<string, string>();
Object.assign(globalThis, {
  window: new EventTarget(),
  localStorage: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  },
});

// The real SDK is a separate chunk that takes a moment to download; `sdk.resolve()` is its arrival.
const sdk = Promise.withResolvers<void>();
const optedOut = Promise.withResolvers<void>();
mock.module("posthog-js", async () => {
  await sdk.promise;
  return { default: { init() {}, opt_in_capturing() {}, opt_out_capturing: optedOut.resolve } };
});

// Load after the token, globals and mock are in place.
const { startPostHog, withPostHog } = await import("@/lib/posthog");

test("work queued while PostHog downloads is dropped when consent is withdrawn before it arrives", async () => {
  const ran: string[] = [];
  startPostHog();

  setConsent("granted");
  withPostHog(() => ran.push("queued, then declined"));
  setConsent("denied");
  sdk.resolve();
  // The opt-out was queued after the work above, so by now that work has had its turn.
  await optedOut.promise;
  assert.equal(ran.length, 0);

  // The gate is consent, not a broken loader: accepting again lets work through.
  setConsent("granted");
  const accepted = Promise.withResolvers<void>();
  withPostHog(() => {
    ran.push("accepted");
    accepted.resolve();
  });
  await accepted.promise;
  assert.deepEqual(ran, ["accepted"]);
});
