import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

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
      { text: 'WalletGuide', url: 'https://walletguide.walletconnect.network/', external: true },
      {
        type: 'button',
        text: 'Request Demo',
        url: 'https://share.hsforms.com/19Dpp4ayYR9uriB3xNAh0JAnxw6s',
        external: true,
        on: 'nav',
      },
    ],
  };
}
