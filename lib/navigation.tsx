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

/** Carries `hidden` and `anchors` on the page tree, so they can be read back from it. */
export type TabFolder = PageTree.Folder & { hidden?: boolean; anchors?: NavAnchor[] };

let nextId = 0;
const id = (prefix: string) => `${prefix}-${nextId++}`;

function icon(name?: string) {
  return name ? <Icon icon={name} /> : undefined;
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
      description: v.description ?? `API version ${v.version}`,
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

function firstUrl(nodes: PageTree.Node[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page' && !node.external) return node.url;
    if (node.type === 'folder') {
      const url = node.index?.url ?? firstUrl(node.children);
      if (url) return url;
    }
  }
}

/**
 * Navbar tabs + dropdown options for every root folder. Fumadocs' `getLayoutTabs()` only
 * picks up root folders with a direct page child, which skips tabs made only of dropdowns.
 */
export function getNavigationTabs(tree = getNavigationTree()): LayoutTab[] {
  const tabs: LayoutTab[] = [];
  const visit = (nodes: PageTree.Node[]) => {
    for (const node of nodes) {
      if (node.type !== 'folder') continue;
      const url = node.root ? (node.index?.url ?? firstUrl(node.children)) : undefined;
      if (url) {
        tabs.push({
          title: node.name,
          description: node.description,
          url,
          $folder: node,
          icon: node.icon ? <div className="size-full [&_svg]:size-full">{node.icon}</div> : undefined,
          // `hidden` tabs stay in the list so the tree still resolves them (and the mobile
          // switcher still labels the current one) — they just don't render in the tab row.
          props: (node as TabFolder).hidden ? { className: 'hidden' } : undefined,
        });
      }
      visit(node.children);
    }
  };
  visit(tree.children);
  return tabs;
}
