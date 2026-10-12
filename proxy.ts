import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { type NextRequest, NextResponse } from 'next/server';
import { docsContentRoute } from '@/lib/shared';

// Serve the Markdown version of a page for `/<page>.md` and for clients sending `Accept: text/markdown`.
const { rewrite: rewriteDocs } = rewritePath('/{*path}', `${docsContentRoute}{/*path}/content.md`);
const { rewrite: rewriteSuffix } = rewritePath('/{*path}.md', `${docsContentRoute}{/*path}/content.md`);

export default function proxy(request: NextRequest) {
  const result = rewriteSuffix(request.nextUrl.pathname);
  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(request.nextUrl.pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl), {
        // this URL has two representations, selected by `Accept`
        headers: { Vary: 'Accept' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|og|llms|images|logo|favicon.ico|copy-agent-prompt.js).*)'],
};
