<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# WalletConnect Docs

WalletConnect's documentation site, built with [Fumadocs](https://fumadocs.dev) (`fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui` as `@fumadocs/base-ui`) on Next.js. It was migrated from Mintlify: every Mintlify URL must keep working, and content now uses native Fumadocs components only.

For Fumadocs APIs, read the installed sources in `node_modules/fumadocs-*/dist` (the `.d.ts` files) before relying on the docs site; versions are pinned in `package.json`.

## Commands

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm build         # statically generates every page; fails on any broken MDX
pnpm lint          # Biome (code only; content/, openapi/ and public/ are ignored)
pnpm format        # Biome format --write
pnpm types:check   # next typegen && tsc --noEmit
pnpm generate      # refetch the OpenAPI specs and regenerate the API reference
```

Before finishing a change, run `pnpm build` for content changes, and `pnpm lint` plus `pnpm types:check` for code changes.

## Project layout

| Path | What it is |
| --- | --- |
| `content/docs/**/*.mdx` | Pages. The file path is the URL: `content/docs/network/specs.mdx` → `/network/specs`, and `index.mdx` maps to its folder. |
| `content/navigation.json` | Sidebar, tabs, dropdowns and anchors. It keeps the schema of Mintlify's `docs.json` → `navigation`. There are no `meta.json` files. |
| `content/snippets/` | Reusable MDX partials. |
| `redirects.json` | Redirects, loaded by `next.config.mjs`. |
| `openapi/*.json` | WalletConnect Pay OpenAPI specs, one per API version. Generated. |
| `public/images/` | Images. Reference them as `/images/...`. |
| `lib/source.ts` | Fumadocs source: frontmatter schema and the remark/rehype plugins. |
| `lib/navigation.tsx` | Turns `navigation.json` into the Fumadocs page tree. |
| `components/mdx.tsx` | Every component available in MDX without an import. |

## Adding or moving pages

- Create the `.mdx` file under `content/docs/`, then add its path (no extension, e.g. `"wallets/features/verify"`) to `content/navigation.json`. A page missing from the navigation still builds and has a URL, but no sidebar entry; `lib/navigation.tsx` warns about navigation entries that point to missing pages.
- Moving or renaming a page changes its URL. Add a redirect from the old path to `redirects.json` and update links to it across `content/`.
- Use folder names in lowercase kebab-case, matching the existing tree (`wallets/react-native/cloud/relay.mdx`).

## Frontmatter

```yaml
---
title: "Webhooks"
sidebarTitle: "Overview"
description: "Get notified in real time as payments move through their lifecycle."
---
```

- `title` (required) is the page's H1. Don't add a `# Heading` in the body; start sections at `##`.
- `description` is one sentence ending in a period. It shows under the title and in search, OG images and `llms.txt`, so add one to every new page.
- `sidebarTitle` is the sidebar label when it should be shorter than `title`.
- `mode: frame` renders a landing page with no title, TOC or page actions (`index.mdx`, `payments/index.mdx`). Don't use it on regular pages. `mode: wide` renders a full-width page.

## MDX components

Use Fumadocs components. The Mintlify ones (`<Note>`, `<Info>`, `<Tip>`, `<Warning>`, `<CardGroup>`, `<CodeGroup>`, `<Frame>`, `<AccordionGroup>`, `<Expandable>`) no longer exist and break the build. Everything below is registered in `components/mdx.tsx` and needs no import.

### Callouts

```mdx
<Callout type="info">
Your Project ID is available in the [WalletConnect Dashboard](https://dashboard.walletconnect.com).
</Callout>
```

- Use `type="info"` for context, `type="warning"` for anything that can break an integration or lose funds, and `type="idea"` for tips and best practices. Fumadocs also accepts `success` and `error`.
- Add `title="..."` only when the callout needs a heading.
- Keep callouts short and don't stack several in a row. If it's core content, write it as prose.

### Cards

```mdx
<Cards>
  <Card title="React" icon={<Icon icon="react" />} href="/apps/react/installation">
    Get started with WalletConnect as an App in React.
  </Card>
</Cards>
```

- Always wrap cards in `<Cards>`, even a single one.
- `<Icon icon="..." />` takes Font Awesome names, falling back to Lucide and Simple Icons (`components/icon.tsx`). Add a Pro-only name to its `aliases` map.

### Steps

```mdx
<Steps>
  <Step>
    ### Install the SDK
    Run the install command for your package manager.
  </Step>
</Steps>
```

Each `<Step>` opens with a `###` heading. The `[step]` heading syntax isn't enabled here.

### Tabs

For code only, use code block tabs, not `<Tabs>`:

````mdx
```bash tab="npm"
npm install @reown/appkit
```

```bash tab="pnpm"
pnpm add @reown/appkit
```
````

For install commands, prefer a single ` ```npm ` block: Fumadocs renders it as npm, pnpm, Yarn and Bun tabs.

For mixed content (prose plus code), use `<Tabs>`. Every `value` must match an entry in `items`:

```mdx
<Tabs items={["Wagmi", "Ethers", "Solana"]}>
<Tab value="Wagmi">

Content, with blank lines around it so Markdown inside renders.

</Tab>
</Tabs>
```

### Accordions

```mdx
<Accordions multiple>
  <Accordion title="Does the user need to enter their information for every transaction?">
    No. Once collected, the information is reused.
  </Accordion>
</Accordions>
```

Always wrap `<Accordion>` in `<Accordions>`. Use them for FAQs and optional detail, never for steps the reader must follow.

### Code blocks

- Always set a language. Use `typescript`, `tsx`, `bash`, `json`, `swift`, `kotlin`, `dart` and `csharp`, matching the surrounding page.
- Name the file when it matters: ` ```ts title="app.ts" `.
- Notations available: `// [!code highlight]`, `// [!code word:projectId]`, `// [!code ++]` / `// [!code --]`, `// [!code focus]`, and `lineNumbers` in the meta.
- Code samples must be copy-pasteable. Use placeholders like `YOUR_PROJECT_ID`, never real keys or secrets.

### Images, diagrams and math

- Prefer Markdown images, `![Copy the Project ID from the dashboard](/images/cloud/1.png)`: they get dimensions at build time and click-to-zoom. A raw `<img>` has neither, so use it only when you need attributes Markdown can't express.
- Always write alt text that describes what the image shows.
- Diagrams: a ` ```mermaid ` code block.
- Math: `$$ ... $$` (KaTeX).

### Site-specific components

- `<APIPage document="..." operations={[...]} />`: API reference pages (generated, see below).
- `<ChainList />`, `<WalletList />`: live lists from the WalletConnect Explorer.
- `<Container>`, `<Title>`, `<ProductCard>`: landing pages only (`mode: frame`).

### Headings and links

- Heading anchors are generated from the text. Set a stable one with `## Delivery guarantees [#delivery-guarantees]`, and hide a heading from the TOC with `[!toc]`.
- Link to other pages with absolute paths (`/payments/webhooks#retries`), the way existing content does. Internal links are prefetched; external links open in a new tab automatically.

### Snippets

Shared content lives in `content/snippets/`. Import it and pass `components` so the snippet can use the MDX components:

```mdx
import Relay from "@/content/snippets/cloud/relay.mdx";

<Relay components={props.components} />
```

Put imports right after the frontmatter. Reuse a snippet instead of copying the same text across platform pages.

## Generated files (don't hand-edit)

- `openapi/*.json`, `content/docs/payments/api-reference/<version>/`, the API Reference group in `navigation.json` and the `/payments/api-reference/latest` redirect are all rewritten by `pnpm generate` (also the **Update OpenAPI Specs** workflow). Change `scripts/generate-specs.mjs` instead. `content/docs/payments/api-reference/{index,authentication,versioning}.mdx` are hand-written.
- `.source/` is generated by `fumadocs-mdx`.

## Writing style

- Address the reader as "you". Use "we" for WalletConnect.
- Write headings in sentence case (`## Verify signatures`, `## How test mode works`). Some older pages use Title Case; switch them to sentence case when you edit those sections.
- Lead with what the reader can do or get, then how. Keep sentences short and in the active voice.
- Use the product names WalletConnect, WalletConnect Pay, WalletKit, AppKit, Project ID and WalletConnect Dashboard consistently.
- Wrap code identifiers, API paths, HTTP methods, status codes and file names in backticks (`POST`, `200`, `payment_state_version`).
- Use tables for reference data like events, fields and error codes, and numbered `<Steps>` for procedures.
- Platform pages (`wallets/<platform>/...`, `apps/<framework>/...`) mirror each other. When you change one, check whether its siblings need the same change.

## Code style

- TypeScript and React, formatted by Biome: 2-space indent, single quotes, 120-column lines, organized imports.
- New MDX components go in `components/` and get registered in `components/mdx.tsx`. Prefer an existing Fumadocs component over a new one.
- Comments explain why, not what. Many reference the Mintlify behaviour they preserve; keep that context when you edit them.
- Commit subjects are short and imperative ("Reword Verify API disclaimer to drop bulletproof wording").

# Fumadocs UI is aliased to the Base UI build

`package.json` declares `"fumadocs-ui": "npm:@fumadocs/base-ui@<version>"`. Fumadocs publishes two UI packages from the same release: `fumadocs-ui` (Radix UI) and `@fumadocs/base-ui` (Base UI). The alias installs the Base UI build under the `fumadocs-ui` name, so all imports stay `fumadocs-ui/...`.

It's a legitimate choice, not a hack. The catch is that its version has to be kept in step with `fumadocs-core` by hand.