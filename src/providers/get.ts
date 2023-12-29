import { FeatureMap, flagsAllowedInFeatures } from '@/entrypoint/utils/targets';
import { Embed, Sourcerer } from '@/providers/base';
import { hasDuplicates } from '@/utils/predicates';

export interface ProviderList {
  sources: Sourcerer[];
  embeds: Embed[];
}

export function getProviders(features: FeatureMap, list: ProviderList): ProviderList {
  const sources = list.sources.filter((v) => !v?.disabled);
  const embeds = list.embeds.filter((v) => !v?.disabled);
  const combined = [...sources, ...embeds];

  const anyDuplicateId = hasDuplicates(combined.map((v) => v.id));
  const anyDuplicateSourceRank = hasDuplicates(sources.map((v) => v.rank));
  const anyDuplicateEmbedRank = hasDuplicates(embeds.map((v) => v.rank));

  if (anyDuplicateId) throw new Error('Duplicate id found in sources/embeds');
  if (anyDuplicateSourceRank) throw new Error('Duplicate rank found in sources');
  if (anyDuplicateEmbedRank) throw new Error('Duplicate rank found in embeds');

  return {
    sources: sources.filter((s) => flagsAllowedInFeatures(features, s.flags)),
    embeds,
  };
}
