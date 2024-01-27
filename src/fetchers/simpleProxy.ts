import { makeFullUrl } from '@/fetchers/common';
import { FetchLike } from '@/fetchers/fetch';
import { makeStandardFetcher } from '@/fetchers/standardFetch';
import { Fetcher } from '@/fetchers/types';

const headerMap: Record<string, string> = {
  cookie: 'X-Cookie',
  referer: 'X-Referer',
  origin: 'X-Origin',
  'user-agent': 'X-User-Agent',
  'x-real-ip': 'X-X-Real-Ip',
};

const responseHeaderMap: Record<string, string> = {
  'x-set-cookie': 'Set-Cookie',
};

export function makeSimpleProxyFetcher(proxyUrl: string, f: FetchLike): Fetcher {
  const proxiedFetch: Fetcher = async (url, ops) => {
    const fetcher = makeStandardFetcher(async (a, b) => {
      const res = await f(a, b);

      // set extra headers that cant normally be accessed
      res.extraHeaders = new Headers();
      Object.entries(responseHeaderMap).forEach((entry) => {
        const value = res.headers.get(entry[0]);
        if (!value) return;
        res.extraHeaders?.set(entry[0].toLowerCase(), value);
      });

      // set correct final url
      res.extraUrl = res.headers.get('X-Final-Destination') ?? res.url;
      return res;
    });

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
