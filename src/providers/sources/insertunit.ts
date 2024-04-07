import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const insertunitbase = 'https://api.insertunit.ws/';

export const insertunitScraper = makeSourcerer({
  id: 'insertunit',
  name: 'Insert Unit',
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
    for (const season of seasonTable) {
      if (season.season === ctx.media.season.number) {
        if (season.episodes[ctx.media.episode.number] && season.episodes[ctx.media.episode.number].hls) {
          return {
            embeds: [],
            stream: [
              {
                id: 'primary',
                captions: [],
                playlist: season.episodes[ctx.media.episode.number].hls,
                type: 'hls',
                flags: [flags.CORS_ALLOWED],
              },
            ],
          };
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
