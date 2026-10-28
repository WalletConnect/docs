import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/notebook/page';
import { DocsShell } from '@/components/docs-layout';
import { Container, ProductCards, Title } from '@/components/snippets/home';

// Exported as out/404.html; Cloudflare serves it for any unknown URL (wrangler.jsonc).
// Laid out like the home page (see app/(docs)/[[...slug]]/page.tsx): no sidebar, TOC or footer.
export default function NotFound() {
  return (
    <DocsShell outsideTree>
      <DocsPage
        data-home
        className="pt-0 md:pt-0 xl:pt-0"
        full
        toc={[]}
        footer={{ enabled: false }}
        tableOfContent={{ enabled: false }}
      >
        <DocsBody className="px-5">
          <Container>
            <div className="not-prose mb-8 flex flex-col items-center text-center">
              <Title>Page not found</Title>
              <p className="mt-3 text-fd-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
            </div>
            <ProductCards />
          </Container>
        </DocsBody>
      </DocsPage>
    </DocsShell>
  );
}
