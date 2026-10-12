import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { APIPage } from '@/components/api-page';
import { Icon } from '@/components/icon';
import { Img } from '@/components/img';
import { Mermaid } from '@/components/mermaid';
import { ChainList, WalletList } from '@/components/snippets/explorer-lists';
import { Container, ProductCard, Title } from '@/components/snippets/home';

export function getMDXComponents(components?: MDXComponents) {
  return {
    // Callout, Card, Cards and code block tabs
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Step,
    Steps,
    Tab,
    Tabs,
    img: Img,
    Icon,
    Mermaid,
    APIPage,
    // Formerly Mintlify snippets exporting components; available globally, no import needed.
    ChainList,
    WalletList,
    Container,
    Title,
    ProductCard,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
