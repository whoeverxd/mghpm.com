import type { NextConfig } from "next";

// Public catalog URLs per language; both serve the internal /[lang]/stays pages.
const staysRoutes = [
  { locale: "en", base: "/stays" },
  { locale: "es", base: "/estancias" },
];

const nextConfig: NextConfig = {
  // Dev server opened from the LAN/VPN address instead of localhost.
  allowedDevOrigins: ["172.16.0.3"],
  async rewrites() {
    return staysRoutes.flatMap(({ locale, base }) => [
      { source: base, destination: `/${locale}/stays` },
      { source: `${base}/:propertyId/:unitId`, destination: `/${locale}/stays/:propertyId/:unitId` },
    ]);
  },
  async redirects() {
    // Old /es/stays and /en/stays links move to the translated URLs.
    const staysRedirects = staysRoutes.flatMap(({ locale, base }) => [
      { source: `/${locale}/stays`, destination: base, permanent: true },
      {
        source: `/${locale}/stays/:propertyId/:unitId`,
        destination: `${base}/:propertyId/:unitId`,
        permanent: true,
      },
    ]);

    // Staff pages moved under /admin.
    const adminRedirects = [
      { source: "/dashboard", destination: "/admin", permanent: true },
      ...["properties", "people", "leases", "users", "stay-inquiries"].flatMap((section) => [
        { source: `/${section}`, destination: `/admin/${section}`, permanent: true },
        { source: `/${section}/:path*`, destination: `/admin/${section}/:path*`, permanent: true },
      ]),
      { source: "/organizations/select", destination: "/espacios", permanent: true },
    ];

    return [...staysRedirects, ...adminRedirects];
  },
};

export default nextConfig;
