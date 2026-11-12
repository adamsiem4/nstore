import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

type Write = { kind: "insert" | "update" | "delete"; values?: Record<string, unknown>; where?: SQL };

let userId: string | null = "user_owner";
let owned = true; // whether the submitted id is one of this user's addresses
let ran: Write[] = []; // writes awaited on their own
let batches: Write[][] = []; // writes sent together as one transaction

beforeEach(() => {
  userId = "user_owner";
  owned = true;
  ran = [];
  batches = [];
});

// Records each write instead of running it; nothing happens until it is awaited or batched.
function write(kind: Write["kind"]) {
  const record: Write = { kind };
  const chain = {
    record,
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
    insert: () => write("insert"),
    update: () => write("update"),
    delete: () => write("delete"),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (owned ? [{ id: "addr_1" }] : []) }) }) }),
    batch: async (writes: { record: Write }[]) => {
      batches.push(writes.map(({ record }) => record));
    },
  }),
}));

// Load actions after mocks; static imports would initialize the real Clerk and database modules.
const { deleteAddress, saveAddress, setDefaultAddress } = await import("@/server/actions/addresses");

/** The values a WHERE clause is bound to, e.g. ["addr_1", "user_owner"]. */
const bound = (record: Write) => (record.where ? new PgDialect().sqlToQuery(record.where).params : []);

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

test("edits, removals and default changes only touch the signed-in user's own address", async () => {
  await assert.rejects(saveAddress(address({ id: "addr_1" })), toList);
  await deleteAddress(only("addr_1"));
  await setDefaultAddress(only("addr_1"));

  assert.deepEqual(ran.map((record) => [record.kind, bound(record)]), [
    ["update", ["addr_1", "user_owner"]],
    ["delete", ["addr_1", "user_owner"]],
  ]);
  const [[clear, promote]] = batches;
  assert.deepEqual([clear.values, bound(clear)], [{ isDefault: false }, ["user_owner", true]]);
  assert.deepEqual([promote.values, bound(promote)], [{ isDefault: true }, ["addr_1", "user_owner"]]);
});

test("an address that is gone or someone else's leaves the current default alone", async () => {
  owned = false;
  await assert.rejects(saveAddress(address({ id: "addr_gone", isDefault: "on" })), toList);
  await setDefaultAddress(only("addr_gone"));
  assert.deepEqual([ran, batches], [[], []]);
});
