import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const insertunitbase = 'https://api.insertunit.ws/';

export const insertunitScraper = makeSourcerer({
  id: 'insertunit',
  name: 'Insertunit',
  disabled: false,
  rank: 60,
  flags: [flags.CORS_ALLOWED],
  async scrapeShow(ctx) {
    const playerData = await ctx.fetcher(`${insertunitbase}/embed/imdb/${ctx.media.imdbId}`);
    ctx.progress(30);

    const seasonDataJSONregex = /seasons:(.*)/;
    const seasonData = seasonDataJSONregex.exec(playerData);

    if (seasonData === null || seasonData[1] === null) {
      throw new NotFoundError('No result found');
    }
    ctx.progress(60);

    const seasonTable = JSON.parse(seasonData[1]);
    for (const seasonElement of seasonTable) {
      if (seasonElement.season === ctx.media.season.number) {
        for (const episodeElement of seasonElement.episodes) {
          if (episodeElement.episode.includes(ctx.media.episode.number)) {
            return {
              embeds: [],
              stream: [
                {
                  id: 'primary',
                  captions: [],
                  playlist: episodeElement.hls,
                  type: 'hls',
                  flags: [flags.CORS_ALLOWED],
                },
              ],
            };
          }
        }
      }
    }

    throw new NotFoundError('No result found');
  },
  async scrapeMovie(ctx) {
    const playerData = await ctx.fetcher(`${insertunitbase}/embed/imdb/${ctx.media.imdbId}`);
    ctx.progress(50);

    const streamRegex = /hls: "([^"]*)/;
    const streamData = streamRegex.exec(playerData);

    if (streamData === null || streamData[1] === null) {
      throw new NotFoundError('No result found');
    }
    ctx.progress(90);

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: streamData[1],
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
