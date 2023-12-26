import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets } from '../../../lib';

(window as any).scrape = (proxyUrl: string, type: 'source' | 'embed', input: any) => {
  const providers = makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.BROWSER,
    proxiedFetcher: makeSimpleProxyFetcher(proxyUrl, fetch),
  });
  if (type === 'source') {
    return providers.runSourceScraper(input);
  }
  if (type === 'embed') {
    return providers.runEmbedScraper(input);
  }

  throw new Error('Input input type');
};
