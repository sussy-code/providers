import { AES, enc } from 'crypto-js';

import { makeEmbed } from '@/providers/base';

interface StreamRes {
  server: number;
  sources: string;
  tracks: {
    file: string;
    kind: 'captions' | 'thumbnails';
    label: string;
  }[];
}

function isJSON(json: string) {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

export const upcloudScraper = makeEmbed({
  id: 'upcloud',
  name: 'UpCloud',
  rank: 200,
  async scrape(ctx) {
    // Example url: https://dokicloud.one/embed-4/{id}?z=
    const parsedUrl = new URL(ctx.url.replace('embed-5', 'embed-4'));

    const dataPath = parsedUrl.pathname.split('/');
    const dataId = dataPath[dataPath.length - 1];

    const streamRes = await ctx.proxiedFetcher<StreamRes>(`${parsedUrl.origin}/ajax/embed-4/getSources?id=${dataId}`, {
      headers: {
        Referer: parsedUrl.origin,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    let sources: { file: string; type: string } | null = null;

    if (!isJSON(streamRes.sources)) {
      const decryptionKey = JSON.parse(
        await ctx.proxiedFetcher<string>(`https://raw.githubusercontent.com/enimax-anime/key/e4/key.txt`),
      ) as [number, number][];

      let extractedKey = '';
      const sourcesArray = streamRes.sources.split('');
      for (const index of decryptionKey) {
        for (let i: number = index[0]; i < index[1]; i += 1) {
          extractedKey += streamRes.sources[i];
          sourcesArray[i] = '';
        }
      }

      const decryptedStream = AES.decrypt(sourcesArray.join(''), extractedKey).toString(enc.Utf8);
      const parsedStream = JSON.parse(decryptedStream)[0];
      if (!parsedStream) throw new Error('No stream found');
      sources = parsedStream;
    }

    if (!sources) throw new Error('upcloud source not found');

    return {
      stream: {
        type: 'hls',
        playlist: sources.file,
      },
    };
  },
});
