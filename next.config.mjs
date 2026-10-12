import { createMDX } from 'fumadocs-mdx/next';
import redirects from './redirects.json' with { type: 'json' };

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Carried over from Mintlify docs.json → redirects
  async redirects() {
    return redirects.map(({ source, destination, permanent = true }) => ({ source, destination, permanent }));
  },
};

export default withMDX(config);
