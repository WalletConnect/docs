import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createOpenAPI } from 'fumadocs-openapi/server';

const OPENAPI_DIR = join(process.cwd(), 'openapi');

/**
 * One spec per API version, generated into openapi/ by `pnpm generate` (scripts/generate-specs.mjs).
 * Pages reference a spec by file name: <APIPage document="2026-02-18.json" ... />
 */
export const openapi = createOpenAPI({
  input: Object.fromEntries(
    readdirSync(OPENAPI_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => [file, join(OPENAPI_DIR, file)]),
  ),
});
