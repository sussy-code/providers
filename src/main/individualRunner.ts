import { UseableFetcher } from '@/fetchers/types';
import { IndividualScraperEvents } from '@/main/events';
import { ScrapeMedia } from '@/main/media';
import { EmbedOutput, SourcererOutput } from '@/providers/base';
import { ProviderList } from '@/providers/get';
import { ScrapeContext } from '@/utils/context';

export type IndividualSourceRunnerOptions = {
  fetcher: UseableFetcher;
  proxiedFetcher: UseableFetcher;
  media: ScrapeMedia;
  id: string;
  events?: IndividualScraperEvents;
};

export async function scrapeInvidualSource(
  list: ProviderList,
  ops: IndividualSourceRunnerOptions,
): Promise<SourcererOutput> {
  const sourceScraper = list.sources.find((v) => ops.id === v.id);
  if (!sourceScraper) throw new Error('Source with ID not found');
  if (ops.media.type === 'movie' && !sourceScraper.scrapeMovie) throw new Error('Source is not compatible with movies');
  if (ops.media.type === 'show' && !sourceScraper.scrapeShow) throw new Error('Source is not compatible with shows');

  const contextBase: ScrapeContext = {
    fetcher: ops.fetcher,
    proxiedFetcher: ops.proxiedFetcher,
    progress(val) {
      ops.events?.update?.({
        id: sourceScraper.id,
        percentage: val,
        status: 'pending',
      });
    },
  };

  let output: SourcererOutput | null = null;
  if (ops.media.type === 'movie' && sourceScraper.scrapeMovie)
    output = await sourceScraper.scrapeMovie({
      ...contextBase,
      media: ops.media,
    });
  else if (ops.media.type === 'show' && sourceScraper.scrapeShow)
    output = await sourceScraper.scrapeShow({
      ...contextBase,
      media: ops.media,
    });

  if (!output) throw new Error('output is null');
  return output;
}

export type IndividualEmbedRunnerOptions = {
  fetcher: UseableFetcher;
  proxiedFetcher: UseableFetcher;
  url: string;
  id: string;
  events?: IndividualScraperEvents;
};

export async function scrapeIndividualEmbed(
  list: ProviderList,
  ops: IndividualEmbedRunnerOptions,
): Promise<EmbedOutput> {
  const embedScraper = list.embeds.find((v) => ops.id === v.id);
  if (!embedScraper) throw new Error('Embed with ID not found');

  return embedScraper.scrape({
    fetcher: ops.fetcher,
    proxiedFetcher: ops.proxiedFetcher,
    url: ops.url,
    progress(val) {
      ops.events?.update?.({
        id: embedScraper.id,
        percentage: val,
        status: 'pending',
      });
    },
  });
}
