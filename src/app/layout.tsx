import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { PostHogIdentity } from "@/components/analytics/posthog-identity";
import { CookieBanner } from "@/components/consent/cookie-banner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
    default: "nstore · Home Appliances & Household Goods",
    template: "%s · nstore",
  },
  description:
    "Home appliances and household goods for everyday living. Explore kitchen appliances, cookware, cleaning, laundry, storage, and home comfort at nstore.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider appearance={{ theme: shadcn }}>
            <PostHogIdentity />
            {children}
            <CookieBanner />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}