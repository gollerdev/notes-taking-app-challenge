import { Inria_Serif, Inter } from "next/font/google";

/**
 * Canonical font setup for the whole app.
 * Loaded via next/font/google — no @import, no self-hosted files.
 * Exposed as CSS variables so Tailwind can reference them in fontFamily.
 */

export const inriaSerif = Inria_Serif({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-inria-serif",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inter",
  display: "swap",
});
