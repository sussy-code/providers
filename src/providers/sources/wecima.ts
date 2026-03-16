import { load } from 'cheerio';

import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://wecima.tube';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchPage = await ctx.proxiedFetcher(`/search/${encodeURIComponent(ctx.media.title)}/`, {
    baseUrl,
  });

  const search$ = load(searchPage);
  const firstResult = search$('.Grid--WecimaPosts .GridItem a').first();
  if (!firstResult.length) throw new NotFoundError('No results found');

  const contentUrl = firstResult.attr('href');
  if (!contentUrl) throw new NotFoundError('No content URL found');
  ctx.progress(30);

  const contentPage = await ctx.proxiedFetcher(contentUrl, { baseUrl });
  const content$ = load(contentPage);

  let embedUrl: string | undefined;

  if (ctx.media.type === 'movie') {
    embedUrl = content$('meta[itemprop="embedURL"]').attr('content');
  } else {
    const seasonLinks = content$('.List--Seasons--Episodes a');
    let seasonUrl: string | undefined;

    for (const element of seasonLinks) {
      const text = content$(element).text().trim();
      if (text.includes(`موسم ${ctx.media.season}`)) {
        seasonUrl = content$(element).attr('href');
        break;
      }
    }

    if (!seasonUrl) throw new NotFoundError(`Season ${ctx.media.season} not found`);

    const seasonPage = await ctx.proxiedFetcher(seasonUrl, { baseUrl });
    const season$ = load(seasonPage);

    const episodeLinks = season$('.Episodes--Seasons--Episodes a');
    for (const element of episodeLinks) {
      const epTitle = season$(element).find('episodetitle').text().trim();
      if (epTitle === `الحلقة ${ctx.media.episode}`) {
        const episodeUrl = season$(element).attr('href');
        if (episodeUrl) {
          const episodePage = await ctx.proxiedFetcher(episodeUrl, { baseUrl });
          const episode$ = load(episodePage);
          embedUrl = episode$('meta[itemprop="embedURL"]').attr('content');
        }
        break;
      }
    }
  }

  if (!embedUrl) throw new NotFoundError('No embed URL found');
  ctx.progress(60);

  // Get the final video URL
  const embedPage = await ctx.proxiedFetcher(embedUrl);
  const embed$ = load(embedPage);
  const videoSource = embed$('source[type="video/mp4"]').attr('src');

  if (!videoSource) throw new NotFoundError('No video source found');
  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        flags: [],
        headers: {
          referer: baseUrl,
        },
        qualities: {
          unknown: {
            type: 'mp4',
            url: videoSource,
          },
        },
        captions: [],
      },
    ],
  };
}

export const wecimaScraper = makeSourcerer({
  id: 'wecima',
  name: 'Wecima (Arabic)',
  rank: 0,
  disabled: false,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
