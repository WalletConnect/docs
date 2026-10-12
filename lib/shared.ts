import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'WalletConnect Docs';
export const appDescription = 'The Connectivity Layer for the Financial Internet';
export const siteUrl = 'https://docs.walletconnect.network';

// Docs are served from the site root so every URL from the Mintlify site keeps working.
export const docsRoute = '/';
export const docsImageRoute = '/og';
export const docsContentRoute = '/llms.mdx';

export const gitConfig = {
  user: 'WalletConnect',
  repo: 'docs',
  branch: 'main',
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
