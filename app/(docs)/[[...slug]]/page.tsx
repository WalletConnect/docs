import { DocsBody, DocsDescription, DocsPage, DocsTitle, MarkdownCopyButton } from 'fumadocs-ui/layouts/notebook/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { appDescription, appName, getPageImageUrl, getPageMarkdownUrl, homeTitle, siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const components = getMDXComponents({
    // this allows you to link to other pages with relative file paths
    a: createRelativeLink(source, page),
  });

  // Mintlify `mode: frame` → landing pages with no title, TOC or page actions
  if (page.data.mode === 'frame' || page.data.mode === 'custom') {
    // The start page is the only one rendered without a sidebar — see app/global.css.
    // `mode: frame` alone won't do: the Payments landing pages are `frame` and keep theirs.
    const isHome = page.slugs.length === 0;
    return (
      <DocsPage
        data-home={isHome || undefined}
        // these pages open with a <Container> of their own (py-14), so the article's top
        // padding would double the gap under the navbar
        className="pt-0 md:pt-0 xl:pt-0"
        full
        toc={[]}
        footer={{ enabled: false }}
        tableOfContent={{ enabled: false }}
      >
        <DocsBody>
          <MDX components={components} />
        </DocsBody>
      </DocsPage>
    );
  }

  return (
    <DocsPage toc={page.data.toc} full={page.data.full ?? page.data.mode === 'wide'}>
      <div className="flex items-start justify-between gap-4">
        <DocsTitle>{page.data.title}</DocsTitle>
        {/* Mintlify's "Copy page" button as an icon only, without its dropdown of AI and Markdown links.
            The empty string replaces Fumadocs' "Copy Markdown" label: `null` would fall back to it. */}
        <MarkdownCopyButton
          markdownUrl={getPageMarkdownUrl(page).url}
          aria-label="Copy page"
          title="Copy page"
          className="mt-1 size-8 shrink-0 p-0"
        >
          {''}
        </MarkdownCopyButton>
      </div>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const { metatags } = page.data;
  const isHome = page.slugs.length === 0;
  const title = isHome ? homeTitle : `${page.data.title} | ${appName}`;
  const description = metatags?.description ?? page.data.description ?? appDescription;
  const image = getPageImageUrl(page).url;
  return {
    metadataBase: new URL(siteUrl),
    // `absolute` skips the root layout's `%s | WalletConnect Docs` template, which `title` already includes
    title: { absolute: title },
    description,
    // Redirected Mintlify URLs and `.md` variants all point search engines at this one URL
    alternates: { canonical: page.url },
    openGraph: {
      type: isHome ? 'website' : 'article',
      siteName: appName,
      url: page.url,
      title,
      description,
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image,
    },
  };
}
