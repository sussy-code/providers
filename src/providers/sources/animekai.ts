import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const consumetBase = 'https://api.1anime.app/anime/animekai';

interface SearchResult {
  id: string;
  title: string;
}

interface SearchResponse {
  results: SearchResult[];
}

interface Episode {
  id: string;
  number: number;
}

interface InfoResponse {
  episodes: Episode[];
}

function normalizeTitle(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

async function searchAnime(ctx: ShowScrapeContext, title: string): Promise<string> {
  const data = await ctx.fetcher<SearchResponse>(`${consumetBase}/${encodeURIComponent(title)}`);
  if (!data?.results?.length) throw new NotFoundError('Anime not found on AnimeKai');
  const normalizedTitle = normalizeTitle(title);
  const exact = data.results.find((r) => normalizeTitle(r.title) === normalizedTitle);
  return (exact ?? data.results[0]).id;
}

async function scrapeAnimekai(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  const title = ctx.media.title;
  const episodeNumber = ctx.media.episode.number;

  const animeId = await searchAnime(ctx, title);

  const info = await ctx.fetcher<InfoResponse>(`${consumetBase}/info?id=${animeId}`);
  if (!info?.episodes?.length) throw new NotFoundError('No episodes found on AnimeKai');

  const ep = info.episodes.find((e) => e.number === episodeNumber);
  if (!ep) throw new NotFoundError('Episode not found on AnimeKai');

  return {
    embeds: [{ embedId: 'animekai-embed', url: JSON.stringify({ episodeId: ep.id }) }],
  };
}

export const animekaiScraper = makeSourcerer({
  id: 'animekai',
  name: 'AnimeKai 🔥',
  rank: 93,
  flags: [],
  scrapeShow: scrapeAnimekai,
});