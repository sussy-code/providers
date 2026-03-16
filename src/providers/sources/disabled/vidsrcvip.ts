import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://api2.vidsrc.vip';

function digitToLetterMap(digit: string): string {
  const map = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  return map[parseInt(digit, 10)];
}

function encodeTmdbId(tmdb: string, type: 'movie' | 'show', season?: number, episode?: number): string {
  let raw: string;
  if (type === 'show' && season && episode) {
    raw = `${tmdb}-${season}-${episode}`;
  } else {
    raw = tmdb.split('').map(digitToLetterMap).join('');
  }
  const reversed = raw.split('').reverse().join('');
  return btoa(btoa(reversed));
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const apiType = ctx.media.type === 'show' ? 'tv' : 'movie';
  const encodedId = encodeTmdbId(
    ctx.media.tmdbId,
    ctx.media.type,
    ctx.media.type === 'show' ? ctx.media.season.number : undefined,
    ctx.media.type === 'show' ? ctx.media.episode.number : undefined,
  );

  const url = `${baseUrl}/${apiType}/${encodedId}`;
  const data = await ctx.proxiedFetcher<any>(url);

  if (!data || !data.source1) throw new NotFoundError('No sources found');

  const embeds: SourcererEmbed[] = [];
  const embedIds = ['vidsrc-comet', 'vidsrc-pulsar', 'vidsrc-nova'];
  let sourceIndex = 0;
  for (let i = 1; data[`source${i}`]; i++) {
    const source = data[`source${i}`];
    if (source?.url) {
      embeds.push({
        embedId: embedIds[sourceIndex % embedIds.length],
        url: source.url,
      });
      sourceIndex++;
    }
  }

  if (embeds.length === 0) throw new NotFoundError('No embeds found');

  return {
    embeds,
  };
}

export const vidsrcvipScraper = makeSourcerer({
  id: 'vidsrcvip',
  name: 'VidSrc.vip',
  rank: 150,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
