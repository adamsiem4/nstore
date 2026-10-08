import type { Metadata } from "next";
import Link from "next/link";
import { HelpCenter, type HelpTopic } from "@/components/store/help-center";
import { SHIPPING_COUNTRIES } from "@/lib/cart";
import { getProducts } from "@/server/queries/products";

export const metadata: Metadata = {
  title: "Customer service",
  description:
    "Answers about payment, shipping, returns, and your account at nstore.",
};

const region = new Intl.DisplayNames("en", { type: "region" });
const countries = new Intl.ListFormat("en").format(
  SHIPPING_COUNTRIES.map((code) => region.of(code) ?? code),
);

export default async function CustomerServicePage() {
  const products = await getProducts();

  // ponytail: plain data, rendered by one map — a help centre is a list, not a CMS.
  const topics: HelpTopic[] = [
    {
      id: "faq",
      title: "FAQ",
      blurb: "Payment, order confirmation, your account, and your data.",
      questions: [
        {
          id: "payment",
          question: "How do I pay, and is it secure?",
          answer:
            "Payment happens on Stripe Checkout, hosted by Stripe. Card details are entered on stripe.com and never reach nstore's servers. All prices are shown in euro.",
        },
        {
          id: "confirmation",
          question: "When do I get an order confirmation?",
          answer:
            "As soon as Stripe confirms the payment, a receipt is emailed to the address you entered at checkout. If it has not arrived within a few minutes, check your spam folder before getting in touch.",
        },
        {
          id: "account",
          question: "Do I need an account to order?",
          answer:
            "No. You can fill your basket and check out as a guest. An account adds your order history and saved delivery addresses, both on [your account page](/account).",
        },
        {
          id: "basket",
          question: "Will my basket still be there tomorrow?",
          answer:
            "Your basket lives in a cookie on your device for 30 days, so it survives closing the tab. It does not follow you to another browser or phone, and it is cleared once an order is paid.",
        },
        {
          id: "catalog",
          question: "What do you sell?",
          answer: `${products.length} household essentials across kitchen appliances, cookware, cleaning, laundry, storage, and home comfort. Browse everything on the [shop page](/products).`,
        },
        {
          id: "privacy",
          question: "What do you do with my data?",
          answer:
            "Only what the shop needs: sign-in, basket, and payment. Analytics runs only if you accept it. The details are in our [Privacy Policy](/privacy) and [Cookie Policy](/cookies), where you can also change your cookie choice at any time.",
        },
      ],
    },
    {
      id: "shipping",
      title: "Shipping",
      blurb: "Delivery costs, where we deliver, and your delivery address.",
      questions: [
        {
          id: "delivery-cost",
          question: "How much does delivery cost?",
          answer:
            "Delivery is free on orders of €60 or more. Below that, standard delivery is €4.95. Your cart shows the shipping cost, and the payment page shows the final total before you pay.",
        },
        {
          id: "countries",
          question: "Where do you deliver?",
          answer: `To ${countries}. Checkout only accepts a delivery address in one of these countries.`,
        },
        {
          id: "address",
          question: "Where do I enter my delivery address?",
          answer:
            "On the Stripe payment page, after you press Check out. Stripe asks for your delivery address together with your payment details. If you are signed in and have a default address under [your addresses](/account/addresses), it is already filled in.",
        },
      ],
    },
    {
      id: "returns",
      title: "Returns",
      blurb: "30 days to change your mind, and how refunds reach you.",
      questions: [
        {
          id: "returns",
          question: "Can I return something?",
          answer:
            "Yes. You have 30 days from delivery to change your mind. Items should be unused and in their original packaging.",
        },
        {
          id: "start-return",
          question: "How do I start a return?",
          answer:
            "Sign in and open [Order history](/orders). Choose Request a return on the order, describe the items and reason, and submit your request. Wait for return instructions before sending anything back. If you checked out as a guest, write to the contact address on our [Privacy Policy](/privacy) page.",
        },
        {
          id: "refund",
          question: "How do I get my money back?",
          answer:
            "The refund goes back to the card or wallet you paid with.",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1">
      <p className="text-center text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Customer service
      </p>
      <h1 className="mt-3 text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        What do you want to know?
      </h1>

      <HelpCenter topics={topics} />

      <p className="mt-12 border-t pt-6 text-muted-foreground">
        Still stuck? The contact address is on our{" "}
        <Link
          href="/privacy"
          className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          Privacy Policy
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
