/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Types are still checked by tsc during build; skip eslint to avoid
    // failing on stylistic rules in CI.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
