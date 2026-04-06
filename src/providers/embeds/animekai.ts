import { flags } from "@/entrypoint/utils/targets";
import { EmbedOutput, makeEmbed } from "@/providers/base";
import { NotFoundError } from "@/utils/errors";

const consumetBase = 'https://api.consumet.org/anime/animekai';

export const AnimekaiScraper = makeEmbed({
  id: 'animekai-embed',
  name: 'AnimeKai',
  rank: 415,
  flags: [flags.CORS_ALLOWED], 
  async scrape(ctx): Promise<EmbedOutput> {
    const { episodeId } = JSON.parse(ctx.url);
  
    const data = await ctx.fetcher<any>(`${consumetBase}/watch/${encodeURIComponent(episodeId)}`);

    if (!data?.sources?.length) throw new NotFoundError('No stream found');

    const hlsSource = data.sources.find((s: any) => s.isM3U8) || data.sources[0];
    
    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: hlsSource.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          headers: {
            'Referer': data.headers?.Referer || 'https://anikai.to/',
            'User-Agent': data.headers?.['User-Agent'] || 'Mozilla/5.0'
          },
        },
      ],
    };
  },
});