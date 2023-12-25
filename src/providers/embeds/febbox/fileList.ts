import { MediaTypes } from '@/entrypoint/utils/media';
import { FebboxFileList, febBoxBase } from '@/providers/embeds/febbox/common';
import { EmbedScrapeContext } from '@/utils/context';

export async function getFileList(
  ctx: EmbedScrapeContext,
  shareKey: string,
  parentId?: number,
): Promise<FebboxFileList[]> {
  const query: Record<string, string> = {
    share_key: shareKey,
    pwd: '',
  };
  if (parentId) {
    query.parent_id = parentId.toString();
    query.page = '1';
  }

  const streams = await ctx.proxiedFetcher<{
    data?: {
      file_list?: FebboxFileList[];
    };
  }>('/file/file_share_list', {
    headers: {
      'accept-language': 'en', // without this header, the request is marked as a webscraper
    },
    baseUrl: febBoxBase,
    query,
  });

  return streams.data?.file_list ?? [];
}

function isValidStream(file: FebboxFileList): boolean {
  return file.ext === 'mp4' || file.ext === 'mkv';
}

export async function getStreams(
  ctx: EmbedScrapeContext,
  shareKey: string,
  type: MediaTypes,
  season?: number,
  episode?: number,
): Promise<FebboxFileList[]> {
  const streams = await getFileList(ctx, shareKey);

  if (type === 'show') {
    const seasonFolder = streams.find((v) => {
      if (!v.is_dir) return false;
      return v.file_name.toLowerCase() === `season ${season}`;
    });
    if (!seasonFolder) return [];

    const episodes = await getFileList(ctx, shareKey, seasonFolder.fid);
    const s = season?.toString() ?? '0';
    const e = episode?.toString() ?? '0';
    const episodeRegex = new RegExp(`[Ss]0*${s}[Ee]0*${e}`);
    return episodes
      .filter((file) => {
        if (file.is_dir) return false;
        const match = file.file_name.match(episodeRegex);
        if (!match) return false;
        return true;
      })
      .filter(isValidStream);
  }

  return streams.filter((v) => !v.is_dir).filter(isValidStream);
}
