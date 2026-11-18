import { getBreadcrumbItems } from 'fumadocs-core/breadcrumb';
import { getNavigationTree } from '@/lib/navigation';
import { appDescription, appName, getPageImageUrl, siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

interface JsonLdPage {
  url: string;
  slugs: string[];
  data: { title: string; description?: string };
}

const absolute = (path: string) => new URL(path, siteUrl).toString();

const organization = {
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: 'WalletConnect',
  url: 'https://walletconnect.com',
  // Google wants a square logo of at least 112×112: the symbol from public/logo/light.svg on the brand blue
  logo: { '@type': 'ImageObject', url: absolute('/logo/walletconnect-512.png'), width: 512, height: 512 },
  sameAs: ['https://x.com/WalletConnect', 'https://github.com/WalletConnect'],
};

/**
 * Schema.org structured data, so search engines know what a page is: the home page is the WebSite,
 * every other page a TechArticle with its sidebar position as a BreadcrumbList.
 */
export function JsonLd({ page }: { page: JsonLdPage }) {
  const url = absolute(page.url);
  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: absolute('/'),
    name: appName,
    description: appDescription,
    publisher: { '@id': organization['@id'] },
  };

  const graph: object[] = [organization, website];

  if (page.slugs.length > 0) {
    graph.push({
      '@type': 'TechArticle',
      '@id': `${url}#article`,
      url,
      headline: page.data.title,
      description: page.data.description,
      image: absolute(getPageImageUrl(page).url),
      inLanguage: 'en',
      isPartOf: { '@id': website['@id'] },
      publisher: { '@id': organization['@id'] },
      mainEntityOfPage: url,
    });

    // Sidebar groups have no URL of their own, and Google requires one on every crumb but the last.
    const crumbs = getBreadcrumbItems(page.url, getNavigationTree()).filter(
      (item): item is { name: string; url: string } =>
        typeof item.name === 'string' && typeof item.url === 'string' && item.url !== page.url,
    );
    // The navbar tab (`/wallets`, `/payments`, ...) leads the trail: it's a page, unlike the groups under it
    const tab = page.slugs.length > 1 ? source.getPage(page.slugs.slice(0, 1)) : undefined;
    const items = [
      { name: 'Home', url: '/' },
      ...(tab && !crumbs.some((c) => c.url === tab.url) ? [{ name: tab.data.title, url: tab.url }] : []),
      ...crumbs,
      { name: page.data.title, url: page.url },
    ];
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: absolute(item.url),
      })),
    });
  }

  // `<` escaped so page text can never close the script tag
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has to be inline, and the content is escaped above
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
