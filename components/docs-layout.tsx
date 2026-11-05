import { SidebarTabsDropdown } from 'fumadocs-ui/components/sidebar/tabs/dropdown';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';
import { SidebarAnchors } from '@/components/sidebar-anchors';
import { baseOptions } from '@/lib/layout.shared';
import { getGlobalAnchors, getNavigationTabs, getNavigationTree } from '@/lib/navigation';

/**
 * The docs chrome: navbar tabs, the dropdown switcher, and the sidebar. Also used by app/not-found.tsx,
 * where `outsideTree` is set because the URL matches no page.
 */
export function DocsShell({ children, outsideTree = false }: { children: ReactNode; outsideTree?: boolean }) {
  const base = baseOptions();
  const tree = getNavigationTree();
  const tabs = getNavigationTabs(tree);
  // Mintlify dropdowns & API versions (typed root folders), as opposed to the navbar tabs
  const dropdowns = tabs.filter((tab) => typeof tab.$folder?.root === 'string');
  // Fumadocs only shows tabs whose folder contains the current page. With no page, keep the navbar
  // tabs as plain links (no folder) so the tab row still renders.
  const navbarTabs = outsideTree
    ? tabs.filter((tab) => typeof tab.$folder?.root !== 'string').map(({ $folder, ...tab }) => tab)
    : tabs;
  return (
    <DocsLayout
      {...base}
      tree={tree}
      tabs={navbarTabs}
      // Mintlify tabs → navbar tabs; Mintlify dropdowns & API versions → dropdown switcher, which
      // sits at the top of the sidebar rather than in the navbar (see app/global.css)
      tabMode="navbar"
      nav={{ ...base.nav, mode: 'top' }}
      // The dropdown switcher, then Mintlify global anchors, pinned above the sidebar tree. The
      // banner is rendered inside an array by Fumadocs' `Sidebar`, so it needs a key of its own.
      // Below `lg` Fumadocs' own sidebar dropdown already covers the switcher, so ours is hidden.
      sidebar={{
        banner: (
          <div key="sidebar-banner" className="flex flex-col gap-3">
            <SidebarTabsDropdown options={dropdowns} className="max-lg:hidden" />
            <SidebarAnchors anchors={getGlobalAnchors()} />
          </div>
        ),
        // hides the sidebar collapse toggle in the navbar
        collapsible: false,
      }}
    >
      {children}
    </DocsLayout>
  );
}
