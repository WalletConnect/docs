import { DocsShell } from '@/components/docs-layout';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <DocsShell>{children}</DocsShell>;
}
