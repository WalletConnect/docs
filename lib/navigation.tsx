/**
 * Builds the Fumadocs page tree from `content/navigation.json`, which keeps the schema of
 * Mintlify's `docs.json` → `navigation` so the sidebar stays exactly as it was.
 *
 * Mapping:
 * - tab                → root folder (`root: true`), rendered as a navbar tab
 * - dropdown / version → typed root folder inside its tab, rendered as a dropdown switcher
 * - top-level group    → sidebar separator (section heading)
 * - nested group       → collapsible folder
 */
import type * as PageTree from 'fumadocs-core/page-tree';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import { Icon } from '@/components/icon';
import navigation from '@/content/navigation.json';
import { source } from '@/lib/source';

type NavPage = string | NavGroup;
interface NavGroup {
  group: string;
  icon?: string;
  expanded?: boolean;
  pages: NavPage[];
}
interface NavContainer {
  icon?: string;
  description?: string;
  tag?: string;
  groups?: NavGroup[];
  pages?: NavPage[];
}
interface NavDropdown extends NavContainer {
  dropdown: string;
}
interface NavVersion extends NavContainer {
  version: string;
  default?: boolean;
}
interface NavTab extends NavContainer {
  tab: string;
  /** Keep the tab out of the navbar tab row; its pages still get a sidebar and a URL. */
  hidden?: boolean;
  /** `end` pushes the tab to the far right of the navbar tab row (API Reference). */
  align?: 'start' | 'end';
  /** Replace global anchors with the same `anchor` label (others are appended) on this tab. */
  anchors?: NavAnchor[];
  dropdowns?: NavDropdown[];
  versions?: NavVersion[];
}

export interface NavAnchor {
  anchor: string;
  href: string;
  icon?: string;
}

/** Carries `hidden`, `align` and `anchors` on the page tree, so they can be read back from it. */
export type TabFolder = PageTree.Folder & { hidden?: boolean; align?: NavTab['align']; anchors?: NavAnchor[] };

let nextId = 0;
const id = (prefix: string) => `${prefix}-${nextId++}`;

function icon(name?: string) {
  return name ? <Icon icon={name} /> : undefined;
}

// Mintlify's method pills in the API reference sidebar, in the colours fumadocs-openapi uses for
// methods on the page itself. `self-start` keeps the pill on the first line of a wrapped title.
const methodColors: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-600 dark:text-green-400',
  POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PUT: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  PATCH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

function methodBadge(method: string) {
  return (
    <span
      className={`mt-0.5 w-11 shrink-0 self-start rounded-md py-0.5 text-center font-mono font-semibold text-[0.625rem] leading-4 ${methodColors[method] ?? 'bg-fd-muted text-fd-muted-foreground'}`}
    >
      {method === 'DELETE' ? 'DEL' : method}
    </span>
  );
}

function pageNode(path: string): PageTree.Item | undefined {
  const slugs = path === 'index' ? [] : path.replace(/\/index$/, '').split('/');
  const page = source.getPage(slugs);
  if (!page) {
    console.warn(`[navigation] page not found: ${path}`);
    return;
  }
  return {
    $id: page.url,
    type: 'page',
    name: page.data.sidebarTitle ?? page.data.title,
    icon: page.data._openapi && methodBadge(page.data._openapi.method),
    url: page.url,
    $ref: page.path,
  };
}

function buildPages(pages: NavPage[], depth: number): PageTree.Node[] {
  const out: PageTree.Node[] = [];
  for (const item of pages) {
    if (typeof item === 'string') {
      const node = pageNode(item);
      if (node) out.push(node);
      continue;
    }
    const children = buildPages(item.pages, depth + 1);
    if (depth === 0) {
      out.push({ $id: id('sep'), type: 'separator', name: item.group, icon: icon(item.icon) });
      out.push(...children);
    } else {
      out.push({
        $id: id('group'),
        type: 'folder',
        name: item.group,
        icon: icon(item.icon),
        defaultOpen: item.expanded,
        children,
      });
    }
  }
  return out;
}

function containerChildren(c: NavContainer): PageTree.Node[] {
  return [...buildPages(c.pages ?? [], 0), ...buildPages(c.groups ?? [], 0)];
}

function buildTab(tab: NavTab): PageTree.Folder {
  let children: PageTree.Node[];
  if (tab.dropdowns) {
    children = tab.dropdowns.map((d) => ({
      $id: id('dropdown'),
      type: 'folder',
      root: 'dropdown',
      name: d.dropdown,
      description: d.description,
      icon: icon(d.icon),
      children: containerChildren(d),
    }));
  } else if (tab.versions) {
    // default version first, so the tab links to it
    const versions = [...tab.versions].sort((a, b) => Number(!!b.default) - Number(!!a.default));
    children = versions.map((v) => ({
      $id: id('version'),
      type: 'folder',
      root: 'version',
      name: v.tag ? `${v.version} (${v.tag})` : v.version,
      description: v.description,
      icon: icon(v.icon ?? 'code-branch'),
      children: containerChildren(v),
    }));
  } else {
    children = containerChildren(tab);
  }

  return {
    $id: id('tab'),
    type: 'folder',
    root: true,
    name: tab.tab,
    icon: icon(tab.icon),
    hidden: tab.hidden,
    align: tab.align,
    anchors: tab.anchors && mergeAnchors(getGlobalAnchors(), tab.anchors),
    children,
  } as TabFolder;
}

