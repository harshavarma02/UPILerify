/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['imapflow', 'mailparser'],
};

module.exports = nextConfig;
