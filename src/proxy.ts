import { clerkMiddleware } from "@clerk/nextjs/server";

const privatePagePath = /^\/(?:account|orders)(?:\/|$)/;

export default clerkMiddleware(async (auth, request) => {
  if (request.method !== "GET" && request.method !== "HEAD") return;
  if (!privatePagePath.test(request.nextUrl.pathname)) return;

  // Redirect before Next.js can stream the loading shell with a 200 status.
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn({ returnBackUrl: request.url });
});

export const config = {
  matcher: [
    "/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
