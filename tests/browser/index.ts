import { makeProviders, makeStandardFetcher, targets } from '../../lib/index.js';

(window as any).TEST = () => {
  makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.ANY,
  });
}
