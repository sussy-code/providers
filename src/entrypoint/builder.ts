import { ProviderControls, makeControls } from '@/entrypoint/controls';
import { getBuiltinEmbeds, getBuiltinSources } from '@/entrypoint/providers';
import { Targets, getTargetFeatures } from '@/entrypoint/utils/targets';
import { Fetcher } from '@/fetchers/types';
import { Embed, Sourcerer } from '@/providers/base';
import { getProviders } from '@/providers/get';

export type ProviderBuilder = {
  setTarget(target: Targets): ProviderBuilder;
  setFetcher(fetcher: Fetcher): ProviderBuilder;
  setProxiedFetcher(fetcher: Fetcher): ProviderBuilder;
  addSource(scraper: Sourcerer): ProviderBuilder;
  addSource(name: string): ProviderBuilder;
  addEmbed(scraper: Embed): ProviderBuilder;
  addEmbed(name: string): ProviderBuilder;
  addBuiltinProviders(): ProviderBuilder;
  enableConsistentIpForRequests(): ProviderBuilder;
  build(): ProviderControls;
};

export function buildProviders(): ProviderBuilder {
  let consistentIpForRequests = false;
  let target: Targets | null = null;
  let fetcher: Fetcher | null = null;
  let proxiedFetcher: Fetcher | null = null;
  const embeds: Embed[] = [];
  const sources: Sourcerer[] = [];
  const builtinSources = getBuiltinSources();
  const builtinEmbeds = getBuiltinEmbeds();

  return {
    enableConsistentIpForRequests() {
      consistentIpForRequests = true;
      return this;
    },
    setFetcher(f) {
      fetcher = f;
      return this;
    },
    setProxiedFetcher(f) {
      proxiedFetcher = f;
      return this;
    },
    setTarget(t) {
      target = t;
      return this;
    },
    addSource(input) {
      if (typeof input !== 'string') {
        sources.push(input);
        return this;
      }

      const matchingSource = builtinSources.find((v) => v.id === input);
      if (!matchingSource) throw new Error('Source not found');
      sources.push(matchingSource);
      return this;
    },
    addEmbed(input) {
      if (typeof input !== 'string') {
        embeds.push(input);
        return this;
      }

      const matchingEmbed = builtinEmbeds.find((v) => v.id === input);
      if (!matchingEmbed) throw new Error('Embed not found');
      embeds.push(matchingEmbed);
      return this;
    },
    addBuiltinProviders() {
      sources.push(...builtinSources);
      embeds.push(...builtinEmbeds);
      return this;
    },
    build() {
      if (!target) throw new Error('Target not set');
      if (!fetcher) throw new Error('Fetcher not set');
      const features = getTargetFeatures(target, consistentIpForRequests);
      const list = getProviders(features, {
        embeds,
        sources,
      });

      return makeControls({
        fetcher,
        proxiedFetcher: proxiedFetcher ?? undefined,
        embeds: list.embeds,
        sources: list.sources,
        features,
      });
    },
  };
}
