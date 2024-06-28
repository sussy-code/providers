import { Fetcher, FetcherOptions, UseableFetcher } from '@/fetchers/types';

export type FullUrlOptions = Pick<FetcherOptions, 'query' | 'baseUrl'>;

// make url with query params and base url used correctly
export function makeFullUrl(url: string, ops?: FullUrlOptions): string {
  // glue baseUrl and rest of url together
  let leftSide = ops?.baseUrl ?? '';
  let rightSide = url;

  // left side should always end with slash, if its set
  if (leftSide.length > 0 && !leftSide.endsWith('/')) leftSide += '/';

  // right side should never start with slash
  if (rightSide.startsWith('/')) rightSide = rightSide.slice(1);

  const fullUrl = leftSide + rightSide;

  // we need the data scheme for base64 encoded hls playlists
  // this is for playlists that themselves have cors but not their parts
  // this allows us to proxy them, encode them into base64 and then fetch the parts normally
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://') && !fullUrl.startsWith('data:'))
    throw new Error(`Invald URL -- URL doesn't start with a http scheme: '${fullUrl}'`);

  const parsedUrl = new URL(fullUrl);
  Object.entries(ops?.query ?? {}).forEach(([k, v]) => {
    parsedUrl.searchParams.set(k, v);
  });

  return parsedUrl.toString();
}

export function makeFetcher(fetcher: Fetcher): UseableFetcher {
  const newFetcher = (url: string, ops?: FetcherOptions) => {
    return fetcher(url, {
      headers: ops?.headers ?? {},
      method: ops?.method ?? 'GET',
      query: ops?.query ?? {},
      baseUrl: ops?.baseUrl ?? '',
      readHeaders: ops?.readHeaders ?? [],
      body: ops?.body,
      credentials: ops?.credentials,
    });
  };
  const output: UseableFetcher = async (url, ops) => (await newFetcher(url, ops)).body;
  output.full = newFetcher;
  return output;
}
