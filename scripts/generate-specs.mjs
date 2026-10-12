// Fetches the WalletConnect Pay OpenAPI specs for every published API version, writes them to
// openapi/, generates one page per operation under content/docs/payments/api-reference/<version>/
// and updates the API Reference group (Payments tab → Get Started) in content/navigation.json
// + the "latest" redirect.
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content', 'docs');
const NAVIGATION_PATH = join(ROOT, 'content', 'navigation.json');
const REDIRECTS_PATH = join(ROOT, 'redirects.json');

const VERSIONS_URL = 'https://api.pay.walletconnect.com/versions';
const SERVICES = [
  { name: 'Core', baseUrl: 'https://api.pay.walletconnect.com' },
  { name: 'MX', baseUrl: 'https://api.merchant.pay.walletconnect.com' },
];

const VERSION_RE = /^\d{4}-\d{2}-\d{2}(\.preview)?$/;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

function validateVersions(versions) {
  for (const v of versions) {
    if (!VERSION_RE.test(v)) throw new Error(`Invalid version string: ${v}`);
  }
}

function mergeSpecs(specs, version) {
  const merged = {
    openapi: '3.1.0',
    info: { title: 'WalletConnect Pay API', version },
    servers: [{ url: SERVICES[0].baseUrl }],
    paths: {},
    tags: [],
    components: { schemas: {}, securitySchemes: {} },
    security: [],
  };

  const seenTags = new Set();

  for (const spec of specs) {
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      merged.paths[path] = { ...(merged.paths[path] || {}), ...methods };
      for (const op of Object.values(methods)) {
        for (const tagName of op.tags || []) {
          if (!seenTags.has(tagName)) {
            seenTags.add(tagName);
            merged.tags.push({ name: tagName });
          }
        }
      }
    }

    for (const tag of spec.tags || []) {
      if (!seenTags.has(tag.name)) {
        seenTags.add(tag.name);
        merged.tags.push(tag);
      }
    }

    for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
      if (merged.components.schemas[name]) {
        console.warn(`Schema collision: ${name} — last-write wins`);
      }
      merged.components.schemas[name] = schema;
    }

    for (const [name, scheme] of Object.entries(spec.components?.securitySchemes || {})) {
      merged.components.securitySchemes[name] = scheme;
    }
  }

  merged.security = specs[0]?.security || [];
  return merged;
}

