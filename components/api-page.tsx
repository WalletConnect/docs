import { OpenAPIPage } from '@/components/api-page.client';
import { openapi } from '@/lib/openapi';

type OpenAPIPageProps = Parameters<typeof OpenAPIPage>[0];

/**
 * Replaces Mintlify's `openapi: "api/<file>.json METHOD /path"` frontmatter.
 * Usage in MDX: <APIPage document="2026-02-18.json" operations={[{ path: '/v1/payments', method: 'post' }]} />
 */
export async function APIPage({
  document,
  ...props
}: Omit<OpenAPIPageProps, 'preloaded' | 'payload'> & { document: string }) {
  const schema = await openapi.getSchema(document);
  return <OpenAPIPage {...props} document={document} preloaded={{ docs: { [document]: schema.bundled } }} />;
}
