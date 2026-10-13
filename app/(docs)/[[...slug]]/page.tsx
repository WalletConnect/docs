import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { appName, getPageImageUrl, siteUrl } from '@/lib/shared';
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
      <DocsTitle>{page.data.title}</DocsTitle>
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
  return {
    metadataBase: new URL(siteUrl),
    title: page.slugs.length === 0 ? appName : `${page.data.title} | ${appName}`,
    description: metatags?.description ?? page.data.description,
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
