import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Icon } from '@/components/icon';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/logo/light.svg"
            alt="WalletConnect"
            width={91}
            height={24}
            className="h-6 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo/dark.svg"
            alt="WalletConnect"
            width={91}
            height={24}
            className="hidden h-6 w-auto dark:block"
            priority
          />
        </>
      ),
      url: '/',
    },
    links: [
      // Network is a hidden tab in navigation.json (so it keeps its sidebar), linked from here instead
      {
        // The navbar drops `icon` on plain links, so the globe goes in the text
        text: (
          <>
            <Icon icon="globe" className="me-1.5 inline size-4 align-[-0.1875em]" />
            Network
          </>
        ),
        url: '/network',
        active: 'nested-url',
      },
      {
        // Fumadocs renders `type: 'button'` as a plain text link in the navbar, so this is a custom
        // item styled as a filled primary button
        type: 'custom',
        on: 'nav',
        children: (
          <a
            href="https://share.hsforms.com/19Dpp4ayYR9uriB3xNAh0JAnxw6s"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-8 items-center gap-1 rounded-xl bg-fd-primary ps-3.5 pe-2.5 font-medium text-fd-primary-foreground text-sm transition-colors hover:bg-fd-primary/90"
          >
            Contact Sales
            <ChevronRight className="size-4" aria-hidden />
          </a>
        ),
      },
    ],
  };
}
