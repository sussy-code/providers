import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { getAnilistEnglishTitle } from '@/utils/anilist';
import { compareTitle } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { getAiMatching } from './ai';

const showScraper = async (ctx: ShowScrapeContext): Promise<SourcererOutput> => {
  const title = await getAnilistEnglishTitle(ctx, ctx.media);
  if (!title) throw new NotFoundError('Anime not found');

  const allAnimes: any[] = [];
  for (const t of [ctx.media.title, title]) {
    try {
      const searchResult = await ctx.proxiedFetcher<any>(
        `https://anime.aether.mom/api/search?keyword=${encodeURIComponent(t)}`,
      );
      if (searchResult?.results?.data) {
        allAnimes.push(...searchResult.results.data);
      }
    } catch (err) {
      // ignore network errors
    }
  }

  const uniqueAnimes = [...new Map(allAnimes.map((item) => [item.id, item])).values()];
  if (uniqueAnimes.length === 0) throw new NotFoundError('Anime not found');

  const tvAnimes = uniqueAnimes.filter((v) => v.tvInfo.showType === 'TV');

  const aiResult = await getAiMatching(ctx, ctx.media, tvAnimes);

  let seasons: Array<any> = [];
  if (aiResult && aiResult.results.length > 0) {
    seasons = aiResult.results
      .map((v) => {
        const anime = tvAnimes.find((a) => a.id === v.id);
        if (!anime) return null;
        return {
          ...anime,
          seasonNum: v.season ?? 1,
        };
      })
      .filter((v) => v !== null)
      .sort((a, b) => a.seasonNum - b.seasonNum);
  }

  if (seasons.length === 0) throw new NotFoundError('Anime not found');

  let episodeId: string | undefined;

  // strategy 1: direct mapping
  let season = seasons.find((v) => v.seasonNum === ctx.media.season.number);
  const seasonEntries = seasons.filter((v) => v.seasonNum === ctx.media.season.number);

  if (seasonEntries.length > 1) {
    const sorted = seasonEntries.sort((a, b) => {
      const aTitleText = a.title;
      const bTitleText = b.title;
      const targetTitle = ctx.media.season.title;
      return Number(compareTitle(bTitleText, targetTitle)) - Number(compareTitle(aTitleText, targetTitle));
    });
    season = sorted[0];
  }

  if (season) {
    const episodeData = await ctx.proxiedFetcher<any>(`https://anime.aether.mom/api/episodes/${season.id}`);
    if (episodeData?.results?.episodes) {
      const episode = episodeData.results.episodes.find((ep: any) => ep.episode_no === ctx.media.episode.number);
      if (episode) episodeId = episode.id;
    }
  }

  // strategy 2: cumulative mapping
  if (!episodeId) {
    let episodeNumber = ctx.media.episode.number;
    for (const s of seasons) {
      const epCount = s.tvInfo.sub ?? 0;
      if (episodeNumber <= epCount) {
        const targetEpisodeNumber = episodeNumber;
        const episodeData = await ctx.proxiedFetcher<any>(`https://anime.aether.mom/api/episodes/${s.id}`);
        if (episodeData?.results?.episodes) {
          const episode = episodeData.results.episodes.find((ep: any) => ep.episode_no === targetEpisodeNumber);
          if (episode) {
            episodeId = episode.id;
            break;
          }
        }
      }
      if (episodeId) break;
      episodeNumber -= epCount;
    }
  }

  if (!episodeId) throw new NotFoundError('Episode not found');

  return {
    embeds: [
      {
        embedId: 'myanimesub',
        url: episodeId,
      },
      {
        embedId: 'myanimedub',
        url: episodeId,
      },
    ],
  };
};

const universalScraper = async (ctx: MovieScrapeContext): Promise<SourcererOutput> => {
  const searchResults = await ctx.proxiedFetcher<any>(
    `https://anime.aether.mom/api/search?keyword=${encodeURIComponent(ctx.media.title)}`,
  );

  const movie = searchResults.results.data.find((v: any) => v.tvInfo.showType === 'Movie');
  if (!movie) throw new NotFoundError('No watchable sources found');

  const episodeData = await ctx.proxiedFetcher<any>(`https://anime.aether.mom/api/episodes/${movie.id}`);
  const episode = episodeData.results.episodes.find((e: any) => e.episode_no === 1);
  if (!episode) throw new NotFoundError('No watchable sources found');

  return {
    embeds: [
      {
        embedId: 'myanimesub',
        url: episode.id,
      },
      {
        embedId: 'myanimedub',
        url: episode.id,
      },
    ],
  };
};

export const myanimeScraper = makeSourcerer({
  id: 'myanime',
  name: 'MyAnime',
  rank: 12,
  disabled: true, // disabled since AI api is not privated
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: universalScraper,
  scrapeShow: showScraper,
});
