const { makeProviders, makeStandardFetcher, targets } = require('../lib/index.umd.js');

const providers = makeProviders({
  fetcher: makeStandardFetcher(fetch),
  target: targets.BROWSER,
});
