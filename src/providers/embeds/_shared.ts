// embeds/_shared.ts
import { flags } from '@/entrypoint/utils/targets';
// Import the Stream type to ensure compatibility
import { Stream } from '@/providers/streams'; 

export function extractStream(html: string): Stream {
  const m3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i)?.[1];
  const mp4 = html.match(/<video[^>]+src=["']([^"']+)["']/i)?.[1];

  const streamUrl = m3u8 || mp4;
  if (!streamUrl) throw new Error('No stream found');

  if (streamUrl.includes('.mp4')) {
    return {
      id: 'primary',
      type: 'file', // TypeScript is happy here because of the function return type
      flags: [flags.CORS_ALLOWED],
      captions: [],
      qualities: {
        unknown: { type: 'mp4', url: streamUrl },
      },
    };
  }

  return {
    id: 'primary',
    type: 'hls',
    playlist: streamUrl,
    flags: [flags.CORS_ALLOWED],
    captions: [],
  };
}