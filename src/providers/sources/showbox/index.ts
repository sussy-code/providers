import { load } from 'cheerio';

import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { febBoxScraper } from '@/providers/embeds/febBox';
import { compareMedia } from '@/utils/compare';
import { NotFoundError } from '@/utils/errors';

const showboxBase = `https://www.showbox.media`;

export const showBoxScraper = makeSourcerer({
  id: 'show_box',
  name: 'ShowBox',
  rank: 20,
  flags: [flags.NO_CORS],
  async scrapeMovie(ctx) {
    const search = await ctx.proxiedFetcher<string>('/search', {
      baseUrl: showboxBase,
      query: {
        keyword: ctx.media.title,
      },
    });

    const searchPage = load(search);
    const result = searchPage('.film-name > a')
      .toArray()
      .map((el) => {
        const titleContainer = el.parent?.parent;
        if (!titleContainer) return;
        const year = searchPage(titleContainer).find('.fdi-item').first().text();

        return {
          title: el.attribs.title,
          path: el.attribs.href,
          year: !year.includes('SS') ? parseInt(year, 10) : undefined,
        };
      })
      .find((v) => v && compareMedia(ctx.media, v.title, v.year ? v.year : undefined));

    if (!result?.path) throw new NotFoundError('no result found');

    const febboxResult = await ctx.proxiedFetcher<{
      data?: { link?: string };
    }>('/index/share_link', {
      baseUrl: showboxBase,
      query: {
        id: result.path.split('/')[3],
        type: '1',
      },
    });

    if (!febboxResult?.data?.link) throw new NotFoundError('no result found');

    return {
      embeds: [
        {
          embedId: febBoxScraper.id,
          url: febboxResult.data.link,
        },
      ],
    };
  },
});