function collectUrls(nodes: PageTree.Node[], out = new Set<string>()) {
  for (const node of nodes) {
    if (node.type === 'page') out.add(node.url);
    else if (node.type === 'folder') {
      if (node.index) out.add(node.index.url);
      collectUrls(node.children, out);
    }
  }
  return out;
}

function buildTree(): PageTree.Root {
  const tabs = (navigation as { tabs: NavTab[] }).tabs.map(buildTab);
  const listed = collectUrls(tabs);

  // Pages that exist but aren't in the navigation (Mintlify "hidden" pages) each get a hidden tab
  // of their own, with the page as the folder's index and no children. Being inside a root folder
  // keeps the navbar tab row (Fumadocs drops it for the tree's `fallback`), and with no children
  // the sidebar shows only the anchors instead of a list of unrelated hidden pages.
  // A page that a tab's own anchor points to (Payments → Report an Issue) keeps that tab's anchors.
  const anchorsByHref = new Map<string, NavAnchor[]>();
  for (const tab of tabs as TabFolder[]) {
    for (const anchor of tab.anchors ?? []) anchorsByHref.set(anchor.href, tab.anchors as NavAnchor[]);
  }
  const globalHrefs = new Set(getGlobalAnchors().map((a) => a.href));

  const unlisted = source
    .getPages()
    .filter((page) => !listed.has(page.url))
    .map(
      (page): TabFolder => ({
        $id: `unlisted:${page.url}`,
        type: 'folder',
        root: true,
        name: page.data.sidebarTitle ?? page.data.title,
        hidden: true,
        anchors: globalHrefs.has(page.url) ? undefined : anchorsByHref.get(page.url),
        index: { $id: page.url, type: 'page', name: page.data.sidebarTitle ?? page.data.title, url: page.url },
        children: [],
      }),
    );

  return {
    $id: 'root',
    name: 'WalletConnect Docs',
    children: [...tabs, ...unlisted],
  };
}

let cached: PageTree.Root | undefined;
export function getNavigationTree(): PageTree.Root {
  cached ??= buildTree();
  return cached;
}

/** Mintlify `navigation.global.anchors`: links shown above the sidebar tree on every tab. */
export function getGlobalAnchors(): NavAnchor[] {
  return (navigation as { global?: { anchors?: NavAnchor[] } }).global?.anchors ?? [];
}

function mergeAnchors(global: NavAnchor[], overrides: NavAnchor[]): NavAnchor[] {
  const byLabel = new Map(overrides.map((a) => [a.anchor, a]));
  const merged = global.map((a) => byLabel.get(a.anchor) ?? a);
  return [...merged, ...overrides.filter((a) => !global.some((g) => g.anchor === a.anchor))];
}

function firstUrl(nodes: PageTree.Node[], skip?: Set<string>): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page' && !node.external && !skip?.has(node.url)) return node.url;
    if (node.type === 'folder') {
      const url = node.index && !skip?.has(node.index.url) ? node.index.url : firstUrl(node.children, skip);
      if (url) return url;
    }
  }
}

function tabClassName(tab: TabFolder) {
  if (tab.hidden) return { className: 'hidden' };
  if (tab.align === 'end') return { className: 'lg:ms-auto' };
}

/**
 * Navbar tabs + dropdown options for every root folder. Fumadocs' `getLayoutTabs()` only
 * picks up root folders with a direct page child, which skips tabs made only of dropdowns.
 */
export function getNavigationTabs(tree = getNavigationTree()): LayoutTab[] {
  const tabs: LayoutTab[] = [];
  // API versions all start with the same Overview pages, so a later version would link to the
  // first version's page and the switcher could never select it. Each dropdown option links to
  // the first page that an earlier option doesn't already claim.
  const claimed = new Set<string>();
  const visit = (nodes: PageTree.Node[]) => {
    for (const node of nodes) {
      if (node.type !== 'folder') continue;
      let url: string | undefined;
      if (typeof node.root === 'string') {
        url = firstUrl([node], claimed);
        if (url) for (const u of collectUrls([node])) claimed.add(u);
      } else if (node.root) {
        url = node.index?.url ?? firstUrl(node.children);
      }
      if (url) {
        tabs.push({
          title: node.name,
          description: node.description,
          url,
          $folder: node,
          icon: node.icon ? <div className="size-full [&_svg]:size-full">{node.icon}</div> : undefined,
          // `hidden` tabs stay in the list so the tree still resolves them (and the mobile
          // switcher still labels the current one) — they just don't render in the tab row.
          // `lg:` because the tab row only shows from `lg`; below it the tabs are a dropdown list.
          props: tabClassName(node as TabFolder),
        });
      }
      visit(node.children);
    }
  };
  visit(tree.children);
  return tabs;
}
