'use client';

/**
 * Searchable lists backed by the Explorer API (wallets) and the web3modal API (chains); clicking an entry copies its ID.
 * Ported from Mintlify snippets/chainlist.mdx and snippets/walletlist.mdx.
 */
import { useEffect, useMemo, useState } from 'react';

const PROJECT_ID = '8e998cd112127e42dce5e2bf74122539';
const SOURCES = {
  chains: `https://api.web3modal.org/getChains?projectId=${PROJECT_ID}&st=docs&sv=1.0.0`,
  wallets: `https://explorer-api.walletconnect.com/v3/wallets?projectId=${PROJECT_ID}`,
};

interface Entry {
  id: string;
  name: string;
  image?: string;
}

function useExplorer(kind: 'chains' | 'wallets') {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch(SOURCES[kind])
      .then((res) => res.json())
      .then((data) => {
        if (kind === 'chains') {
          setEntries(
            (data.data as { name: string; namespace: string; reference: string }[]).map((c) => ({
              id: `${c.namespace}:${c.reference}`,
              name: c.name,
            })),
          );
        } else {
          setEntries(
            Object.values<{ id: string; name: string; image_url: { sm: string } }>(data.listings).map((w) => ({
              id: w.id,
              name: w.name,
              image: w.image_url?.sm,
            })),
          );
        }
      })
      .catch(() => setError(true));
  }, [kind]);
  return { entries, error };
}

function ExplorerList({
  kind,
  placeholder,
  copiedLabel,
}: {
  kind: 'chains' | 'wallets';
  placeholder: string;
  copiedLabel: string;
}) {
  const { entries, error } = useExplorer(kind);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, query]);

  const copy = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 3000);
  };

  return (
    <div className="not-prose my-5">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mb-5 w-full rounded-lg border bg-fd-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fd-primary"
      />
      {error && <p className="text-sm text-fd-muted-foreground">Could not load the list. Please try again later.</p>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
        {filtered.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => copy(entry.id)}
            className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border bg-fd-card p-2 text-center text-sm transition-colors hover:bg-fd-accent"
          >
            {copied === entry.id ? (
              copiedLabel
            ) : (
              <>
                {entry.image && <img src={entry.image} width={40} height={40} alt="" loading="lazy" />}
                <span>{entry.name}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChainList() {
  return <ExplorerList kind="chains" placeholder="Search for a chain..." copiedLabel="Chain ID copied!" />;
}

export function WalletList() {
  return <ExplorerList kind="wallets" placeholder="Search for a wallet..." copiedLabel="Wallet ID copied!" />;
}
