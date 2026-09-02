import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { PostHogIdentity } from "@/components/analytics/posthog-identity";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "nstore",
    template: "%s · nstore",
  },
  description: "Everyday things, made well.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-zinc-900">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <PostHogIdentity />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}