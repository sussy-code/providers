import { UseableFetcher } from '@/fetchers/types';
import { IndividualScraperEvents } from '@/main/events';
import { ScrapeMedia } from '@/main/media';
import { FeatureMap, flagsAllowedInFeatures } from '@/main/targets';
import { EmbedOutput, SourcererOutput } from '@/providers/base';
import { ProviderList } from '@/providers/get';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { isValidStream } from '@/utils/valid';

export type IndividualSourceRunnerOptions = {
  features: FeatureMap;
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

  // stream doesn't satisfy the feature flags, so gets removed in output
  if (output?.stream && (!isValidStream(output.stream) || !flagsAllowedInFeatures(ops.features, output.stream.flags))) {
    output.stream = undefined;
  }

  if (!output) throw new Error('output is null');
  return output;
}

export type IndividualEmbedRunnerOptions = {
  features: FeatureMap;
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

  const output = await embedScraper.scrape({
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

  if (!isValidStream(output.stream)) throw new NotFoundError('stream is incomplete');
  if (!flagsAllowedInFeatures(ops.features, output.stream.flags))
    throw new NotFoundError("stream doesn't satisfy target feature flags");

  return output;
}
