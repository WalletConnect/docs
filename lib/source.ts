import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins/remark-mdx-mermaid';
import { llms, loader } from 'fumadocs-core/source';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { z } from 'zod';
import { remarkUnwrapInlineJsx } from './remark-unwrap-inline-jsx';
import { docsRoute } from './shared';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // Frontmatter fields carried over from Mintlify.
    schema: pageSchema.extend({
      /** Label used in the sidebar instead of `title`. */
      sidebarTitle: z.string().optional(),
      /** `frame` renders the page without title, TOC and page chrome (landing pages). */
      mode: z.enum(['default', 'wide', 'frame', 'custom', 'center']).optional(),
      metatags: z.record(z.string(), z.string()).optional(),
      /** Set on generated API reference pages; the sidebar shows the method as a badge. */
      _openapi: z.object({ method: z.string() }).optional(),
    }),
    mdxOptions: applyMdxPreset({
      // ```mermaid code blocks → <Mermaid chart="..." />
      remarkPlugins: (plugins) => [remarkMath, remarkMdxMermaid, remarkUnwrapInlineJsx, ...plugins],
      // $$ LaTeX $$ blocks
      rehypePlugins: (plugins) => [rehypeKatex, ...plugins],
      // Some content still points at Mintlify's CDN; don't fail the build if one is unreachable.
      remarkImageOptions: { onError: 'ignore' },
      rehypeCodeOptions: {
        themes: { light: 'github-light', dark: 'github-dark' },
        fallbackLanguage: 'text',
      },
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
