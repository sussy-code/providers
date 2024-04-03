import { IndividualScraperEvents } from '@/entrypoint/utils/events';
import { ScrapeMedia } from '@/entrypoint/utils/media';
import { FeatureMap, flagsAllowedInFeatures } from '@/entrypoint/utils/targets';
import { UseableFetcher } from '@/fetchers/types';
import { EmbedOutput, SourcererOutput } from '@/providers/base';
import { ProviderList } from '@/providers/get';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { isValidStream, validatePlayableStreams } from '@/utils/valid';

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

  // filter output with only valid streams
  if (output?.stream) {
    output.stream = output.stream
      .filter((stream) => isValidStream(stream))
      .filter((stream) => flagsAllowedInFeatures(ops.features, stream.flags));
  }

  if (!output) throw new Error('output is null');

  // filter output with only valid embeds that are not disabled
  output.embeds = output.embeds.filter((embed) => {
    const e = list.embeds.find((v) => v.id === embed.embedId);
    if (!e || e.disabled) return false;
    return true;
  });

  if ((!output.stream || output.stream.length === 0) && output.embeds.length === 0)
    throw new NotFoundError('No streams found');

  // only check for playable streams if there are streams, and if there are no embeds
  if (output.stream && output.stream.length > 0 && output.embeds.length === 0) {
    const playableStreams = await validatePlayableStreams(output.stream, ops);
    if (playableStreams.length === 0) throw new NotFoundError('No playable streams found');
    output.stream = playableStreams;
  }
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

  output.stream = output.stream
    .filter((stream) => isValidStream(stream))
    .filter((stream) => flagsAllowedInFeatures(ops.features, stream.flags));
  if (output.stream.length === 0) throw new NotFoundError('No streams found');

  const playableStreams = await validatePlayableStreams(output.stream, ops);
  if (playableStreams.length === 0) throw new NotFoundError('No playable streams found');
  output.stream = playableStreams;

  return output;
}
