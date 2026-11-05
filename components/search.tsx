'use client';

import { useStaticSearch } from 'fumadocs-core/search/client/orama-static';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';

/**
 * ⌘K search over the index exported to /api/search.json at build time, queried in the browser.
 * The site is a static export, so there is no search server to call. The `.json` extension
 * gets the index served as compressible JSON.
 */
export default function StaticSearchDialog(props: SharedProps) {
  const search = useStaticSearch({ from: '/api/search.json' });

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
