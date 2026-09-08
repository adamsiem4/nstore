import assert from "node:assert/strict";
import { mock } from "bun:test";

mock.module("@/server/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: async (id) => {
          if (id === "invalid") throw new Error("No such checkout session");
          return { id, payment_status: id === "paid" ? "paid" : "unpaid" };
        },
      },
    },
  }),
}));

const { GET } = await import("./route.ts");
for (const id of [null, "invalid", "unpaid", "paid"]) {
  const response = await GET(new Request(
    `http://localhost/api/checkout/return${id ? `?session_id=${id}` : ""}`,
    { headers: { cookie: 'cart={"cream-electric-kettle":2}' } },
  ));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), id === "paid"
    ? "http://localhost/checkout/success?session_id=paid"
    : "http://localhost/cart");
  if (id === "paid") {
    assert.match(response.headers.get("set-cookie"), /cart=;.*Expires=Thu, 01 Jan 1970/);
  } else {
    assert.equal(response.headers.get("set-cookie"), null);
  }
}
console.log("ok — only paid checkout returns clear the cart");
