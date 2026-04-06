import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const consumetBase = 'https://api.consumet.org/anime/animekai';

async function searchAnime(ctx: ShowScrapeContext, title: string): Promise<string> {
  const data = await ctx.fetcher<any>(`${consumetBase}/${encodeURIComponent(title)}`);
  
  if (!data?.results?.length) {
    // If "Attack on Titan" fails, we hope the next attempt in scrapeAnimekai handles it
    throw new NotFoundError(`No results for "${title}"`);
  }

  // Find exact match or take the first result
  const normalizedTitle = title.toLowerCase().trim();
  const exact = data.results.find((r: any) => 
    r.title.toLowerCase().trim() === normalizedTitle || 
    r.id.includes(normalizedTitle.replace(/\s+/g, '-'))
  );

  return (exact ?? data.results[0]).id;
}

async function scrapeAnimekai(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  let animeId = '';
  
  try {
    animeId = await searchAnime(ctx, ctx.media.title);
  } catch (e) {
      throw e;
  }

  const info = await ctx.fetcher<any>(`${consumetBase}/info`, {
    query: { id: animeId }
  });

  if (!info?.episodes?.length) throw new NotFoundError('No episodes found');

  const ep = info.episodes.find((e: any) => e.number === ctx.media.episode.number);
  if (!ep) throw new NotFoundError('Episode not found');

  return {
    embeds: [
      { 
        embedId: 'animekai-embed', 
        url: JSON.stringify({ episodeId: ep.id }) 
      }
    ],
  };
}

export const animekaiScraper = makeSourcerer({
  id: 'animekai',
  name: 'AnimeKai 🔥',
  rank: 15,
  flags: [],
  disabled: true,
  scrapeShow: scrapeAnimekai,
});