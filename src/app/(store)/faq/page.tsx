import type { Metadata } from "next";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getProducts } from "@/server/queries/products";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Delivery, returns, payment, and account questions about shopping at nstore.",
};

export default async function FaqPage() {
  const products = await getProducts();

  // ponytail: plain data, rendered by one map — an FAQ is a list, not a CMS.
  const faqs = [
    {
      value: "delivery-cost",
      question: "How much does delivery cost?",
      answer: (
        <p>
          Delivery is free on orders over €60. Below that, the exact shipping
          cost is added on the payment page, so you always see the final total
          before you pay.
        </p>
      ),
    },
    {
      value: "returns",
      question: "Can I return something?",
      answer: (
        <p>
          Yes. You have 30 days from delivery to change your mind. Items should
          be unused and in their original packaging; the refund goes back to
          the card or wallet you paid with.
        </p>
      ),
    },
    {
      value: "payment",
      question: "How do I pay, and is it secure?",
      answer: (
        <p>
          Payment happens on Stripe Checkout, hosted by Stripe. Card details are
          entered on stripe.com and never reach nstore&apos;s servers. All
          prices are shown in euro.
        </p>
      ),
    },
    {
      value: "confirmation",
      question: "When do I get an order confirmation?",
      answer: (
        <p>
          As soon as Stripe confirms the payment, a receipt is emailed to the
          address you entered at checkout. If it has not arrived within a few
          minutes, check your spam folder before getting in touch.
        </p>
      ),
    },
    {
      value: "account",
      question: "Do I need an account to order?",
      answer: (
        <p>
          No. You can fill your basket and check out as a guest. An account only
          adds a saved profile you can reach from{" "}
          <Link href="/account">your account page</Link>.
        </p>
      ),
    },
    {
      value: "basket",
      question: "Will my basket still be there tomorrow?",
      answer: (
        <p>
          Your basket lives in a cookie on your device for 30 days, so it
          survives closing the tab. It does not follow you to another browser or
          phone, and it is cleared once an order is paid.
        </p>
      ),
    },
    {
      value: "catalog",
      question: "What do you sell?",
      answer: (
        <p>
          {products.length} household essentials across kitchen appliances,
          cookware, cleaning, laundry, storage, and home comfort. Browse
          everything on the <Link href="/products">shop page</Link>.
        </p>
      ),
    },
    {
      value: "privacy",
      question: "What do you do with my data?",
      answer: (
        <p>
          Only what the shop needs: sign-in, basket, and payment. Analytics runs
          only if you accept it. The details are in our{" "}
          <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/cookies">Cookie Policy</Link>, where you can also change
          your cookie choice at any time.
        </p>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 sm:p-8 lg:p-10">
      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 outline-none">
        <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          FAQ
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Questions, answered.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Delivery, returns, payment, and what happens to your data. Still
          stuck? The contact address is on our{" "}
          <Link
            href="/privacy"
            className="rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            Privacy Policy
          </Link>{" "}
          page.
        </p>

        <Accordion className="mt-10 border-t" defaultValue={["delivery-cost"]}>
          {faqs.map(({ value, question, answer }) => (
            <AccordionItem key={value} value={value} className="border-b">
              <AccordionTrigger className="py-5 text-base sm:text-lg">
                {question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-7 text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  );
}
