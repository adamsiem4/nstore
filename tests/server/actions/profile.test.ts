import assert from "node:assert/strict";
import { mock, test } from "bun:test";

let userId: string | null = "user_owner";
const writes: unknown[] = [];
mock.module("@clerk/nextjs/server", () => ({
  auth: { protect: async () => {
    if (!userId) throw new Error("Unauthenticated");
    return { userId };
  } },
  clerkClient: async () => ({ users: {
    updateUserMetadata: async (id: string, { privateMetadata }: { privateMetadata: unknown }) => {
      writes.push([id, privateMetadata]);
    },
  } }),
}));
mock.module("next/cache", () => ({ refresh: () => {} }));

function phoneForm(phone: string) {
  const form = new FormData();
  form.set("phone", phone);
  return form;
}

test("savePhone stores trimmed numbers for the signed-in user, clears on empty, and rejects bad input", async () => {
  const { savePhone } = await import("@/server/actions/profile");

  userId = null;
  await assert.rejects(savePhone(phoneForm("+32 470 12 34 56")), /Unauthenticated/);
  userId = "user_owner";

  for (const bad of ["123456", "1".repeat(16), "call me", "+32 470 x", "<script>1234567</script>", "1 ".repeat(20)]) {
    assert.equal((await savePhone(phoneForm(bad))).saved, false, bad);
  }
  assert.deepEqual(writes, []);

  assert.deepEqual(await savePhone(phoneForm("  +32 (470) 12-34.56  ")), { saved: true });
  assert.deepEqual(await savePhone(phoneForm("   ")), { saved: true });
  assert.deepEqual(writes, [
    ["user_owner", { phone: "+32 (470) 12-34.56" }],
    ["user_owner", { phone: null }],
  ]);
});
