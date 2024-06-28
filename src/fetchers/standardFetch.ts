import { serializeBody } from '@/fetchers/body';
import { makeFullUrl } from '@/fetchers/common';
import { FetchLike, FetchReply } from '@/fetchers/fetch';
import { Fetcher } from '@/fetchers/types';

function getHeaders(list: string[], res: FetchReply): Headers {
  const output = new Headers();
  list.forEach((header) => {
    const realHeader = header.toLowerCase();
    const realValue = res.headers.get(realHeader);
    const extraValue = res.extraHeaders?.get(realHeader);
    const value = extraValue ?? realValue;
    if (!value) return;
    output.set(realHeader, value);
  });
  return output;
}

export function makeStandardFetcher(f: FetchLike): Fetcher {
  const normalFetch: Fetcher = async (url, ops) => {
    const fullUrl = makeFullUrl(url, ops);
    const seralizedBody = serializeBody(ops.body);

    const res = await f(fullUrl, {
      method: ops.method,
      headers: {
        ...seralizedBody.headers,
        ...ops.headers,
      },
      body: seralizedBody.body,
      credentials: ops.credentials,
    });

    let body: any;
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (isJson) body = await res.json();
    else body = await res.text();

    return {
      body,
      finalUrl: res.extraUrl ?? res.url,
      headers: getHeaders(ops.readHeaders, res),
      statusCode: res.status,
    };
  };

  return normalFetch;
}
