/** @type {import('next').NextConfig} */
const nextConfig = {
  // shield-core lives one level above the Next app (../lib/shield-core).
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
