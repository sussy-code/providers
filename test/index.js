const { makeProviders, makeStandardFetcher } = require('../lib/index.umd.js');

const providers = makeProviders({
  fetcher: makeStandardFetcher(fetch),
});
