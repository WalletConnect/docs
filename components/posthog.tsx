'use client';

import posthog from 'posthog-js';
import { PostHogProvider as Provider } from 'posthog-js/react';
import { type ReactNode, useEffect } from 'react';

// Same project/host Mintlify used (docs.json → integrations.posthog). Override via env if needed.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? 'phc_yUywlbA5HctEGSHSK7ueMEH56ktyqyqEBtY4Cl35Fgf';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://pineapple.walletconnect.com';

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: 'history_change',
      person_profiles: 'identified_only',
    });
  }, []);

  return <Provider client={posthog}>{children}</Provider>;
}
