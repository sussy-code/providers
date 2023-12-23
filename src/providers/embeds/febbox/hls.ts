import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { FebboxFileList, febBoxBase } from '@/providers/embeds/febbox/common';
import { EmbedScrapeContext } from '@/utils/context';

// structure: https://www.febbox.com/share/<random_key>
export function extractShareKey(url: string): string {
  const parsedUrl = new URL(url);
  const shareKey = parsedUrl.pathname.split('/')[2];
  return shareKey;
}

export async function getFileList(ctx: EmbedScrapeContext, shareKey: string): Promise<FebboxFileList[]> {
  const streams = await ctx.proxiedFetcher<{
    data?: {
      file_list?: FebboxFileList[];
    };
  }>('/file/file_share_list', {
    headers: {
      'accept-language': 'en', // without this header, the request is marked as a webscraper
    },
    baseUrl: febBoxBase,
    query: {
      share_key: shareKey,
      pwd: '',
    },
  });

  return streams.data?.file_list ?? [];
}

export const febboxHlsScraper = makeEmbed({
  id: 'febbox-hls',
  name: 'Febbox (HLS)',
  rank: 160,
  async scrape(ctx) {
    const shareKey = extractShareKey(ctx.url);
    const fileList = await getFileList(ctx, shareKey);
    const firstMp4 = fileList.find((v) => v.ext === 'mp4');
    // TODO support TV, file list is gotten differently
    // TODO support subtitles with getSubtitles
    if (!firstMp4) throw new Error('No playable mp4 stream found');

    return {
      stream: {
        type: 'hls',
        flags: [flags.NO_CORS],
        captions: [],
        playlist: `https://www.febbox.com/hls/main/${firstMp4.oss_fid}.m3u8`,
      },
    };
  },
});
