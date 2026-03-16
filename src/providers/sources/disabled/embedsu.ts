import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

// custom atob 💀
async function stringAtob(input: string): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) {
    throw new Error('The string to be decoded is not correctly encoded.');
  }
  for (let bc = 0, bs = 0, i = 0; i < str.length; i++) {
    const buffer = str.charAt(i);
    const charIndex = chars.indexOf(buffer);
    if (charIndex === -1) continue;
    bs = bc % 4 ? bs * 64 + charIndex : charIndex;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}
async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const embedUrl = `https://embed.su/embed/${ctx.media.type === 'movie' ? `movie/${ctx.media.tmdbId}` : `tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`;

  const embedPage = await ctx.proxiedFetcher<string>(embedUrl, {
    headers: {
      Referer: 'https://embed.su/',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  const vConfigMatch = embedPage.match(/window\.vConfig\s*=\s*JSON\.parse\(atob\(`([^`]+)/i);
  const encodedConfig = vConfigMatch?.[1];
  if (!encodedConfig) throw new NotFoundError('No encoded config found');

  const decodedConfig = JSON.parse(await stringAtob(encodedConfig));
  if (!decodedConfig?.hash) throw new NotFoundError('No stream hash found');

  const firstDecode = (await stringAtob(decodedConfig.hash))
    .split('.')
    .map((item) => item.split('').reverse().join(''));

  const secondDecode = JSON.parse(await stringAtob(firstDecode.join('').split('').reverse().join(''))) as Array<{
    name: string;
    hash: string;
  }>;

  if (!secondDecode?.length) throw new NotFoundError('No servers found');
  ctx.progress(50);

  const embeds: SourcererEmbed[] = secondDecode.map((server) => ({
    embedId: 'viper',
    url: `https://embed.su/api/e/${server.hash}`,
  }));
  ctx.progress(90);

  return { embeds };
}

export const embedsuScraper = makeSourcerer({
  id: 'embedsu',
  name: 'embed.su',
  rank: 165,
  disabled: true,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
