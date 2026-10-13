import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import Script from 'next/script';
import './global.css';
import 'katex/dist/katex.css';
import { Inter } from 'next/font/google';
import { PostHogProvider } from '@/components/posthog';
import SearchDialog from '@/components/search';
import { appDescription, appName, siteUrl } from '@/lib/shared';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: appName, template: `%s | ${appName}` },
  description: appDescription,
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <PostHogProvider>
          <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
        </PostHogProvider>
        {/* Powers the "Copy prompt" button on /payments/webhooks (ported from Mintlify) */}
        <Script src="/copy-agent-prompt.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
