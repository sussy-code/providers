import { makeProviders, makeStandardFetcher } from '../lib/index.mjs';

const providers = makeProviders({
  fetcher: makeStandardFetcher(fetch),
});
