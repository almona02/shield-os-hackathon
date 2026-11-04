/** @type {import('next').NextConfig} */
const nextConfig = {
  // shield-core lives under ./lib/shield-core (same repo).
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
