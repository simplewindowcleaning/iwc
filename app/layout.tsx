import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simple Windows — Instant Window Cleaning",
  description: "Book window cleaning instantly. Simple, fast, priced per window.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body style={{ fontFamily: "var(--font-space-grotesk), sans-serif", margin: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
