import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const remotestreamBase = atob('aHR0cHM6Ly9mc2IuOG1ldDNkdGpmcmNxY2hjb25xcGtsd3hzeGIyb2N1bWMuc3RyZWFt');

const origin = 'https://remotestre.am';
const referer = 'https://remotestre.am/';

export const remotestreamScraper = makeSourcerer({
  id: 'remotestream',
  name: 'Remote Stream',
  disabled: true,
  rank: 20,
  flags: [flags.CORS_ALLOWED],
  async scrapeShow(ctx) {
    const seasonNumber = ctx.media.season.number;
    const episodeNumber = ctx.media.episode.number;

    const playlistLink = `${remotestreamBase}/Shows/${ctx.media.tmdbId}/${seasonNumber}/${episodeNumber}/${episodeNumber}.m3u8`;

    ctx.progress(30);
    const streamRes = await ctx.proxiedFetcher.full(playlistLink, {
      method: 'GET',
      readHeaders: ['content-type'],
      headers: {
        Referer: referer,
      },
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
          preferredHeaders: {
            Referer: referer,
            Origin: origin,
          },
        },
      ],
    };
  },
  async scrapeMovie(ctx) {
    const playlistLink = `${remotestreamBase}/Movies/${ctx.media.tmdbId}/${ctx.media.tmdbId}.m3u8`;

    ctx.progress(30);
    const streamRes = await ctx.proxiedFetcher.full(playlistLink, {
      method: 'GET',
      readHeaders: ['content-type'],
      headers: {
        Referer: referer,
      },
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
          preferredHeaders: {
            Referer: referer,
            Origin: origin,
          },
        },
      ],
    };
  },
});
