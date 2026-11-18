import { docsLlms, getIndexedPages } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  // Not `docsLlms.full()`: it renders every page, `noindex` ones included.
  const pages = await Promise.all(getIndexedPages().map((page) => docsLlms.page(page)));
  return new Response(pages.join('\n\n'));
}
