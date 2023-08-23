import { ProviderList } from '@/providers/all';

export type MetaOutput = {
  type: 'embed' | 'source';
  id: string;
  rank: number;
  name: string;
};

export function getAllSourceMetaSorted(list: ProviderList): MetaOutput[] {
  return list.sources
    .sort((a, b) => b.rank - a.rank)
    .map((v) => ({
      type: 'source',
      id: v.id,
      name: v.name,
      rank: v.rank,
    }));
}

export function getAllEmbedMetaSorted(_list: ProviderList): MetaOutput[] {
  return [];
}

export function getSpecificId(list: ProviderList, id: string): MetaOutput | null {
  const foundSource = list.sources.find((v) => v.id === id);
  if (foundSource) {
    return {
      type: 'source',
      id: foundSource.id,
      name: foundSource.name,
      rank: foundSource.rank,
    };
  }

  return null;
}
