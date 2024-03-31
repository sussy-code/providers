import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { parseInputUrl } from '@/providers/embeds/febbox/common';
import { getStreamQualities } from '@/providers/embeds/febbox/qualities';
import { getSubtitles } from '@/providers/embeds/febbox/subtitles';
import { StreamFile } from '@/providers/streams';

export const febboxMp4Scraper = makeEmbed({
  id: 'febbox-mp4',
  name: 'Febbox (MP4)',
  rank: 190,
  async scrape(ctx) {
    const { type, id, season, episode } = parseInputUrl(ctx.url);
    let apiQuery: object | null = null;

    if (type === 'movie') {
      apiQuery = {
        uid: '',
        module: 'Movie_downloadurl_v3',
        mid: id,
        oss: '1',
        group: '',
      };
    } else if (type === 'show') {
      apiQuery = {
        uid: '',
        module: 'TV_downloadurl_v3',
        tid: id,
        season,
        episode,
        oss: '1',
        group: '',
      };
    }

    if (!apiQuery) throw Error('Incorrect type');

    const { qualities, fid } = await getStreamQualities(ctx, apiQuery);
    if (fid === undefined) throw new Error('No streamable file found');
    ctx.progress(70);

    const filteredQualities = (
      await Promise.all(
        Object.keys(qualities).map(async (quality) => {
          const url = qualities[quality].url;

          const { statusCode } = await ctx.fetcher.full(url, {
            method: 'HEAD',
          });

          if (statusCode !== 200) return null;
          return quality;
        }),
      )
    )
      .filter((quality) => quality !== null)
      .reduce((acc: Record<string, StreamFile>, quality) => {
        if (!quality) return acc;
        acc[quality] = qualities[quality];
        return acc;
      }, {});

    if (Object.keys(filteredQualities).length === 0) throw new Error('No streamable file found');

    return {
      stream: [
        {
          id: 'primary',
          captions: await getSubtitles(ctx, id, fid, type, episode, season),
          qualities: filteredQualities,
          type: 'file',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});
