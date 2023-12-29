import { MediaTypes } from '@/entrypoint/utils/media';
import { Embed, Sourcerer } from '@/providers/base';
import { ProviderList } from '@/providers/get';

export type MetaOutput = {
  type: 'embed' | 'source';
  id: string;
  rank: number;
  name: string;
  mediaTypes?: Array<MediaTypes>;
};

function formatSourceMeta(v: Sourcerer): MetaOutput {
  const types: Array<MediaTypes> = [];
  if (v.scrapeMovie) types.push('movie');
  if (v.scrapeShow) types.push('show');
  return {
    type: 'source',
    id: v.id,
    rank: v.rank,
    name: v.name,
    mediaTypes: types,
  };
}

function formatEmbedMeta(v: Embed): MetaOutput {
  return {
    type: 'embed',
    id: v.id,
    rank: v.rank,
    name: v.name,
  };
}

export function getAllSourceMetaSorted(list: ProviderList): MetaOutput[] {
  return list.sources.sort((a, b) => b.rank - a.rank).map(formatSourceMeta);
}

export function getAllEmbedMetaSorted(list: ProviderList): MetaOutput[] {
  return list.embeds.sort((a, b) => b.rank - a.rank).map(formatEmbedMeta);
}

export function getSpecificId(list: ProviderList, id: string): MetaOutput | null {
  const foundSource = list.sources.find((v) => v.id === id);
  if (foundSource) {
    return formatSourceMeta(foundSource);
  }

  const foundEmbed = list.embeds.find((v) => v.id === id);
  if (foundEmbed) {
    return formatEmbedMeta(foundEmbed);
  }

  return null;
}
