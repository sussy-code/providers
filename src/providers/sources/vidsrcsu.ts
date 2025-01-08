import JSON5 from 'json5';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { Caption, labelToLanguageCode } from '@/providers/captions';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const embedPage = await ctx.proxiedFetcher(
    `https://vidsrc.su/embed/${ctx.media.type === 'movie' ? `movie/${ctx.media.tmdbId}` : `tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`,
  );

  const serverDataMatch = embedPage.match(/const fixedServers = +(\[.*?\])/s);
  if (!serverDataMatch[1]) throw new NotFoundError('No data found');

  // const servers: { label: string; url: string }[] = JSON.parse(serverDataMatch[1].replace(/([a-zA-Z0-9_]+): /g, '"$1":').replace(/'/g, '"').replace(/,\s*\]$/, ']'))
  const servers: { label: string; url: string }[] = JSON5.parse(serverDataMatch[1]);

  let playlist;
  // we only want flixhq which is server 1 and server 2
  servers.forEach((server) => {
    if (['Server 1', 'Server 2'].includes(server.label) && server.url) playlist = server.url;
  });
  if (!playlist) throw new NotFoundError('No flixhq playlist found');

  const captionsDataMatch = embedPage.match(/const subtitles = +(\[.*?\])/s);
  const captions: Caption[] = [];

  if (captionsDataMatch[1]) {
    const captionsData: { label: string; file: string }[] = JSON5.parse(captionsDataMatch[1]);
    for (const caption of captionsData) {
      const language = labelToLanguageCode(caption.label);
      if (!language) continue;

      captions.push({
        id: caption.file,
        url: caption.file,
        type: 'vtt',
        hasCorsRestrictions: false,
        language,
      });
    }
  }

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        playlist,
        type: 'hls',
        flags: [flags.CORS_ALLOWED],
        captions,
      },
    ],
  };
}

export const vidsrcsuScraper = makeSourcerer({
  id: 'vidsrcsu',
  name: 'vidsrc.su (FlixHQ)',
  rank: 229,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
