import * as FormData from 'form-data';

export type FetcherOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: Record<string, any> | string | FormData | URLSearchParams;
};

export type DefaultedFetcherOptions = {
  baseUrl?: string;
  body?: Record<string, any> | string | FormData;
  headers: Record<string, string>;
  query: Record<string, string>;
  method: 'GET' | 'POST';
};

export type Fetcher<T = any> = {
  (url: string, ops: DefaultedFetcherOptions): Promise<T>;
};

// this feature has some quality of life features
export type UseableFetcher<T = any> = {
  (url: string, ops?: FetcherOptions): Promise<T>;
};
