# `makeStandardFetcher`

Make a fetcher from a `fetch()` API. It is used for making an instance of provider controls.

## Example

```ts
import { targets, makeProviders, makeDefaultFetcher } from '@movie-web/providers';

const providers = makeProviders({
  fetcher: makeStandardFetcher(fetch),
  target: targets.ANY,
});
```

## Type

```ts
function makeStandardFetcher(fetchApi: typeof fetch): Fetcher;
```
