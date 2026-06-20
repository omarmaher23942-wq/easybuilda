/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Backend proxy ────────────────────────────────────────────────
  // Rewrites HTTP requests through HTTPS to avoid mixed-content issues.
  // WebSocket upgrade is handled by the browser natively when
  // the client connects to wss://easybuilda.com/backend/...
  async rewrites() {
    return [
      {
        source:      "/backend/:path*",
        destination: "http://153.92.221.161:8001/:path*",
      },
    ];
  },

  // ── Headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source:  "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff"       },
          { key: "X-Frame-Options",        value: "DENY"          },
          { key: "Referrer-Policy",        value: "same-origin"   },
        ],
      },
    ];
  },

  // ── Images ───────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // ── Env ──────────────────────────────────────────────────────────
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://easybuilda.com/backend",
    NEXT_PUBLIC_SITE_URL: "https://easybuilda.com",
  },

  // ── Build ─────────────────────────────────────────────────────────
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors:  true },

  // ── Experimental ─────────────────────────────────────────────────
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;