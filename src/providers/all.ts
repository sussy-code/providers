import { Sourcerer } from '@/providers/base';
import { hasDuplicates, isNotNull } from '@/utils/predicates';

function gatherAllSources(): Array<Sourcerer | null> {
  return [];
}

export interface ProviderList {
  sources: Sourcerer[];
}

export function getProviders(): ProviderList {
  const sources = gatherAllSources().filter(isNotNull);

  const anyDuplicateId = hasDuplicates(sources.map((v) => v.id));
  const anyDuplicateRank = hasDuplicates(sources.map((v) => v.rank));

  if (anyDuplicateId) throw new Error('Duplicate id found in sources');
  if (anyDuplicateRank) throw new Error('Duplicate rank found in sources');

  return {
    sources,
  };
}
