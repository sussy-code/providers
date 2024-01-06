# `makeProviders`

Make an instance of provider controls with configuration. 
This is the main entry-point of the library. It is recommended to make one instance globally and reuse it throughout your application.

## Example

```ts
import { targets, makeProviders, makeDefaultFetcher } from '@movie-web/providers';

const providers = makeProviders({
  fetcher: makeDefaultFetcher(fetch),
  target: targets.NATIVE, // target native app streams
});
```

## Type

```ts
function makeProviders(ops: ProviderBuilderOptions): ProviderControls;

interface ProviderBuilderOptions {
  // instance of a fetcher, all webrequests are made with the fetcher.
  fetcher: Fetcher;
  
  // instance of a fetcher, in case the request has CORS restrictions.
  // this fetcher will be called instead of normal fetcher.
  // if your environment doesn't have CORS restrictions (like Node.JS), there is no need to set this.
  proxiedFetcher?: Fetcher;

  // target to get streams for
  target: Targets;
}
```
