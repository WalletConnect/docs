import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const VERSIONS_URL = "https://api.pay.walletconnect.com/versions";
const SERVICES = [
  { name: "Core", baseUrl: "https://api.pay.walletconnect.com" },
  { name: "MX", baseUrl: "https://api.merchant.pay.walletconnect.com" },
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
    openapi: "3.1.0",
    info: { title: "WalletConnect Pay API", version },
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

    for (const [name, schema] of Object.entries(
      spec.components?.schemas || {}
    )) {
      if (merged.components.schemas[name]) {
        console.warn(`Schema collision: ${name} — last-write wins`);
      }
      merged.components.schemas[name] = schema;
    }

    for (const [name, scheme] of Object.entries(
      spec.components?.securitySchemes || {}
    )) {
      merged.components.securitySchemes[name] = scheme;
    }
  }

  merged.security = specs[0]?.security || [];
  return merged;
}

function slugify(method, path) {
  return (method + path)
    .toLowerCase()
    .replace(/[{}]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generatePages(version, spec) {
  const dir = join(ROOT, "api-reference", version);
  await mkdir(dir, { recursive: true });

  // Group by second path segment: /v1/{segment}/...
  const groupOps = new Map();
  for (const [path, methods] of Object.entries(spec.paths)) {
    const segment = path.split("/")[2];
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
      const title = (op.summary || `${method} ${path}`).replace(/["\\]/g, "\\$&");
      const mdx = `---\ntitle: "${title}"\nopenapi: "api/${version}.json ${method} ${path}"\n---\n`;
      writes.push(writeFile(join(dir, filename), mdx));
      pages.push(`api-reference/${version}/${slug}`);
    }
    groups.push({ group, pages });
  }

  const existing = await readdir(dir);
  for (const file of existing) {
    if (file.endsWith(".mdx") && !expectedFiles.has(file)) {
      writes.push(rm(join(dir, file)));
      console.log(`Removed stale page ${version}/${file}`);
    }
  }

  await Promise.all(writes);
  return groups;
}

async function generateSpec(version) {
  const specs = await Promise.all(
    SERVICES.map(({ baseUrl }) =>
      fetchJson(`${baseUrl}/spec/${version}/openapi.json`)
    )
  );
  const merged = mergeSpecs(specs, version);
  const outPath = join(ROOT, "api", `${version}.json`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);
  return { version, spec: merged };
}

function findPaymentsTab(navigation) {
  if (navigation.versions) {
    const tabs = navigation.versions[0]?.tabs || [];
    return tabs.find((t) => t.tab === "Payments");
  }
  if (navigation.tabs) {
    return navigation.tabs.find((t) => t.tab === "Payments");
  }
  return null;
}

async function buildNavigation(
  currentConfig,
  stableVersions,
  previewVersions,
  versionSpecs
) {
  const paymentsTab = findPaymentsTab(currentConfig.navigation);

  const makeVersionEntry = async (version, { tag, isDefault } = {}) => {
    const spec = versionSpecs.get(version);
    const groups = await generatePages(version, spec);
    console.log(
      `Generated ${groups.reduce((n, g) => n + g.pages.length, 0)} pages for ${version}`
    );

    const entry = {
      version,
      tabs: [
        paymentsTab,
        {
          tab: "API Reference",
          icon: "code",
          groups: [
            { group: "Overview", pages: ["api-reference/index", "api-reference/versioning"] },
            ...groups,
          ],
        },
      ],
    };
    if (tag) entry.tag = tag;
    if (isDefault) entry.default = true;
    return entry;
  };

  const versions = await Promise.all([
    ...stableVersions.map((v, i) =>
      makeVersionEntry(v, {
        tag: i === 0 ? "Latest" : undefined,
        isDefault: i === 0,
      })
    ),
    ...previewVersions.map((v) => makeVersionEntry(v, { tag: "Preview" })),
  ]);

  return {
    versions,
    global: currentConfig.navigation.global,
  };
}

async function main() {
  const { stable, preview } = await fetchJson(VERSIONS_URL);
  console.log(`Versions — stable: [${stable}], preview: [${preview}]`);

  const allVersions = [...stable, ...preview];
  validateVersions(allVersions);

  const apiRefDir = join(ROOT, "api-reference");
  const apiDir = join(ROOT, "api");
  const versionSet = new Set(allVersions);

  const staleRefs = (await readdir(apiRefDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && !versionSet.has(e.name))
    .map((e) => {
      console.log(`Removed stale directory api-reference/${e.name}`);
      return rm(join(apiRefDir, e.name), { recursive: true });
    });

  const staleSpecs = (await readdir(apiDir))
    .filter((f) => f.endsWith(".json") && !versionSet.has(f.replace(/\.json$/, "")))
    .map((f) => {
      console.log(`Removed stale spec api/${f}`);
      return rm(join(apiDir, f));
    });

  await Promise.all([...staleRefs, ...staleSpecs]);

  const results = await Promise.all(allVersions.map(generateSpec));
  const versionSpecs = new Map(results.map((r) => [r.version, r.spec]));

  const docsJsonPath = join(ROOT, "docs.json");
  const currentConfig = JSON.parse(await readFile(docsJsonPath, "utf-8"));

  const updated = { ...currentConfig };
  delete updated.openapi;
  updated.navigation = await buildNavigation(
    currentConfig,
    stable,
    preview,
    versionSpecs
  );

  await writeFile(
    docsJsonPath,
    JSON.stringify(updated, null, 2) + "\n"
  );
  console.log(`Updated ${docsJsonPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
