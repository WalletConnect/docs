/** Landing-page building blocks, ported from Mintlify snippets/home/*.mdx. */
import type { ReactNode } from 'react';

export function Container({ children }: { children: ReactNode }) {
  return <div className="px-4 py-14 lg:px-10">{children}</div>;
}

/**
 * A section heading on a landing page. `mode: frame` pages render no title of their own, so the
 * first `<Title>` on the page must be `as="h1"` to give the page its single H1.
 */
export function Title({ children, as: Heading = 'h2' }: { children: ReactNode; as?: 'h1' | 'h2' }) {
  // `not-prose`: MDX wraps text written on its own line in a <p>, and prose's margins on it
  // would offset the heading. Same reason as ProductCard below.
  return <Heading className="not-prose text-2xl font-normal tracking-tight text-fd-foreground">{children}</Heading>;
}

interface ProductCardProps {
  img: string;
  imgDark?: string;
  /** Alt text for the image; defaults to "<title> illustration". */
  imgAlt?: string;
  href: string;
  title: ReactNode;
  description?: ReactNode;
  model?: string;
  type?: string;
}

export function ProductCard({ img, imgDark, imgAlt, href, title, description, model, type }: ProductCardProps) {
  // SEO audits flag empty alt text, so describe the image rather than mark it decorative
  const alt = imgAlt ?? (typeof title === 'string' ? `${title} illustration` : '');
  return (
    <a href={href} className="group not-prose mb-5 block">
      <div className="flex flex-col rounded-xl md:p-1">
        <div className="h-32 w-full overflow-hidden rounded-xl bg-fd-muted">
          <img
            src={img}
            alt={alt}
            loading="lazy"
            className="m-0 block h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 dark:hidden"
          />
          <img
            src={imgDark ?? img}
            alt={alt}
            loading="lazy"
            className="m-0 hidden h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 dark:block"
          />
        </div>
        <div className="flex flex-col gap-1 pt-3 pb-2">
          <h2 className="text-2xl font-medium tracking-tight text-fd-foreground transition-colors group-hover:text-fd-muted-foreground">
            {title}
          </h2>
          {description && <p className="text-sm font-medium text-fd-muted-foreground">{description}</p>}
          {(model || type) && (
            <div className="mt-2 mb-1 flex gap-2">
              {model && <span className="rounded-lg bg-fd-muted px-2 py-1 text-sm font-medium">{model}</span>}
              {type && (
                <span className="rounded-lg bg-fd-primary px-2 py-1 text-sm font-medium text-fd-primary-foreground">
                  {type}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

/** The product entry points, shown on the home page and the 404 page. */
export function ProductCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ProductCard
        title="Wallets"
        description="Reach users on the network by joining our ecosystem of wallets."
        href="/wallets"
        img="/images/wallet.svg"
        imgDark="/images/wallet-dark.svg"
      />
      <ProductCard
        title="Apps"
        description="Provide wallet connections and user authentication for your app."
        href="/apps"
        img="/images/app.svg"
        imgDark="/images/app-dark.svg"
      />
      <ProductCard
        title="Payments"
        description="Enable stablecoin and crypto payments as a wallet, app, PSP or merchant."
        href="/payments"
        img="/images/credit-card.svg"
        imgDark="/images/credit-card-dark.svg"
      />
      <ProductCard
        title="WalletConnect Network"
        description="Discover the network powering 700+ wallets and 80,000+ apps."
        href="/network"
        img="/images/network.svg"
        imgDark="/images/network-dark.svg"
      />
      <ProductCard
        title="Wallet Verification"
        description="Prove that a user controls a crypto wallet by having them sign a message."
        href="/wallet-verification"
        img="/images/wallet-verification.svg"
        imgDark="/images/wallet-verification-dark.svg"
      />
      <ProductCard
        title="API Reference"
        description="Explore every WalletConnect Pay API endpoint, with authentication and versioning."
        href="/payments/api-reference"
        img="/images/api-reference.svg"
        imgDark="/images/api-reference-dark.svg"
      />
    </div>
  );
}
