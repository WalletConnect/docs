import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import './global.css';
import 'katex/dist/katex.css';
import { Inter } from 'next/font/google';
import { PostHogProvider } from '@/components/posthog';
import SearchDialog from '@/components/search';
import { appDescription, appName, homeTitle, siteUrl } from '@/lib/shared';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: homeTitle, template: `%s | ${appName}` },
  description: appDescription,
  openGraph: { siteName: appName, type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <PostHogProvider>
          <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