function slugify(method, path) {
  return (method + path)
    .toLowerCase()
    .replace(/[{}]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function generatePages(version, spec) {
  const dir = join(CONTENT, 'payments', 'api-reference', version);
  await mkdir(dir, { recursive: true });

  // Group by second path segment: /v1/{segment}/...
  const groupOps = new Map();
  for (const [path, methods] of Object.entries(spec.paths)) {
    const segment = path.split('/')[2];
    const group = segment.charAt(0).toUpperCase() + segment.slice(1);
    if (!groupOps.has(group)) groupOps.set(group, []);
    for (const [method, op] of Object.entries(methods)) {
      groupOps.get(group).push({ method: method.toUpperCase(), path, op });
    }
  }

  const writes = [];
  const groups = [];
  const expectedFiles = new Set();
  for (const [group, ops] of groupOps) {
    const pages = [];
    for (const { method, path, op } of ops) {
      const slug = slugify(method, path);
      const filename = `${slug}.mdx`;
      expectedFiles.add(filename);
      const title = (op.summary || `${method} ${path}`).replace(/["\\]/g, '\\$&');
      const operations = JSON.stringify([{ path, method: method.toLowerCase() }]);
      const mdx = `---\ntitle: "${title}"\n---\n\n<APIPage document="${version}.json" operations={${operations}} />\n`;
      writes.push(writeFile(join(dir, filename), mdx));
      pages.push(`payments/api-reference/${version}/${slug}`);
    }
    groups.push({ group, pages });
  }

  const existing = await readdir(dir);
  for (const file of existing) {
    if (file.endsWith('.mdx') && !expectedFiles.has(file)) {
      writes.push(rm(join(dir, file)));
      console.log(`Removed stale page ${version}/${file}`);
    }
  }

  await Promise.all(writes);
  return groups;
}

async function generateSpec(version) {
  const specs = await Promise.all(SERVICES.map(({ baseUrl }) => fetchJson(`${baseUrl}/spec/${version}/openapi.json`)));
  const merged = mergeSpecs(specs, version);
  const outPath = join(ROOT, 'openapi', `${version}.json`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(merged, null, 2) + '\n');
  console.log(`Wrote ${outPath}`);
  return { version, spec: merged };
}

// The API reference lives at the bottom of the Payments tab's "Get Started" section: the shared
// overview pages first, then one collapsible group per API version (newest stable first).
const API_REFERENCE_GROUP = 'API Reference';

async function buildNavigation(currentNavigation, stableVersions, previewVersions, versionSpecs) {
  const makeVersionGroup = async (version, tag) => {
    const spec = versionSpecs.get(version);
    const groups = await generatePages(version, spec);
    console.log(`Generated ${groups.reduce((n, g) => n + g.pages.length, 0)} pages for ${version}`);
    return { group: tag ? `${version} (${tag})` : version, pages: groups };
  };

  const versionGroups = await Promise.all([
    ...stableVersions.map((v, i) => makeVersionGroup(v, i === 0 ? 'Latest' : undefined)),
    ...previewVersions.map((v) => makeVersionGroup(v, 'Preview')),
  ]);

  const apiReferenceGroup = {
    group: API_REFERENCE_GROUP,
    pages: [
      'payments/api-reference/',
      'payments/api-reference/authentication',
      'payments/api-reference/versioning',
      ...versionGroups,
    ],
  };

  const isApiReference = (page) => typeof page === 'object' && page.group === API_REFERENCE_GROUP;
  const tabs = currentNavigation.tabs
    .filter((t) => t.tab !== API_REFERENCE_GROUP)
    .map((t) => {
      if (t.tab !== 'Payments') return t;
      const groups = t.groups.map((g) =>
        g.group === 'Get Started'
          ? { ...g, pages: [...g.pages.filter((p) => !isApiReference(p)), apiReferenceGroup] }
          : g,
      );
      return { ...t, groups };
    });

  return { ...currentNavigation, tabs };
}

function buildManagedRedirects(latestStableVersion) {
  if (!latestStableVersion) return [];
  return [
    {
      source: '/payments/api-reference/latest/:slug*',
      destination: `/payments/api-reference/${latestStableVersion}/:slug*`,
    },
  ];
}

const MANAGED_REDIRECT_SOURCES = new Set(['/payments/api-reference/latest/:slug*']);

function mergeRedirects(existing, latestStableVersion) {
  const preserved = (existing || []).filter((r) => !MANAGED_REDIRECT_SOURCES.has(r.source));
  return [...preserved, ...buildManagedRedirects(latestStableVersion)];
}

async function main() {
  const { stable, preview } = await fetchJson(VERSIONS_URL);
  console.log(`Versions — stable: [${stable}], preview: [${preview}]`);

  const allVersions = [...stable, ...preview];
  validateVersions(allVersions);

  const apiRefDir = join(CONTENT, 'payments', 'api-reference');
  const apiDir = join(ROOT, 'openapi');
  const versionSet = new Set(allVersions);

  const staleRefs = (await readdir(apiRefDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && !versionSet.has(e.name))
    .map((e) => {
      console.log(`Removed stale directory content/docs/payments/api-reference/${e.name}`);
      return rm(join(apiRefDir, e.name), { recursive: true });
    });

  const staleSpecs = (await readdir(apiDir))
    .filter((f) => f.endsWith('.json') && !versionSet.has(f.replace(/\.json$/, '')))
    .map((f) => {
      console.log(`Removed stale spec openapi/${f}`);
      return rm(join(apiDir, f));
    });

  await Promise.all([...staleRefs, ...staleSpecs]);

  const results = await Promise.all(allVersions.map(generateSpec));
  const versionSpecs = new Map(results.map((r) => [r.version, r.spec]));

  const currentNavigation = JSON.parse(await readFile(NAVIGATION_PATH, 'utf-8'));
  const navigation = await buildNavigation(currentNavigation, stable, preview, versionSpecs);
  await writeFile(NAVIGATION_PATH, JSON.stringify(navigation, null, 2) + '\n');
  console.log(`Updated ${NAVIGATION_PATH}`);

  const currentRedirects = JSON.parse(await readFile(REDIRECTS_PATH, 'utf-8'));
  const redirects = mergeRedirects(currentRedirects, stable[0]);
  await writeFile(REDIRECTS_PATH, JSON.stringify(redirects, null, 2) + '\n');
  console.log(`Updated ${REDIRECTS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
