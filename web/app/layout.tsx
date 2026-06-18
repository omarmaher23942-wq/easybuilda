import type { Metadata } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EasyBuilda — Your AI agent, live in minutes",
  description:
    "Describe your business in plain words. EasyBuilda builds an AI agent that answers customers, captures leads, and books appointments — 24/7, no code.",
  metadataBase: new URL("https://easybuilda.vercel.app"),
  openGraph: {
    title: "EasyBuilda — Your AI agent, live in minutes",
    description:
      "Describe your business. Get an AI agent that answers customers, captures leads, and books appointments — live in minutes.",
    url: "https://easybuilda.vercel.app",
    siteName: "EasyBuilda",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyBuilda — AI agents for real businesses",
    description:
      "Live in minutes. No code. Answers, leads, bookings — around the clock.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}