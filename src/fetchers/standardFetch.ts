import { makeFullUrl } from '@/fetchers/common';
import { Fetcher } from '@/fetchers/types';

export function makeStandardFetcher(f: typeof fetch): Fetcher {
  const normalFetch: Fetcher = (url, ops) => {
    const fullUrl = makeFullUrl(url, ops);

    return f(fullUrl, {
      method: ops.method,
      body: JSON.stringify(ops.body), // TODO content type headers + proper serialization
    });
  };

  return normalFetch;
}
