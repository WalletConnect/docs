import { docsLlms, source } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = false;

// A list item's link target, as `llms()` writes it: `- [Title](/url)`, with `\` escaping any character.
const linkTarget = /\]\(((?:\\.|[^\\)])*)\)/;

export async function GET() {
  // `index()` lists the whole page tree, so drop the list item of each `noindex` page. The link target is
  // unescaped and compared with the page URL, rather than escaping the URL to match the Markdown.
  const hidden = new Set(
    source
      .getPages()
      .filter((page) => page.data.noindex)
      .map((page) => page.url),
  );
  const index = await docsLlms.index();
  return new Response(
    index
      .split('\n')
      .filter((line) => {
        const target = linkTarget.exec(line)?.[1];
        return target === undefined || !hidden.has(target.replace(/\\(.)/g, '$1'));
      })
      .join('\n'),
  );
}
