import * as FormData from 'form-data';

export type FetcherOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  method?: 'HEAD' | 'GET' | 'POST';
  readHeaders?: string[];
  body?: Record<string, any> | string | FormData | URLSearchParams;
};

// Version of the options that always has the defaults set
// This is to make making fetchers yourself easier
export type DefaultedFetcherOptions = {
  baseUrl?: string;
  body?: Record<string, any> | string | FormData;
  headers: Record<string, string>;
  query: Record<string, string>;
  readHeaders: string[];
  method: 'HEAD' | 'GET' | 'POST';
};

export type FetcherResponse<T = any> = {
  statusCode: number;
  headers: Headers;
  finalUrl: string;
  body: T;
};

// This is the version that will be inputted by library users
export type Fetcher = {
  <T = any>(url: string, ops: DefaultedFetcherOptions): Promise<FetcherResponse<T>>;
};

// This is the version that scrapers will be interacting with
export type UseableFetcher = {
  <T = any>(url: string, ops?: FetcherOptions): Promise<T>;
  full: <T = any>(url: string, ops?: FetcherOptions) => Promise<FetcherResponse<T>>;
};
