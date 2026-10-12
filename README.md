# WalletConnect Docs

WalletConnect's documentation site, built with [Fumadocs](https://fumadocs.dev) on Next.js. It was migrated from Mintlify, and every URL from the Mintlify site still works.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build: statically generates every page and fails on any broken MDX
pnpm lint
```

## Project layout

| Path | What it is |
| --- | --- |
| `content/docs/**/*.mdx` | Pages. The file path is the URL (`content/docs/network/specs.mdx` → `/network/specs`; an `index.mdx` maps to its folder, so `content/docs/wallets/index.mdx` → `/wallets`). |
| `content/navigation.json` | Sidebar and tabs. It uses the same schema as Mintlify's `docs.json` → `navigation`. |
| `content/snippets/` | Reusable MDX partials (formerly `/snippets`). |
| `redirects.json` | Redirects, loaded by `next.config.mjs`. |
| `openapi/*.json` | WalletConnect Pay OpenAPI specs, one per API version. |
| `public/` | Images, logos, and other static files. |
| `components/mintlify.tsx` | Mintlify-compatible components: `Card`, `CardGroup`, `Columns`, `Tabs`/`Tab`, `CodeGroup`, `Steps`/`Step`, `Note`/`Info`/`Tip`/`Warning`/`Check`/`Danger`, `Accordion`/`AccordionGroup`, `Frame`, `Tooltip`, `Expandable`, and the legacy `Table`. |
| `lib/navigation.tsx` | Turns `navigation.json` into the Fumadocs page tree. |

## Writing docs

- **New page:** create an `.mdx` file under `content/docs/`, then add its path to `content/navigation.json`. Pages that aren't in the navigation still build and can be reached by URL.
- **Frontmatter:** `title`, `description`, `sidebarTitle` (the sidebar label), and `mode: frame` (a landing page with no title, TOC, or page actions).
- **Components:** the Mintlify components listed above work without an import. So do `<Icon icon="..." />` (Font Awesome names), `<Mermaid>` (or a ```` ```mermaid ```` code block), `$$ LaTeX $$`, `<ChainList />`, `<WalletList />`, `<ProductCard />`, `<Container>`, and `<Title>`.
- **Code block titles:** write ```` ```ts title="app.ts" ````. Inside `<CodeGroup>`, each title becomes a tab label.
- **Snippets:** import them with `import Relay from "@/content/snippets/cloud/relay.mdx"` and render them with `<Relay components={props.components} />`. You have to pass `components` so the snippet can use the Mintlify components.

### Navigation (`content/navigation.json`)

| Mintlify concept | Rendered as |
| --- | --- |
| `tabs[]` | Navbar tabs |
| `dropdowns[]` (Wallets → Web, Android, …) and `versions[]` | A switcher next to the tabs |
| Top-level `group` | A section heading in the sidebar |
| Nested `group` | A collapsible folder |
| `global.anchors[]` | Links pinned above the sidebar on every tab |
| `anchors[]` on a tab (Payments → Report an Issue) | Replaces the global anchor with the same `anchor` label on that tab |
| A page not listed anywhere | Still gets a URL and the tab row; its sidebar shows only the anchors |

## API reference

API reference pages render `<APIPage document="<version>.json" operations={[...]} />` with [fumadocs-openapi](https://fumadocs.dev/docs/integrations/openapi).

`pnpm generate` (or the **Update OpenAPI Specs** GitHub workflow) does four things:

1. Fetches the latest specs.
2. Rewrites `openapi/`.
3. Rewrites `content/docs/payments/api-reference/<version>/`.
4. Updates the API Reference group (Payments tab → Get Started) in `navigation.json` and the `/payments/api-reference/latest` redirect.

## Built-in extras

- `⌘K` search, built on Orama with a static index.
- The `.md` version of every page (`/wallets.md`), plus `/llms.txt` and `/llms-full.txt`.
- Per-page actions: "Copy Markdown" and "Open in ChatGPT / Claude / …".
- OG images under `/og/...`.
- PostHog analytics, on the same project and host as before. Override them with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.
