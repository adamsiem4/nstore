import { orderDate, orderMoney } from "@/lib/utils";
import type { Order } from "@/server/queries/orders";

type Receipt = Pick<
  Order,
  "number" | "amount" | "currency" | "createdAt" | "items" | "subtotal" | "shipping" | "tax" | "discount" | "shipTo"
>;

// Light theme from globals.css; email clients ignore CSS variables.
const color = { canvas: "#f3ede7", card: "#fbf7f2", text: "#191715", muted: "#585553", border: "#decfc1" };
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const region = new Intl.DisplayNames("en", { type: "region" });

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** The payment confirmation email: HTML plus a plain-text fallback. */
export function receiptEmail(order: Receipt, origin: string) {
  const money = (cents: number) => orderMoney(cents, order.currency);
  const orderUrl = `${origin}/orders/${order.number.toLowerCase()}`;
  const address = order.shipTo?.address;
  const shipTo = [
    order.shipTo?.name,
    address?.line1,
    address?.line2,
    [address?.postal_code, address?.city].filter(Boolean).join(" "),
    address?.country ? region.of(address.country) : null,
  ].filter((line): line is string => Boolean(line));

  // Null when the Stripe lookup failed; the total always comes from the payment.
  const totals = [
    order.subtotal !== null && ["Subtotal", money(order.subtotal)],
    order.shipping !== null && ["Shipping", order.shipping ? money(order.shipping) : "Free"],
    order.discount > 0 && ["Discount", `−${money(order.discount)}`],
    order.tax > 0 && ["Tax", money(order.tax)],
  ].filter((line) => line !== false);

  const row = (label: string, value: string, total = false) => {
    const style = total
      ? `padding:12px 0 0;border-top:1px solid ${color.border};font-weight:600;color:${color.text}`
      : `padding:4px 0;color:${color.muted}`;
    return `
    <tr>
      <td style="${style}">${escape(label)}</td>
      <td align="right" style="${style};color:${color.text}">${escape(value)}</td>
    </tr>`;
  };

  const items = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${color.border};color:${color.text}">
        ${escape(item.name ?? "Item")}
        <div style="color:${color.muted};font-size:13px;margin-top:2px">Qty ${item.quantity ?? 1}</div>
      </td>
      <td align="right" valign="top" style="padding:12px 0;border-bottom:1px solid ${color.border};color:${color.text};white-space:nowrap">${escape(orderMoney(item.amount, item.currency))}</td>
    </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your nstore order</title></head>
<body style="margin:0;padding:0;background:${color.canvas};font-family:${font};font-size:15px;line-height:1.5;color:${color.text}">
  <div style="display:none;max-height:0;overflow:hidden">Order ${escape(order.number)} · ${escape(money(order.amount))} paid. Thank you for shopping with nstore.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${color.canvas}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="padding:0 4px 20px;font-size:22px;font-weight:700;letter-spacing:-0.02em">nstore</td></tr>
        <tr><td style="background:${color.card};border:1px solid ${color.border};border-radius:12px;padding:32px">
          <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;font-weight:600;letter-spacing:-0.01em">Thank you for your order</h1>
          <p style="margin:0 0 24px;color:${color.muted}">We've received your payment and are getting your order ready.</p>
          <p style="margin:0 0 4px;font-size:13px;color:${color.muted}">Order <strong style="color:${color.text}">${escape(order.number)}</strong> · ${escape(orderDate.format(order.createdAt))}</p>
          ${items ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid ${color.border}">${items}</table>` : ""}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
            ${totals.map(([label, value]) => row(label, value)).join("")}
            ${row("Total paid", money(order.amount), true)}
          </table>
          ${
            shipTo.length
              ? `<p style="margin:24px 0 4px;font-size:13px;font-weight:600">Shipping to</p>
          <p style="margin:0;color:${color.muted}">${shipTo.map(escape).join("<br>")}</p>`
              : ""
          }
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px">
            <tr><td style="background:${color.text};border-radius:4px">
              <a href="${escape(orderUrl)}" style="display:inline-block;padding:12px 22px;color:${color.card};font-weight:600;text-decoration:none">View your order</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 4px 0;font-size:13px;color:${color.muted}">
          Questions about your order? <a href="${escape(`${origin}/customer-service`)}" style="color:${color.text}">Visit customer service</a>.<br>
          © ${order.createdAt.getFullYear()} nstore
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "Thank you for your order",
    "",
    `Order ${order.number} · ${orderDate.format(order.createdAt)}`,
    "",
    ...order.items.map((item) => `${item.name ?? "Item"} × ${item.quantity ?? 1}  ${orderMoney(item.amount, item.currency)}`),
    ...totals.map(([label, value]) => `${label}: ${value}`),
    `Total paid: ${money(order.amount)}`,
    ...(shipTo.length ? ["", "Shipping to:", ...shipTo] : []),
    "",
    `View your order: ${orderUrl}`,
    "",
    "nstore",
  ].join("\n");

  return { subject: `Your nstore order ${order.number}`, html, text };
}
