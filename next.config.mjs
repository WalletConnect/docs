import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Plain files in out/, served by Cloudflare. Redirects and Markdown negotiation live in worker/index.ts.
  output: 'export',
  // No image optimizer without a server; images are served as they are in public/
  images: { unoptimized: true },
};

export default withMDX(config);
