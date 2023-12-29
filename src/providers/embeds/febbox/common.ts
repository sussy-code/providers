import { MediaTypes } from '@/entrypoint/utils/media';

export const febBoxBase = `https://www.febbox.com`;

export interface FebboxFileList {
  file_name: string;
  ext: string;
  fid: number;
  oss_fid: number;
  is_dir: 0 | 1;
}

export function parseInputUrl(url: string) {
  const [type, id, seasonId, episodeId] = url.slice(1).split('/');
  const season = seasonId ? parseInt(seasonId, 10) : undefined;
  const episode = episodeId ? parseInt(episodeId, 10) : undefined;

  return {
    type: type as MediaTypes,
    id,
    season,
    episode,
  };
}
