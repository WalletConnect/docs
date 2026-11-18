import { createFromSource } from 'fumadocs-core/search/server';
import { indexedSource } from '@/lib/source';

// Exported once at build time and searched in the browser (components/search.tsx)
export const dynamic = 'force-static';
export const revalidate = false;

export const { staticGET: GET } = createFromSource(indexedSource);
