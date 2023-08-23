import { Fetcher } from '@/utils/fetcher';

export interface ScrapeContext {
  proxiedFetcher: Fetcher;
  fetcher: Fetcher;
}
