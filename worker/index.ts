import redirects from '../redirects.json';

/**
 * Runs in front of the static export in out/ (see wrangler.jsonc). It does the work proxy.ts and
 * next.config.mjs did on the Next server: redirects, `/<page>.md` URLs, and Markdown for clients
 * sending `Accept: text/markdown`. Everything else is a plain file from out/.
 */

interface Env {
  ASSETS: { fetch(input: Request | URL): Promise<Response> };
}

interface Redirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

// Carried over from Mintlify docs.json → redirects. The `:slug*` sources are URLPattern syntax.
const rules = (redirects as Redirect[]).map(({ source, destination, permanent = true }) => ({
  pattern: new URLPattern({ pathname: source }),
  destination,
  status: permanent ? 308 : 307,
}));

const markdownMediaTypes = ['text/plain', 'text/markdown', 'text/x-markdown'];

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    const redirect = findRedirect(url);
    if (redirect) return Response.redirect(redirect.location, redirect.status);

    if (url.pathname.endsWith('.md')) {
      return serveMarkdown(env, url, url.pathname.slice(0, -'.md'.length));
    }

    if (isMarkdownPreferred(request)) {
      const response = await serveMarkdown(env, url, url.pathname);
      // this URL has two representations, selected by `Accept`
      response.headers.set('Vary', 'Accept');
      return response;
    }

    return env.ASSETS.fetch(request);
  },
};

function findRedirect(url: URL) {
  for (const { pattern, destination, status } of rules) {
    const groups = pattern.exec(url)?.pathname.groups;
    if (!groups) continue;

    // An empty `:slug*` drops its leading slash too: /api-reference → /payments/api-reference
    const pathname = destination
      .replace(/\/:(\w+)\*/g, (_, name: string) => (groups[name] ? `/${groups[name]}` : ''))
      .replace(/:(\w+)/g, (_, name: string) => groups[name] ?? '');
    return { location: new URL(pathname + url.search, url), status };
  }
}

/** `/wallets/overview` → the pre-built `/llms.mdx/wallets/overview/content.md` */
async function serveMarkdown(env: Env, url: URL, pagePath: string) {
  const path = `/llms.mdx${pagePath.replace(/\/$/, '')}/content.md`;
  const asset = await env.ASSETS.fetch(new URL(path, url));
  const response = new Response(asset.body, asset);
  if (asset.ok) response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  return response;
}

/** Same rules as `isMarkdownPreferred` from fumadocs-core/negotiation, which proxy.ts used */
function isMarkdownPreferred(request: Request) {
  const accept = request.headers.get('accept');
  if (!accept) return false;

  let markdown = 0;
  let html = 0;
  for (const section of accept.split(',')) {
    const [rawMediaType, ...params] = section.split(';');
    const mediaType = rawMediaType.trim().toLowerCase();
    const q = params.map((param) => param.split('=')).find(([key]) => key.trim().toLowerCase() === 'q');
    const parsed = Number.parseFloat(q?.[1] ?? '');
    const quality = Number.isNaN(parsed) ? 1 : parsed;
    if (!mediaType || quality <= 0) continue;

    if (markdownMediaTypes.includes(mediaType)) markdown = Math.max(markdown, quality);
    else if (mediaType === 'text/html' || mediaType === 'text/*' || mediaType === '*/*') html = Math.max(html, quality);
  }
  return markdown > 0 && markdown >= html;
}
