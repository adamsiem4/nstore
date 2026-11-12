import assert from "node:assert/strict";
import { beforeEach, mock, test } from "bun:test";

let cookie: string | undefined;
let options: Record<string, unknown> | undefined;

beforeEach(() => {
  cookie = undefined;
  options = undefined;
});

mock.module("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookie === undefined ? undefined : { value: cookie }),
    set: (_name: string, value: string, cookieOptions: Record<string, unknown>) => {
      cookie = value;
      options = cookieOptions;
    },
    delete: () => {
      cookie = undefined;
    },
  }),
}));
// The real redirect() throws to stop the action; so does this one, with the target in the message.
mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
mock.module("@/server/queries/products", () => ({
  getProduct: async (id: string) => (id === "kettle" ? { id: "kettle" } : undefined),
}));

// Load actions after mocks; static imports would initialize the real cookie store and database.
const { addToCart, clearCart, updateCart } = await import("@/server/actions/cart");

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const cart = () => (cookie === undefined ? undefined : JSON.parse(cookie));

test("adding stores catalog products in a script-proof cookie and reports whether anything changed", async () => {
  assert.equal(await addToCart(form({ id: "no-such-product" })), false, "only catalog products can be added");
  assert.equal(await addToCart(form({})), false);
  assert.equal(cookie, undefined);

  assert.equal(await addToCart(form({ id: "kettle" })), true);
  assert.equal(await addToCart(form({ id: "kettle" })), true);
  assert.deepEqual(cart(), { kettle: 2 });
  assert.deepEqual(options, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });

  cookie = JSON.stringify({ kettle: 99 });
  assert.equal(await addToCart(form({ id: "kettle" })), false, "a full line is not a successful add");
  assert.deepEqual(cart(), { kettle: 99 });
});

test("quantity changes ignore junk and can remove lines for products that left the catalog", async () => {
  cookie = JSON.stringify({ kettle: 2, retired: 1 });
  for (const delta of ["0", "1.5", "abc", ""]) await updateCart(form({ id: "kettle", delta }));
  assert.deepEqual(cart(), { kettle: 2, retired: 1 });

  await updateCart(form({ id: "kettle", delta: "-1" }));
  await updateCart(form({ id: "retired", delta: "-1" }));
  assert.deepEqual(cart(), { kettle: 1 });

  await updateCart(form({ id: "retired", delta: "1" }));
  assert.deepEqual(cart(), { kettle: 1 }, "but never add them back");
});

test("a changed cart redirects only to the cart page", async () => {
  cookie = JSON.stringify({ kettle: 1 });
  await assert.rejects(updateCart(form({ id: "kettle", delta: "1", next: "/cart" })), /REDIRECT \/cart$/);
  await updateCart(form({ id: "kettle", delta: "1", next: "https://evil.example" }));
  await updateCart(form({ id: "kettle", delta: "0", next: "/cart" }));
  assert.deepEqual(cart(), { kettle: 3 });
});

test("clearing empties the cart", async () => {
  cookie = JSON.stringify({ kettle: 1 });
  await clearCart();
  assert.equal(cookie, undefined);
});
