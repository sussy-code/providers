import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const userAgent =
  'Mozilla/5.0 (Linux; Android 11; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

export const vidkingEmbedScraper = makeEmbed({
  id: 'vidking',
  name: 'VidKing',
  rank: 175,
  flags: [flags.CORS_ALLOWED],
  async scrape(ctx) {
    const url = ctx.url;
    const parsedUrl = new URL(url);
    const origin = parsedUrl.origin;

    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      Referer: origin,
      Origin: origin,
    };

    const html = await ctx.proxiedFetcher<string>(url, { headers });

    const videoTagMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
    
    const m3u8Match = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);
    const scriptMatch = html.match(/var\s+(?:source|video|url|hlsUrl|manifest|stream)\s*=\s*["']([^"']+)["']/i);

    let videoUrl = videoTagMatch?.[1] || m3u8Match?.[1] || scriptMatch?.[1];

    if (!videoUrl) {
      throw new Error('No video URL found in VidKing embed');
    }

    if (videoUrl.startsWith('//')) videoUrl = `https:${videoUrl}`;
    if (videoUrl.startsWith('/')) videoUrl = `${origin}${videoUrl}`;

    const isMp4Worker = videoUrl.includes('workers.dev') || videoUrl.includes('/mp4/');

    if (isMp4Worker) {
      return {
        stream: [
          {
            id: 'primary',
            type: 'file',
            flags: [flags.CORS_ALLOWED],
            captions: [],
            qualities: {
              unknown: {
                type: 'mp4',
                url: videoUrl,
              },
            },
            preferredHeaders: {
              Referer: 'https://vidking.net/',
              Origin: 'https://vidking.net/',
              'User-Agent': userAgent,
            },
          },
        ],
      };
    }

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: videoUrl,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          headers: {
            Referer: 'https://vidking.net/',
            Origin: 'https://vidking.net/',
            'User-Agent': userAgent,
          },
        },
      ],
    };
  },
});