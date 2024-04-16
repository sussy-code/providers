import { load } from 'cheerio';

import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { compareMedia } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://w1.nites.is';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchPage = await ctx.proxiedFetcher('/wp-admin/admin-ajax.php', {
    baseUrl,
    method: 'POST',
    body: new URLSearchParams({
      action: 'ajax_pagination',
      query_vars: 'mixed',
      search: ctx.media.title,
    }),
  });

  const $search = load(searchPage);
  const searchResults: { title: string; year: number; url: string }[] = [];

  $search('li').each((_, element) => {
    const title = $search(element).find('.entry-title').first().text().trim();
    const year = parseInt($search(element).find('.year').first().text().trim(), 10);
    const url = $search(element).find('.lnk-blk').attr('href');
    if (!title || !year || !url) return;

    searchResults.push({ title, year, url });
  });

  let watchPageUrl = searchResults.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.url;
  if (!watchPageUrl) throw new NotFoundError('No watchable item found');

  if (ctx.media.type === 'show') {
    const match = watchPageUrl.match(/\/series\/([^/]+)\/?/);
    if (!match) throw new Error('Failed to parse watch page url');
    watchPageUrl = watchPageUrl.replace(
      `/series/${match[1]}`,
      `/episode/${match[1]}-${ctx.media.season.number}x${ctx.media.episode.number}`,
    );
  }

  const watchPage = load(await ctx.proxiedFetcher(watchPageUrl));

  // it embeds vidsrc when it bflix does not has the stream
  // i think all shows embed vidsrc, not sure
  const embedUrl = watchPage('ul.bx-lst li a:contains("- Bflix")')
    .closest('aside')
    .next('div.video-options')
    .find('iframe')
    .attr('data-lazy-src');

  if (!embedUrl) throw new Error('Failed to find embed url');

  const embedPage = load(await ctx.proxiedFetcher(embedUrl));

  const url = embedPage('iframe').attr('src');
  if (!url) throw new Error('Failed to find embed url');

  return {
    embeds: [
      {
        embedId: 'bflix',
        url,
      },
    ],
  };
}

export const nitesScraper = makeSourcerer({
  id: 'nites',
  name: 'Nites',
  rank: 90,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
