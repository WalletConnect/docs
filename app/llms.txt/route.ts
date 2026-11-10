import { docsLlms, source } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  // `index()` lists the whole page tree, so drop the list item of each `noindex` page.
  const hidden = source
    .getPages()
    .filter((page) => page.data.noindex)
    .map((page) => `](${page.url.replace(/([()])/g, '\\$1')})`);
  const index = await docsLlms.index();
  return new Response(
    index
      .split('\n')
      .filter((line) => !hidden.some((link) => line.includes(link)))
      .join('\n'),
  );
}
