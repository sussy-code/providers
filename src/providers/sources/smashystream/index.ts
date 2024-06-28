import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { smashyStreamOScraper } from '@/providers/embeds/smashystream/opstream';
import { smashyStreamFScraper } from '@/providers/embeds/smashystream/video1';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  // theres no point in fetching the player page
  // because it too just calls the api with the tmdb id
  // thats the only way to find out if the embed has any streams
  const query =
    ctx.media.type === 'movie'
      ? `?tmdb=${ctx.media.tmdbId}`
      : `?tmdb=${ctx.media.tmdbId}&season=${ctx.media.season.number}&episode=${ctx.media.episode.number}`;

  return {
    embeds: [
      {
        embedId: smashyStreamFScraper.id,
        url: `https://embed.smashystream.com/videofeee.php${query}`,
      },
      {
        embedId: smashyStreamOScraper.id,
        url: `https://embed.smashystream.com/shortmoviec.php${query}`,
      },
    ],
  };
};

export const smashyStreamScraper = makeSourcerer({
  id: 'smashystream',
  name: 'SmashyStream',
  rank: 30,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
