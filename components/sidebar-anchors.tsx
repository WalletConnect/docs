/**
 * Mintlify's `navigation.global.anchors`: links pinned above the sidebar tree on every tab.
 * A tab can swap some of them for its own (`anchors` in its `navigation.json` entry). They sit
 * in the notebook layout's `sidebar.banner` slot, right below the tabs dropdown — where they
 * were in Mintlify.
 */
'use client';

import { SidebarItem } from 'fumadocs-ui/components/sidebar/base';
import { useTreePath } from 'fumadocs-ui/contexts/tree';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icon';
import { cn } from '@/lib/cn';
import type { NavAnchor, TabFolder } from '@/lib/navigation';

// The notebook layout styles its sidebar items with an `itemVariants` it doesn't export, so the
// `link` variant is mirrored here to keep these in line with the tree below.
// See fumadocs-ui/dist/layouts/notebook/slots/sidebar.js
const itemClassName = cn(
  'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0',
  'transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none',
  'data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors',
);

export function SidebarAnchors({ anchors: globalAnchors }: { anchors: NavAnchor[] }) {
  const pathname = usePathname();
  const tab = useTreePath().find((node): node is TabFolder => node.type === 'folder' && node.root === true);
  const anchors = tab?.anchors ?? globalAnchors;
  if (anchors.length === 0) return null;

  return (
    // -mx-2 cancels the banner's padding so the icons line up with the tree items below
    <div className="-mx-2 flex flex-col gap-0.5">
      {anchors.map((anchor) => {
        const external = anchor.href.startsWith('http');
        return (
          <SidebarItem
            key={anchor.href}
            href={anchor.href}
            external={external}
            active={!external && pathname === anchor.href}
            icon={anchor.icon ? <Icon icon={anchor.icon} /> : undefined}
            className={itemClassName}
          >
            {anchor.anchor}
          </SidebarItem>
        );
      })}
    </div>
  );
}
