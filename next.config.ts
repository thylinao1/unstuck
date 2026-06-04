import type { NextConfig } from "next";

// One place for the production security headers. The CSP is intentionally
// permissive on script/style 'unsafe-inline' (Next injects inline hydration
// bootstrap and the app uses a couple of inline style attributes); everything
// else is locked down. A nonce-based CSP would be stricter but needs middleware
// and risks breaking the demo, so we ship a present-and-sane CSP over none.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' data:",
  "img-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray parent-directory lockfile does not
  // confuse Turbopack's root inference.
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
};

export default nextConfig;
