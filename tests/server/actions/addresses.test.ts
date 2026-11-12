import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

type Statement = { kind: "select" | "insert" | "update" | "delete"; values?: Record<string, unknown>; where?: SQL; lock?: string };

let userId: string | null = "user_owner";
let ran: Statement[] = []; // statements awaited on their own
let batches: Statement[][] = []; // statements sent together as one transaction

beforeEach(() => {
  userId = "user_owner";
  ran = [];
  batches = [];
});

// Records each statement instead of running it; nothing happens until it is awaited or batched.
function statement(kind: Statement["kind"]) {
  const record: Statement = { kind };
  const chain = {
    record,
    from: () => chain,
    values(values: Record<string, unknown>) {
      record.values = values;
      return chain;
    },
    set(values: Record<string, unknown>) {
      record.values = values;
      return chain;
    },
    where(condition: SQL) {
      record.where = condition;
      return chain;
    },
    for(strength: string) {
      record.lock = strength;
      return chain;
    },
    // Lets a recorded select sit inside exists(...): its condition, and so its bound values, flow into the outer query.
    getSQL: () => record.where,
    then(resolve: (rows: unknown[]) => void) {
      ran.push(record);
      resolve([]);
    },
  };
  return chain;
}

mock.module("@clerk/nextjs/server", () => ({
  auth: { protect: async () => {
    if (!userId) throw new Error("Unauthenticated");
    return { userId };
  } },
}));
mock.module("next/cache", () => ({ refresh: () => {} }));
// The real redirect() throws to stop the action; so does this one, with the target in the message.
mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
mock.module("@/server/db", () => ({
  getDb: () => ({
    select: () => statement("select"),
    insert: () => statement("insert"),
    update: () => statement("update"),
    delete: () => statement("delete"),
    batch: async (statements: { record: Statement }[]) => {
      batches.push(statements.map(({ record }) => record));
    },
  }),
}));

// Load actions after mocks; static imports would initialize the real Clerk and database modules.
const { deleteAddress, saveAddress, setDefaultAddress } = await import("@/server/actions/addresses");

/** The values a WHERE clause is bound to, e.g. ["addr_1", "user_owner"]. */
const bound = (record: Statement) => (record.where ? new PgDialect().sqlToQuery(record.where).params : []);

function address(fields: Record<string, string> = {}) {
  const form = new FormData();
  const filled = { name: " Ada Lovelace ", line1: "1 Main St", city: "Dublin", postalCode: "D01 F5P2", country: "IE", ...fields };
  for (const [name, value] of Object.entries(filled)) form.set(name, value);
  return form;
}

function only(id: string) {
  const form = new FormData();
  form.set("id", id);
  return form;
}

const toList = /REDIRECT \/account\/addresses/;

test("saving an address requires a signed-in user and valid fields", async () => {
  userId = null;
  await assert.rejects(saveAddress(address()), /Unauthenticated/);
  userId = "user_owner";

  await assert.rejects(saveAddress(address({ country: "US" })), /Invalid country/, "only countries checkout ships to");
  await assert.rejects(saveAddress(address({ line1: "   " })), /Invalid line1/);
  await assert.rejects(saveAddress(address({ name: "x".repeat(101) })), /Invalid name/);
  await assert.rejects(saveAddress(address({ postalCode: "x".repeat(21) })), /Invalid postalCode/);
  assert.deepEqual([ran, batches], [[], []], "rejected input writes nothing");
});

test("a new address is stored trimmed under the signed-in user", async () => {
  await assert.rejects(saveAddress(address()), toList);
  assert.deepEqual(batches, []);
  assert.deepEqual(ran, [{
    kind: "insert",
    values: { name: "Ada Lovelace", line1: "1 Main St", line2: null, city: "Dublin", postalCode: "D01 F5P2", country: "IE", isDefault: false, clerkUserId: "user_owner" },
  }]);
});

test("a new default clears the old one in the same transaction", async () => {
  await assert.rejects(saveAddress(address({ isDefault: "on" })), toList);
  assert.deepEqual(ran, [], "never as two separate statements");
  const [[clear, insert]] = batches;
  assert.deepEqual([clear.kind, clear.values, bound(clear)], ["update", { isDefault: false }, ["user_owner", true]]);
  assert.equal(insert.kind, "insert");
  assert.equal(insert.values?.isDefault, true);
});

test("edits and removals only touch the signed-in user's own address", async () => {
  await assert.rejects(saveAddress(address({ id: "addr_1" })), toList);
  await deleteAddress(only("addr_1"));

  assert.deepEqual(batches, []);
  assert.deepEqual(ran.map((record) => [record.kind, bound(record)]), [
    ["update", ["addr_1", "user_owner"]],
    ["delete", ["addr_1", "user_owner"]],
  ]);
});

// Whether the address still exists is decided by the database, inside the same
// transaction as the swap. What can be checked here is that the swap is built
// that way: lock the target, release the old default only if the target is this
// user's, then set the new one, with no separate look-up beforehand.
test("handing over the default locks the target and releases the old default only while the target exists", async () => {
  await setDefaultAddress(only("addr_1"));
  await assert.rejects(saveAddress(address({ id: "addr_1", isDefault: "on" })), toList);

  assert.deepEqual(ran, [], "one transaction each, nothing checked or written outside it");
  for (const [lock, release, write] of batches) {
    assert.deepEqual([lock.kind, lock.lock, bound(lock)], ["select", "update", ["addr_1", "user_owner"]]);
    assert.deepEqual(
      [release.kind, release.values, bound(release)],
      ["update", { isDefault: false }, ["user_owner", true, "addr_1", "user_owner"]],
      "this user's current default, and only if addr_1 is this user's address",
    );
    assert.deepEqual([write.kind, write.values?.isDefault, bound(write)], ["update", true, ["addr_1", "user_owner"]]);
  }
  assert.equal(batches.length, 2);
});
