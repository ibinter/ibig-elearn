import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.bunnycdn.com' },
      { protocol: 'https', hostname: 'b-cdn.net' },
    ],
  },
  // Une seule URL pour la page d'accueil (SEO)
  async redirects() {
    return [{ source: '/accueil', destination: '/', permanent: true }]
  },
  // Sécurité headers
  async headers() {
    return [
      {
        source: '/((?!scorm-content/).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Modules SCORM / xAPI : affichés dans le lecteur de la plateforme uniquement (même domaine)
        source: '/scorm-content/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
};

export default nextConfig;
