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
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const html = await ctx.proxiedFetcher<string>(url, { headers });

    const m3u8Match = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);
    const sourceMatch = html.match(/src["']?\s*[:=]\s*["'](https?:\/\/[^"']+)["']/i);
    const manifestMatch = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
    const hlsMatch = html.match(/hls["']?\s*[:=]\s*["']([^"']+)["']/i);

    let videoUrl = m3u8Match?.[1] || manifestMatch?.[1] || hlsMatch?.[1] || sourceMatch?.[1];

    if (!videoUrl) {
      const scriptMatch = html.match(/var\s+(?:source|video|url|hlsUrl|manifest|stream)\s*=\s*["']([^"']+)["']/i);
      if (scriptMatch) {
        videoUrl = scriptMatch[1];
      }
    }

    if (!videoUrl) {
      const jsonMatch = html.match(/\{[^}]*"(?:src|source|url|hls|manifest)"\s*:\s*"([^"]+)"/i);
      if (jsonMatch) {
        videoUrl = jsonMatch[1];
      }
    }

    if (!videoUrl) {
      throw new Error('No video URL found in VidKing embed');
    }

    if (videoUrl.startsWith('//')) {
      videoUrl = `https:${videoUrl}`;
    } else if (videoUrl.startsWith('/')) {
      videoUrl = `${origin}${videoUrl}`;
    }

    const isHls = videoUrl.includes('.m3u8') || /\.m3u8[?#]/.test(videoUrl);

    if (isHls) {
      return {
        stream: [
          {
            id: 'primary',
            type: 'hls',
            playlist: videoUrl,
            flags: [flags.CORS_ALLOWED],
            captions: [],
            headers: {
              Referer: origin,
              Origin: origin,
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
            Referer: origin,
            Origin: origin,
            'User-Agent': userAgent,
          },
        },
      ],
    };
  },
});
