# `makeSimpleProxyFetcher`

Make a fetcher to use with [movie-web/simple-proxy](https://github.com/movie-web/simple-proxy). This is for making a proxiedFetcher, so you can run this library in the browser.

## Example

```ts
import { targets, makeProviders, makeDefaultFetcher, makeSimpleProxyFetcher } from '@movie-web/providers';

const proxyUrl = 'https://your.proxy.workers.dev/'

const providers = makeProviders({
  fetcher: makeDefaultFetcher(fetch),
  proxiedFetcher: makeSimpleProxyFetcher(proxyUrl, fetch),
  target: targets.BROWSER,
});
```

## Type

```ts
function makeSimpleProxyFetcher(proxyUrl: string, fetchApi: typeof fetch): Fetcher;
```
