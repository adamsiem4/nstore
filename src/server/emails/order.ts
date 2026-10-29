import { orderDate, orderMoney } from "@/lib/utils";
import type { Order } from "@/server/queries/orders";

type OrderDetails = Pick<
  Order,
  "number" | "amount" | "currency" | "createdAt" | "items" | "subtotal" | "shipping" | "tax" | "discount" | "shipTo"
>;
export type OrderStep = Order["fulfillment"];

const steps: OrderStep[] = ["confirmed", "shipped", "delivered"];
const copy = {
  confirmed: {
    subject: (number: string) => `Your nstore order ${number}`,
    heading: "Thank you for your order",
    intro: "We've received your payment and are getting your order ready.",
    address: "Shipping to",
  },
  shipped: {
    subject: (number: string) => `Your nstore order ${number} is on its way`,
    heading: "Your order is on its way",
    intro: "Good news: your order has left our warehouse and is heading to you.",
    address: "Shipping to",
  },
  delivered: {
    subject: (number: string) => `Your nstore order ${number} has been delivered`,
    heading: "Your order has been delivered",
    intro: "We hope you enjoy it. If something isn't right, you can request a return within 30 days.",
    address: "Delivered to",
  },
} satisfies Record<OrderStep, unknown>;
const stepLabel = { confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered" };

// Light theme from globals.css; email clients ignore CSS variables.
// No canvas color: apps that force their own dark mode (Proton, Gmail) turn the cream into brown,
// while an unset background becomes the app's own. The card keeps the store's cream.
// Same reason for the beige button and text-only progress: forced dark modes darken light
// fills and borders but leave dark ones alone, so a dark button or bar vanishes on the dark card.
const color = { card: "#fbf7f2", text: "#191715", border: "#decfc1", button: "#e8dccf" };
// Secondary text fades the main color instead of using a grey: forced dark modes recolor every
// text the same light shade, but keep opacity, so the hierarchy survives. ≈ #585553 on the card.
const muted = `color:${color.text};opacity:0.72`;
// Dark theme from globals.css .dark (border is its 18% foreground, flattened onto the card).
// Declaring it stops Apple Mail and others from auto-inverting the light colors.
const dark = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) {
    .bg { background: #0a0a0a !important; }
    .card { background: #1a1a1b !important; border-color: #424140 !important; }
    .fg { color: #f5f3f0 !important; }
    .mu { color: #f5f3f0 !important; }
    .ln { border-color: #424140 !important; }
    .btn { background: #f5f3f0 !important; }
    .btn a { color: #191714 !important; }
  }
  @media (max-width: 600px) {
    .outer { padding: 16px 12px 32px !important; }
    .pad { padding: 28px 20px 24px !important; }
    .inset { padding-left: 20px !important; padding-right: 20px !important; }
    .title { font-size: 22px !important; line-height: 28px !important; }
    .cta { width: 100% !important; }
    .cta a { display: block !important; text-align: center !important; }
  }
  @media (max-width: 360px) {
    .step { font-size: 12px !important; padding-right: 4px !important; }
  }`;
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const region = new Intl.DisplayNames("en", { type: "region" });

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** The email for one order step (paid, shipped, delivered): HTML plus a plain-text fallback. */
export function orderEmail(step: OrderStep, order: OrderDetails, origin: string) {
  const { heading, intro, address: addressLabel, subject } = copy[step];
  const reached = steps.indexOf(step);
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

  // 8px grid; text is 16/24 body, 13/20 small.
  const row = (label: string, value: string) => `
    <tr>
      <td class="mu" style="padding:4px 0;${muted}">${escape(label)}</td>
      <td align="right" class="fg" style="padding:4px 0 4px 16px;color:${color.text};white-space:nowrap">${escape(value)}</td>
    </tr>`;

  const items = order.items
    .map(
      (item) => `
    <tr>
      <td class="ln fg" style="padding:16px 0;border-bottom:1px solid ${color.border};color:${color.text}">
        ${escape(item.name ?? "Item")}
        <div class="mu" style="${muted};font-size:13px;line-height:20px;padding-top:4px">Qty ${item.quantity ?? 1}</div>
      </td>
      <td align="right" valign="top" class="ln fg" style="padding:16px 0 16px 16px;border-bottom:1px solid ${color.border};color:${color.text};white-space:nowrap">${escape(orderMoney(item.amount, item.currency))}</td>
    </tr>`,
    )
    .join("");

  const progress = steps
    .map((name, index) => {
      const done = index <= reached;
      return `<td width="33%" class="${done ? "fg" : "mu"} step" style="padding-right:8px;font-size:13px;line-height:20px;white-space:nowrap;font-weight:${index === reached ? 600 : 400};${done ? `color:${color.text}` : muted}">${done ? "✓" : "○"}&nbsp;${stepLabel[name]}</td>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>Your nstore order</title>
<style>${dark}</style>
</head>
<body class="bg fg" style="margin:0;padding:0;font-family:${font};font-size:16px;line-height:24px;color:${color.text};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden">Order ${escape(order.number)} · ${escape(intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="font-family:${font};font-size:16px;line-height:24px">
    <tr><td align="center" class="outer" style="padding:40px 16px 48px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td class="fg inset" style="padding:0 32px 16px;font-size:20px;line-height:28px;font-weight:700;letter-spacing:-0.02em;color:${color.text}">nstore</td></tr>
        <tr><td class="card pad" style="background:${color.card};border:1px solid ${color.border};border-radius:12px;padding:40px 32px 32px">
          <h1 class="fg title" style="margin:0 0 8px;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-0.01em;color:${color.text}">${heading}</h1>
          <p class="mu" style="margin:0 0 24px;${muted}">${intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px"><tr>${progress}</tr></table>
          <p class="fg" style="margin:0;font-size:13px;line-height:20px;color:${color.text}"><span class="mu" style="${muted}">Order</span> <strong>${escape(order.number)}</strong> <span class="mu" style="${muted}">· ${escape(orderDate.format(order.createdAt))}</span></p>
          ${items ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ln" style="margin-top:12px;border-top:1px solid ${color.border}">${items}</table>` : ""}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
            ${totals.map(([label, value]) => row(label, value)).join("")}
            <tr><td colspan="2" style="height:8px;font-size:0;line-height:0">&nbsp;</td></tr>
            <tr>
              <td class="ln fg" style="padding:12px 0 0;border-top:1px solid ${color.border};font-weight:600;color:${color.text}">Total paid</td>
              <td align="right" class="ln fg" style="padding:12px 0 0 16px;border-top:1px solid ${color.border};font-weight:600;color:${color.text};white-space:nowrap">${escape(money(order.amount))}</td>
            </tr>
          </table>
          ${
            shipTo.length
              ? `<p class="fg" style="margin:32px 0 4px;font-size:13px;line-height:20px;font-weight:600;color:${color.text}">${addressLabel}</p>
          <p class="mu" style="margin:0;${muted}">${shipTo.map(escape).join("<br>")}</p>`
              : ""
          }
          <table role="presentation" cellpadding="0" cellspacing="0" class="cta" style="margin-top:32px">
            <tr><td class="btn" style="background:${color.button};border-radius:6px">
              <a href="${escape(orderUrl)}" style="display:inline-block;padding:12px 24px;font-size:16px;line-height:24px;color:${color.text};font-weight:600;text-decoration:none">View your order →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="mu inset" style="padding:24px 32px 0;font-size:13px;line-height:20px;${muted}">
          Questions about your order? <a href="${escape(`${origin}/customer-service`)}" class="fg" style="color:${color.text}">Visit customer service</a>.<br>
          © ${new Date().getFullYear()} nstore
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    heading,
    intro,
    "",
    `Status: ${steps.slice(0, reached + 1).map((name) => stepLabel[name]).join(" → ")}`,
    `Order ${order.number} · ${orderDate.format(order.createdAt)}`,
    "",
    ...order.items.map((item) => `${item.name ?? "Item"} × ${item.quantity ?? 1}  ${orderMoney(item.amount, item.currency)}`),
    ...totals.map(([label, value]) => `${label}: ${value}`),
    `Total paid: ${money(order.amount)}`,
    ...(shipTo.length ? ["", `${addressLabel}:`, ...shipTo] : []),
    "",
    `View your order: ${orderUrl}`,
    "",
    "nstore",
  ].join("\n");

  return { subject: subject(order.number), html, text };
}
