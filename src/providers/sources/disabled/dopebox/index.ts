import Fuse from 'fuse.js';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeEmbed, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { fetchTMDBName } from '@/utils/tmdb';

import { Media, MediaPlayer, getEpisodePlayers, getEpisodes, getMoviePlayers, getSeasons, searchMedia } from './search';
import { scrapeUpCloudEmbed } from './upcloud';
import { getSearchQuery } from './utils';

async function handleContext(ctx: ShowScrapeContext | MovieScrapeContext) {
  if (ctx.media.type !== 'movie' && ctx.media.type !== 'show') {
    return [];
  }

  const mediaType = ctx.media.type === 'show' ? 'TV' : 'Movie';
  const mediaTitle = await fetchTMDBName(ctx);
  const results = (await searchMedia(ctx, getSearchQuery(mediaTitle))).filter((r) => r.info.includes(mediaType));
  const fuse = new Fuse<Media>(results, {
    keys: ['title'],
  });

  const media = fuse.search(mediaTitle).find((r) => r.item.info.includes(ctx.media.releaseYear.toString()))?.item;
  if (!media) {
    throw new Error('Could not find movie');
  }

  if (ctx.media.type === 'show') {
    const seasonNumber = ctx.media.season.number;
    const epNumber = ctx.media.episode.number;

    const season = (await getSeasons(ctx, media)).find((s) => s.number === seasonNumber);
    if (!season) {
      throw new Error('Could not find season');
    }

    const episode = (await getEpisodes(ctx, season)).find((ep) => ep.number === epNumber);
    if (!episode) {
      throw new Error('Could not find episode');
    }

    return getEpisodePlayers(ctx, media, episode);
  }

  return getMoviePlayers(ctx, media);
}

function addEmbedFromPlayer(name: string, players: MediaPlayer[], embeds: SourcererEmbed[]) {
  const player = players.find((p) => p.name.toLowerCase().trim() === name.toLowerCase().trim());
  if (!player) {
    return;
  }
  embeds.push({
    embedId: `dopebox-${player.name.toLowerCase().trim()}`,
    url: player.url,
  });
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const players = await handleContext(ctx);
  if (!players) {
    return {
      embeds: [],
      stream: [],
    };
  }

  const embeds: SourcererEmbed[] = [];
  addEmbedFromPlayer('UpCloud', players, embeds);

  if (embeds.length < 1) {
    throw new Error('No valid sources were found');
  }

  return {
    embeds,
  };
}

export const dopeboxScraper = makeSourcerer({
  id: 'dopebox',
  name: 'Dopebox',
  rank: 197,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

export const dopeboxEmbeds = [
  makeEmbed({
    id: 'dopebox-upcloud',
    name: 'UpCloud',
    rank: 101,
    disabled: true,
    flags: [flags.CORS_ALLOWED],
    scrape: scrapeUpCloudEmbed,
  }),
];
