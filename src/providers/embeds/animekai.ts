import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

import { Caption, labelToLanguageCode } from '../captions';

interface StreamData {
  headers: {
    Referer: string;
    Origin?: string;
  };
  sources: Array<{
    url: string;
    isM3U8: boolean;
  }>;
  subtitles?: Array<{
    url: string;
    lang?: string;
    kind?: string;
  }>;
}

export const AnimekaiScraper = makeEmbed({
  id: 'animekai-embed',
  name: 'AnimeKai',
  rank: 415,
  flags: [], // ← REQUIRED
  async scrape(ctx): Promise<EmbedOutput> {
    const { episodeId } = JSON.parse(ctx.url);
    const data = await ctx.fetcher<StreamData>(
      `https://api.1anime.app/anime/animekai/watch/${encodeURIComponent(episodeId)}`,
    );

    if (!data?.sources?.length) throw new NotFoundError('No stream found');

    ctx.progress(50);

    const captions: Caption[] = (data.subtitles ?? [])
      .filter((sub) => sub.lang && sub.kind !== 'thumbnails')
      .map((sub) => ({
        type: 'vtt',
        id: sub.url,
        url: sub.url,
        language: labelToLanguageCode(sub.lang!.replace(/_\[.*?\]$/, '').trim()) || 'unknown',
        hasCorsRestrictions: true,
      }));

    const hlsSource = data.sources.find((s) => s.isM3U8);
    if (!hlsSource) throw new NotFoundError('No HLS stream found');

    ctx.progress(90);

    const headers: Record<string, string> = {};
    if (data.headers.Referer) {
      headers.Referer = data.headers.Referer;
      try {
        headers.Origin = new URL(data.headers.Referer).origin;
      } catch {}
    }
    if (data.headers.Origin) headers.Origin = data.headers.Origin;

    return {
      stream: [
        {
          id: 'primary',
          captions,
          playlist: hlsSource.url,
          headers,
          type: 'hls',
          flags: [],
        },
      ],
    };
  },
});