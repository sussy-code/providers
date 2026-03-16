import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const VIDIFY_SERVERS = [
  { name: 'Mbox', sr: 17 },
  { name: 'Xprime', sr: 15 },
  { name: 'Hexo', sr: 8 },
  { name: 'Prime', sr: 9 },
  { name: 'Nitro', sr: 20 },
  { name: 'Meta', sr: 6 },
  { name: 'Veasy', sr: 16 },
  { name: 'Lux', sr: 26 },
  { name: 'Vfast', sr: 11 },
  { name: 'Zozo', sr: 7 },
  { name: 'Tamil', sr: 13 },
  { name: 'Telugu', sr: 14 },
  { name: 'Beta', sr: 5 },
  { name: 'Alpha', sr: 1 },
  { name: 'Vplus', sr: 18 },
  { name: 'Cobra', sr: 12 },
];

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    type: ctx.media.type,
    tmdbId: ctx.media.tmdbId,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
  };

  return {
    embeds: VIDIFY_SERVERS.map((server) => ({
      embedId: `vidify-${server.name.toLowerCase()}`,
      url: JSON.stringify({ ...query, sr: server.sr }),
    })),
  };
}

export const vidifyScraper = makeSourcerer({
  id: 'vidify',
  name: 'Vidify 🔥',
  rank: 204,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
