import { load } from 'cheerio';

import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { FileBasedStream } from '@/providers/streams';
import { compareMedia } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { getValidQualityFromString } from '@/utils/quality';

const baseUrl = 'https://fsharetv.co';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchPage = await ctx.proxiedFetcher('/search', {
    baseUrl,
    query: {
      q: ctx.media.title,
    },
  });

  const search$ = load(searchPage);
  const searchResults: { title: string; year?: number; url: string }[] = [];

  search$('.movie-item').each((_, element) => {
    const [, title, year] =
      search$(element)
        .find('b')
        .text()
        ?.match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
    const url = search$(element).find('a').attr('href');
    if (!title || !url) return;

    searchResults.push({ title, year: Number(year) ?? undefined, url });
  });

  const watchPageUrl = searchResults.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.url;
  if (!watchPageUrl) throw new NotFoundError('No watchable item found');
  ctx.progress(50);

  const watchPage = await ctx.proxiedFetcher(watchPageUrl.replace('/movie', '/w'), { baseUrl });

  const fileId = watchPage.match(/Movie\.setSource\('([^']*)'/)?.[1];
  if (!fileId) throw new Error('File ID not found');

  const apiRes: { data: { file: { sources: { src: string; quality: string | number }[] } } } = await ctx.proxiedFetcher(
    `/api/file/${fileId}/source`,
    {
      baseUrl,
      query: {
        type: 'watch',
      },
    },
  );
  if (!apiRes.data.file.sources.length) throw new Error('No sources found');

  // this is to get around a ext bug where it doesn't send the headers to the second req after redir
  const mediaBase = new URL((await ctx.proxiedFetcher.full(apiRes.data.file.sources[0].src, { baseUrl })).finalUrl)
    .origin;

  const qualities = apiRes.data.file.sources.reduce(
    (acc, source) => {
      const quality = typeof source.quality === 'number' ? source.quality.toString() : source.quality;
      const validQuality = getValidQualityFromString(quality);
      acc[validQuality] = {
        type: 'mp4',
        url: `${mediaBase}${source.src.replace('/api', '')}`,
      };
      return acc;
    },
    {} as FileBasedStream['qualities'],
  );
  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        flags: [],
        headers: {
          referer: 'https://fsharetv.co',
        },
        qualities,
        captions: [],
      },
    ],
  };
}

export const fsharetvScraper = makeSourcerer({
  id: 'fsharetv',
  name: 'FshareTV',
  rank: 6,
  disabled: true,
  flags: [],
  scrapeMovie: comboScraper,
});
