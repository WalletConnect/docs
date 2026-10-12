/** Landing-page building blocks, ported from Mintlify snippets/home/*.mdx. */
import type { ReactNode } from 'react';

export function Container({ children }: { children: ReactNode }) {
  return <div className="px-4 py-14 lg:px-10">{children}</div>;
}

export function Title({ children }: { children: ReactNode }) {
  // `not-prose`: MDX wraps text written on its own line in a <p>, and prose's margins on it
  // would offset the heading. Same reason as ProductCard below.
  return <div className="not-prose text-2xl tracking-tight text-fd-foreground">{children}</div>;
}

interface ProductCardProps {
  img: string;
  imgDark?: string;
  href: string;
  title: ReactNode;
  description?: ReactNode;
  model?: string;
  type?: string;
}

export function ProductCard({ img, imgDark, href, title, description, model, type }: ProductCardProps) {
  return (
    <a href={href} className="group not-prose mb-5 block">
      <div className="flex flex-col rounded-xl md:p-1">
        <div className="h-32 w-full overflow-hidden rounded-xl bg-fd-muted">
          <img
            src={img}
            alt=""
            loading="lazy"
            className="m-0 block h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 dark:hidden"
          />
          <img
            src={imgDark ?? img}
            alt=""
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
