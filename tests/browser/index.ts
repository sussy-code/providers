import { makeProviders, makeStandardFetcher, targets } from '../../lib/index.mjs';

(window as any).TEST = () => {
  makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.ANY,
  });
}
