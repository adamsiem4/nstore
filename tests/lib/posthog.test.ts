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
// Like the real one it starts opted out, and opting in sends an event of its own.
const sdk = Promise.withResolvers<void>();
const optedOut = Promise.withResolvers<void>();
let capturing = false;
const sent: string[] = [];
mock.module("posthog-js", async () => {
  await sdk.promise;
  return {
    default: {
      init() {},
      has_opted_in_capturing: () => capturing,
      opt_in_capturing() {
        capturing = true;
        sent.push("$opt_in");
      },
      opt_out_capturing() {
        capturing = false;
        optedOut.resolve();
      },
    },
  };
});

// Load after the token, globals and mock are in place.
const { startPostHog, withPostHog } = await import("@/lib/posthog");

/** Resolves once everything queued on the SDK so far has run; consent must be granted. */
function settled() {
  const done = Promise.withResolvers<void>();
  withPostHog(() => done.resolve());
  return done.promise;
}

test("nothing runs or is sent for a visitor who declines while PostHog downloads; accepting later turns capture on", async () => {
  const ran: string[] = [];
  startPostHog();

  setConsent("granted");
  withPostHog(() => ran.push("queued, then declined"));
  setConsent("denied");
  sdk.resolve();
  // The opt-out was queued after the work above, so by now that work has had its turn.
  await optedOut.promise;
  assert.equal(ran.length, 0, "queued work is dropped");
  assert.equal(sent.length, 0, "the SDK never opted in, so not even its opt-in event went out");
  assert.equal(capturing, false);

  // The gate is consent, not a broken loader: accepting again lets work through.
  setConsent("granted");
  withPostHog(() => ran.push("accepted"));
  await settled();
  assert.deepEqual(ran, ["accepted"]);
  assert.equal(capturing, true);
  assert.deepEqual(sent, ["$opt_in"], "one opt-in, however many callers");

  // Reject and accept again without a reload: the SDK is already loaded and must be switched back on.
  setConsent("denied");
  setConsent("granted");
  await settled();
  assert.equal(capturing, true, "capture resumes in the same session");
  assert.deepEqual(sent, ["$opt_in", "$opt_in"]);
});
