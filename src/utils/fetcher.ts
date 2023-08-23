export type FetcherOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: Record<string, any> | string | FormData;
};

export type Fetcher<T = any> = {
  (url: string, ops?: FetcherOptions): T;
};
