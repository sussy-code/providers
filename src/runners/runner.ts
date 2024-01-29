import { FullScraperEvents } from '@/entrypoint/utils/events';
import { ScrapeMedia } from '@/entrypoint/utils/media';
import { FeatureMap, flagsAllowedInFeatures } from '@/entrypoint/utils/targets';
import { UseableFetcher } from '@/fetchers/types';
import { EmbedOutput, SourcererOutput } from '@/providers/base';
import { ProviderList } from '@/providers/get';
import { Stream } from '@/providers/streams';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { reorderOnIdList } from '@/utils/list';
import { isValidStream } from '@/utils/valid';

// Define types for the output of the run function
export type RunOutput = {
  sourceId: string;
  embedId?: string;
  stream: Stream;
};

// Define options for the provider runner
export type ProviderRunnerOptions = {
  fetcher: UseableFetcher;
  proxiedFetcher: UseableFetcher;
  features: FeatureMap;
  sourceOrder?: string[];
  embedOrder?: string[];
  events?: FullScraperEvents;
  media: ScrapeMedia;
};

// Main function to run all providers
export async function runAllProviders(list: ProviderList, ops: ProviderRunnerOptions): Promise<RunOutput | null> {
  // Reorder the sources and embeds based on the provided order
  const { sources, embeds } = reorderProviders(list, ops);
  let lastId = '';

  // Create the base context for scraping
  const contextBase: ScrapeContext = createContextBase(ops, lastId);

  // Initialize the events with the source IDs
  ops.events?.init?.({
    sourceIds: sources.map((v: any) => v.id),
  });

  // Iterate over each source
  for (const s of sources) {
    // Run the source scrapers and get the output
    const output = await runSourceScrapers(s, ops, contextBase);
    if (!output) continue;

    // Process the output from the source scrapers
    const result = await processOutput(s, output, ops, embeds, contextBase);
    if (result) return result;
  }

  // If no providers or embeds return streams, return null
  return null;
}

// Function to reorder the providers based on the provided order
function reorderProviders(list: ProviderList, ops: ProviderRunnerOptions) {
  const sources = reorderOnIdList(ops.sourceOrder ?? [], list.sources).filter((v: any) => {
    if (ops.media.type === 'movie') return !!v.scrapeMovie;
    if (ops.media.type === 'show') return !!v.scrapeShow;
    return false;
  });
  const embeds = reorderOnIdList(ops.embedOrder ?? [], list.embeds);
  return { sources, embeds };
}

// Function to create the base context for scraping
function createContextBase(ops: ProviderRunnerOptions, lastId: string): ScrapeContext {
  return {
    fetcher: ops.fetcher,
    proxiedFetcher: ops.proxiedFetcher,
    progress(val: number) {
      ops.events?.update?.({
        id: lastId,
        percentage: val,
        status: 'pending',
      });
    },
  };
}

// Function to run the source scrapers and get the output
async function runSourceScrapers(s: any, ops: ProviderRunnerOptions, contextBase: ScrapeContext) {
  ops.events?.start?.(s.id);
  let output: SourcererOutput | null = null;
  try {
    output = await scrapeSource(s, ops, contextBase);
    if (!output) throw Error('No output');
    if ((!output.stream || output.stream.length === 0) && output.embeds.length === 0)
      throw new NotFoundError('No streams found');
  } catch (err) {
    handleSourceError(s, err, ops);
  }
  return output;
}

// Function to scrape the source based on the media type
async function scrapeSource(s: any, ops: ProviderRunnerOptions, contextBase: ScrapeContext) {
  let output: SourcererOutput | null = null;
  if (ops.media.type === 'movie' && s.scrapeMovie)
    output = await s.scrapeMovie({
      ...contextBase,
      media: ops.media,
    });
  else if (ops.media.type === 'show' && s.scrapeShow)
    output = await s.scrapeShow({
      ...contextBase,
      media: ops.media,
    });
  return output;
}

// Function to handle errors during source scraping
function handleSourceError(s: any, err: any, ops: ProviderRunnerOptions) {
  if (err instanceof NotFoundError) {
    ops.events?.update?.({
      id: s.id,
      percentage: 100,
      status: 'notfound',
      reason: err.message,
    });
  } else {
    ops.events?.update?.({
      id: s.id,
      percentage: 100,
      status: 'failure',
      error: err,
    });
  }
}

// Function to process the output from the source scrapers
async function processOutput(s: any, output: any, ops: ProviderRunnerOptions, embeds: any[], contextBase: ScrapeContext) {
  if (output.stream?.[0]) {
    return {
      sourceId: s.id,
      stream: output.stream[0],
    };
  }

  // Filter and sort the embeds from the output
  const sortedEmbeds = filterAndSortEmbeds(output, embeds, ops);

  // If there are any sorted embeds, discover them
  if (sortedEmbeds.length > 0) {
    ops.events?.discoverEmbeds?.({
      embeds: sortedEmbeds.map((v: any, i: number) => ({
        id: [s.id, i].join('-'),
        embedScraperId: v.embedId,
      })),
      sourceId: s.id,
    });
  }

  // Iterate over each sorted embed
  for (const ind in sortedEmbeds) {
    if (!Object.prototype.hasOwnProperty.call(sortedEmbeds, ind)) continue;
    const e = sortedEmbeds[ind];
    const scraper = embeds.find((v: any) => v.id === e.embedId);
    if (!scraper) throw new Error('Invalid embed returned');

    // Run the embed scraper and get the result
    const result = await runEmbedScraper(s, e, scraper, ops, contextBase);
    if (result) return result;
  }
}

// Function to filter and sort the embeds from the output
function filterAndSortEmbeds(output: any, embeds: any[], ops: ProviderRunnerOptions) {
  const embedIds = embeds.map((v: any) => v.id);
  return output.embeds
    .filter((embed: any) => {
      const e = embeds.find((v: any) => v.id === embed.embedId);
      if (!e || e.disabled) return false;
      return true;
    })
    .sort((a: any, b: any) => embedIds.indexOf(a.embedId) - embedIds.indexOf(b.embedId));
}

// Function to run the embed scraper and get the result
async function runEmbedScraper(s: any, e: any, scraper: any, ops: ProviderRunnerOptions, contextBase: ScrapeContext) {
  const id = [s.id, e].join('-');
  ops.events?.start?.(id);
  let embedOutput: EmbedOutput;
  try {
    embedOutput = await scraper.scrape({
      ...contextBase,
      url: e.url,
    });
    embedOutput.stream = embedOutput.stream
      .filter((stream: Stream) => isValidStream(stream))
      .filter((stream: Stream) => flagsAllowedInFeatures(ops.features, stream.flags));
    if (embedOutput.stream.length === 0) throw new NotFoundError('No streams found');
  } catch (err) {
    handleEmbedError(id, err, ops);
    return null;
  }

  return {
    sourceId: s.id,
    embedId: scraper.id,
    stream: embedOutput.stream[0],
  };
}

// Function to handle errors during embed scraping
function handleEmbedError(id: string, err: any, ops: ProviderRunnerOptions) {
  if (err instanceof NotFoundError) {
    ops.events?.update?.({
      id,
      percentage: 100,
      status: 'notfound',
      reason: err.message,
    });
  } else {
    ops.events?.update?.({
      id,
      percentage: 100,
      status: 'failure',
      error: err,
    });
  }
}
