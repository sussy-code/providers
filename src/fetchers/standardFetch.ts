import fetch from 'node-fetch';

import { serializeBody } from '@/fetchers/body';
import { makeFullUrl } from '@/fetchers/common';
import { Fetcher } from '@/fetchers/types';

export function makeStandardFetcher(f: typeof fetch): Fetcher {
  const normalFetch: Fetcher = (url, ops) => {
    const fullUrl = makeFullUrl(url, ops);

    const seralizedBody = serializeBody(ops.body);

    return f(fullUrl, {
      method: ops.method,
      headers: {
        ...seralizedBody.headers,
        ...ops.headers,
      },
      body: seralizedBody.body,
    });
  };

  return normalFetch;
}
