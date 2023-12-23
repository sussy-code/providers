import { MediaTypes } from '@/main/media';
import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { getStreamQualities } from '@/providers/embeds/febbox/qualities';
import { getSubtitles } from '@/providers/embeds/febbox/subtitles';

export const febboxMp4Scraper = makeEmbed({
  id: 'febbox-mp4',
  name: 'Febbox (MP4)',
  rank: 190,
  async scrape(ctx) {
    const [type, id, seasonId, episodeId] = ctx.url.slice(1).split('/');
    const season = seasonId ? parseInt(seasonId, 10) : undefined;
    const episode = episodeId ? parseInt(episodeId, 10) : undefined;
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

    return {
      stream: {
        captions: await getSubtitles(ctx, id, fid, type as MediaTypes, episode, season),
        qualities,
        type: 'file',
        flags: [flags.NO_CORS],
      },
    };
  },
});
