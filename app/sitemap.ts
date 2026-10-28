import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = false;

// Mintlify generated a sitemap for every page; Fumadocs leaves it to Next's metadata routes.
export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({ url: new URL(page.url, siteUrl).toString() }));
}
