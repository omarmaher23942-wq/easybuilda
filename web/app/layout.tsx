import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://easybuilda.com"),
  title: {
    default: "EasyBuilda — Build AI Agents for Your Business in Minutes",
    template: "%s | EasyBuilda",
  },
  description:
    "Create a professional AI customer agent for your business — no code, no technical skills. Just describe your business and we build the agent. Restaurants, clinics, real estate, law firms, and more.",
  keywords: [
    "AI agent", "AI chatbot", "business chatbot", "customer service AI",
    "no code AI", "AI assistant builder", "lead capture AI",
    "restaurant chatbot", "clinic AI agent", "real estate AI",
  ],
  authors:  [{ name: "EasyBuilda", url: "https://easybuilda.com" }],
  creator:  "EasyBuilda",
  publisher:"EasyBuilda",
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         "https://easybuilda.com",
    siteName:    "EasyBuilda",
    title:       "EasyBuilda — AI Agents for Every Business",
    description: "Build a 24/7 AI agent for your business in minutes. No code needed. Capture leads while you sleep.",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "EasyBuilda — AI Agents for Every Business",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "EasyBuilda — AI Agents for Every Business",
    description: "Build a 24/7 AI agent for your business in minutes. No code needed.",
    images:      ["/og-image.png"],
    creator:     "@easybuilda",
  },
  icons: {
    icon:   [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple:  [{ url: "/apple-icon.png" }],
  },
  manifest: "/manifest.json",
  category: "technology",
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor:   "#05070f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ margin: 0, background: "#05070f", color: "#edf0f7" }}>
        {children}
      </body>
    </html>
  );
}