import { Embed, Sourcerer } from '@/providers/base';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { flixhqScraper } from '@/providers/sources/flixhq/index';
import { hasDuplicates } from '@/utils/predicates';

function gatherAllSources(): Array<Sourcerer> {
  // all sources are gathered here
  return [flixhqScraper];
}

function gatherAllEmbeds(): Array<Embed> {
  // all embeds are gathered here
  return [upcloudScraper];
}

export interface ProviderList {
  sources: Sourcerer[];
  embeds: Embed[];
}

export function getProviders(): ProviderList {
  const sources = gatherAllSources().filter((v) => !v?.disabled);
  const embeds = gatherAllEmbeds().filter((v) => !v?.disabled);
  const combined = [...sources, ...embeds];

  const anyDuplicateId = hasDuplicates(combined.map((v) => v.id));
  const anyDuplicateSourceRank = hasDuplicates(sources.map((v) => v.rank));
  const anyDuplicateEmbedRank = hasDuplicates(embeds.map((v) => v.rank));

  if (anyDuplicateId) throw new Error('Duplicate id found in sources/embeds');
  if (anyDuplicateSourceRank) throw new Error('Duplicate rank found in sources');
  if (anyDuplicateEmbedRank) throw new Error('Duplicate rank found in embeds');

  return {
    sources,
    embeds,
  };
}
