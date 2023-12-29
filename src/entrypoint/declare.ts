import { makeControls } from '@/entrypoint/controls';
import { getBuiltinEmbeds, getBuiltinSources } from '@/entrypoint/providers';
import { Targets, getTargetFeatures } from '@/entrypoint/utils/targets';
import { Fetcher } from '@/fetchers/types';
import { getProviders } from '@/providers/get';

export interface ProviderMakerOptions {
  // fetcher, every web request gets called through here
  fetcher: Fetcher;

  // proxied fetcher, if the scraper needs to access a CORS proxy. this fetcher will be called instead
  // of the normal fetcher. Defaults to the normal fetcher.
  proxiedFetcher?: Fetcher;

  // target of where the streams will be used
  target: Targets;

  // Set this to true, if the requests will have the same IP as
  // the device that the stream will be played on
  consistentIpForRequests?: boolean;
}

export function makeProviders(ops: ProviderMakerOptions) {
  const features = getTargetFeatures(ops.target, ops.consistentIpForRequests ?? false);
  const list = getProviders(features, {
    embeds: getBuiltinEmbeds(),
    sources: getBuiltinSources(),
  });

  return makeControls({
    embeds: list.embeds,
    sources: list.sources,
    features,
    fetcher: ops.fetcher,
    proxiedFetcher: ops.proxiedFetcher,
  });
}
