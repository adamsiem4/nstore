import type { MetadataRoute } from "next";

// ponytail: the file convention emits <link rel="manifest"> on its own, so the
// generator's manifest.json and its hand-written <head> tags are dead weight.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nstore",
    short_name: "nstore",
    description:
      "Home appliances and household goods for everyday living.",
    start_url: "/",
    display: "standalone",
    // Matches --background / --foreground in globals.css.
    background_color: "#f3ede7",
    theme_color: "#f3ede7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
