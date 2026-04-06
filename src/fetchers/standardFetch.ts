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

    // AbortController
    const controller = new AbortController();
    const timeout = 20000; // 20s timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await f(fullUrl, {
        method: ops.method,
        headers: {
          ...seralizedBody.headers,
          ...ops.headers,
        },
        body: seralizedBody.body,
        credentials: ops.credentials,
        signal: controller.signal, // Pass the signal to fetch
      });

      clearTimeout(timeoutId);

      let body: any;
      const contentType = res.headers.get('content-type')?.toLowerCase();
      const isJson = contentType?.includes('application/json');
      const isBinary =
        contentType?.includes('application/wasm') ||
        contentType?.includes('application/octet-stream') ||
        contentType?.includes('binary');

      // Handle 204 No Content responses - they have no body
      if (res.status === 204) {
        body = null;
      } else if (isJson) {
        body = await res.json();
      } else if (isBinary) {
        body = await res.arrayBuffer();
      } else {
        body = await res.text();
      }

      return {
        body,
        finalUrl: res.extraUrl ?? res.url,
        headers: getHeaders(ops.readHeaders, res),
        statusCode: res.status,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Fetch request to ${fullUrl} timed out after ${timeout}ms`);
      }
      throw error;
    }
  };

  return normalFetch;
}
