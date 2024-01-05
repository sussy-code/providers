import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const remotestreamBase = atob('aHR0cHM6Ly9mc2IuOG1ldDNkdGpmcmNxY2hjb25xcGtsd3hzeGIyb2N1bWMuc3RyZWFt');

export const remotestreamScraper = makeSourcerer({
  id: 'remotestream',
  name: 'Remote Stream',
  rank: 55,
  flags: [flags.CORS_ALLOWED],
  async scrapeShow(ctx) {
    const seasonNumber = ctx.media.season.number;
    const episodeNumber = ctx.media.episode.number;

    const playlistLink = `${remotestreamBase}/Shows/${ctx.media.tmdbId}/${seasonNumber}/${episodeNumber}/${episodeNumber}.m3u8`;

    ctx.progress(30);
    const streamRes = await ctx.fetcher.full(playlistLink, {
      method: 'HEAD',
      readHeaders: ['content-type'],
    });
    if (!streamRes.headers.get('content-type')?.toLowerCase().includes('application/x-mpegurl'))
      throw new NotFoundError('No watchable item found');
    ctx.progress(90);

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          captions: [],
          playlist: playlistLink,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
  async scrapeMovie(ctx) {
    const playlistLink = `${remotestreamBase}/Movies/${ctx.media.tmdbId}/${ctx.media.tmdbId}.m3u8`;

    ctx.progress(30);
    const streamRes = await ctx.fetcher.full(playlistLink, {
      method: 'HEAD',
      readHeaders: ['content-type'],
    });
    if (!streamRes.headers.get('content-type')?.toLowerCase().includes('application/x-mpegurl'))
      throw new NotFoundError('No watchable item found');
    ctx.progress(90);

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          captions: [],
          playlist: playlistLink,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});
