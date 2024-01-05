import { MediaTypes } from '@/entrypoint/utils/media';
import { makeEmbed } from '@/providers/base';
import { parseInputUrl } from '@/providers/embeds/febbox/common';
import { getStreams } from '@/providers/embeds/febbox/fileList';
import { getSubtitles } from '@/providers/embeds/febbox/subtitles';
import { showboxBase } from '@/providers/sources/showbox/common';

// structure: https://www.febbox.com/share/<random_key>
export function extractShareKey(url: string): string {
  const parsedUrl = new URL(url);
  const shareKey = parsedUrl.pathname.split('/')[2];
  return shareKey;
}
export const febboxHlsScraper = makeEmbed({
  id: 'febbox-hls',
  name: 'Febbox (HLS)',
  rank: 160,
  disabled: true,
  async scrape(ctx) {
    const { type, id, season, episode } = parseInputUrl(ctx.url);
    const sharelinkResult = await ctx.proxiedFetcher<{
      data?: { link?: string };
    }>('/index/share_link', {
      baseUrl: showboxBase,
      query: {
        id,
        type: type === 'movie' ? '1' : '2',
      },
    });
    if (!sharelinkResult?.data?.link) throw new Error('No embed url found');
    ctx.progress(30);
    const shareKey = extractShareKey(sharelinkResult.data.link);
    const fileList = await getStreams(ctx, shareKey, type, season, episode);
    const firstStream = fileList[0];
    if (!firstStream) throw new Error('No playable mp4 stream found');
    ctx.progress(70);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          flags: [],
          captions: await getSubtitles(ctx, id, firstStream.fid, type as MediaTypes, season, episode),
          playlist: `https://www.febbox.com/hls/main/${firstStream.oss_fid}.m3u8`,
        },
      ],
    };
  },
});
