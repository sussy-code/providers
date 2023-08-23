import { Fetcher } from '@/utils/fetcher';

export interface ProviderBuilderOptions {
  // fetcher, every web request gets called through here
  fetcher: Fetcher;

  // proxied fetcher, if the scraper needs to access a CORS proxy. this fetcher will be called instead
  // of the normal fetcher. Defaults to the normal fetcher.
  proxiedFetcher?: Fetcher;
}

export interface Providers {}

export function makeProviders(ops: ProviderBuilderOptions): Providers {
  return {};
}
