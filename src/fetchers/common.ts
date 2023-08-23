import { FetcherOptions } from '@/fetchers/types';

// make url with query params and base url used correctly
export function makeFullUrl(url: string, ops?: FetcherOptions): string {
  // glue baseUrl and rest of url together
  const fullUrl = ops?.baseUrl ?? '';
  // TODO make full url

  const parsedUrl = new URL(fullUrl);
  Object.entries(ops?.query ?? {}).forEach(([k, v]) => {
    parsedUrl.searchParams.set(k, v);
  });

  return parsedUrl.toString();
}
