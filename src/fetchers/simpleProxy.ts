import { makeFullUrl } from '@/fetchers/common';
import { FetchLike } from '@/fetchers/fetch';
import { makeStandardFetcher } from '@/fetchers/standardFetch';
import { Fetcher } from '@/fetchers/types';

const headerMap: Record<string, string> = {
  cookie: 'X-Cookie',
  referer: 'X-Referer',
  origin: 'X-Origin',
};

export function makeSimpleProxyFetcher(proxyUrl: string, f: FetchLike): Fetcher {
  const fetcher = makeStandardFetcher(f);
  const proxiedFetch: Fetcher = async (url, ops) => {
    const fullUrl = makeFullUrl(url, ops);

    const headerEntries = Object.entries(ops.headers).map((entry) => {
      const key = entry[0].toLowerCase();
      if (headerMap[key]) return [headerMap[key], entry[1]];
      return entry;
    });

    return fetcher(proxyUrl, {
      ...ops,
      query: {
        destination: fullUrl,
      },
      headers: Object.fromEntries(headerEntries),
      baseUrl: undefined,
    });
  };

  return proxiedFetch;
}
