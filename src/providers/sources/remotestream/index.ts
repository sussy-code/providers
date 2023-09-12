import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

import { remotestreamBase } from './common';

// TODO tv shows are available in flixHQ, just no scraper yet
export const remotreamScraper = makeSourcerer({
  id: 'remotestream',
  name: 'Remote Stream',
  rank: 55,
  flags: [flags.NO_CORS],
  async scrapeShow(ctx) {
    const seasonNumber = ctx.media.season.number;
    const episodeNumber = ctx.media.episode.number;

    const playlistLink = `${remotestreamBase}/Shows/${ctx.media.tmdbId}/${seasonNumber}/${episodeNumber}/${episodeNumber}.m3u8`;

    const streamRes = await ctx.fetcher<Blob>(playlistLink);
    if (streamRes.type !== 'application/x-mpegurl') throw new NotFoundError('No watchable item found');

    return {
      embeds: [],
      stream: {
        playlist: playlistLink,
        type: 'hls',
        flags: [flags.NO_CORS],
      },
    };
  },
  async scrapeMovie(ctx) {
    const playlistLink = `${remotestreamBase}/Movies/${ctx.media.tmdbId}/${ctx.media.tmdbId}.m3u8`;

    const streamRes = await ctx.fetcher<Blob>(playlistLink);
    if (streamRes.type !== 'application/x-mpegurl') throw new NotFoundError('No watchable item found');

    return {
      embeds: [],
      stream: {
        playlist: playlistLink,
        type: 'hls',
        flags: [flags.NO_CORS],
      },
    };
  },
});
