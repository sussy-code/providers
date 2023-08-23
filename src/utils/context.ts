import { UseableFetcher } from '@/fetchers/types';

export interface ScrapeContext {
  proxiedFetcher: UseableFetcher;
  fetcher: UseableFetcher;
  progress(val: number): void;
}
