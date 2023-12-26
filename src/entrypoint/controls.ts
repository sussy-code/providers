import { FullScraperEvents, IndividualScraperEvents } from '@/entrypoint/utils/events';
import { ScrapeMedia } from '@/entrypoint/utils/media';
import { MetaOutput, getAllEmbedMetaSorted, getAllSourceMetaSorted, getSpecificId } from '@/entrypoint/utils/meta';
import { FeatureMap } from '@/entrypoint/utils/targets';
import { makeFetcher } from '@/fetchers/common';
import { Fetcher } from '@/fetchers/types';
import { Embed, EmbedOutput, Sourcerer, SourcererOutput } from '@/providers/base';
import { scrapeIndividualEmbed, scrapeInvidualSource } from '@/runners/individualRunner';
import { RunOutput, runAllProviders } from '@/runners/runner';

export interface ProviderControlsInput {
  fetcher: Fetcher;
  proxiedFetcher?: Fetcher;
  features: FeatureMap;
  sources: Sourcerer[];
  embeds: Embed[];
}

export interface RunnerOptions {
  // overwrite the order of sources to run. list of ids
  // any omitted ids are in added to the end in order of rank (highest first)
  sourceOrder?: string[];

  // overwrite the order of embeds to run. list of ids
  // any omitted ids are in added to the end in order of rank (highest first)
  embedOrder?: string[];

  // object of event functions
  events?: FullScraperEvents;

  // the media you want to see sources from
  media: ScrapeMedia;
}

export interface SourceRunnerOptions {
  // object of event functions
  events?: IndividualScraperEvents;

  // the media you want to see sources from
  media: ScrapeMedia;

  // id of the source scraper you want to scrape from
  id: string;
}

export interface EmbedRunnerOptions {
  // object of event functions
  events?: IndividualScraperEvents;

  // the embed url
  url: string;

  // id of the embed scraper you want to scrape from
  id: string;
}

export interface ProviderControls {
  // Run all providers one by one. in order of rank (highest first)
  // returns the stream, or null if none found
  runAll(runnerOps: RunnerOptions): Promise<RunOutput | null>;

  // Run a specific source scraper
  runSourceScraper(runnerOps: SourceRunnerOptions): Promise<SourcererOutput>;

  // Run a specific embed scraper
  runEmbedScraper(runnerOps: EmbedRunnerOptions): Promise<EmbedOutput>;

  // get meta data about a source or embed.
  getMetadata(id: string): MetaOutput | null;

  // return all sources. sorted by rank (highest first)
  listSources(): MetaOutput[];

  // return all embed scrapers. sorted by rank (highest first)
  listEmbeds(): MetaOutput[];
}

export function makeControls(ops: ProviderControlsInput): ProviderControls {
  const list = {
    embeds: ops.embeds,
    sources: ops.sources,
  };

  const providerRunnerOps = {
    features: ops.features,
    fetcher: makeFetcher(ops.fetcher),
    proxiedFetcher: makeFetcher(ops.proxiedFetcher ?? ops.fetcher),
  };

  return {
    runAll(runnerOps) {
      return runAllProviders(list, {
        ...providerRunnerOps,
        ...runnerOps,
      });
    },
    runSourceScraper(runnerOps) {
      return scrapeInvidualSource(list, {
        ...providerRunnerOps,
        ...runnerOps,
      });
    },
    runEmbedScraper(runnerOps) {
      return scrapeIndividualEmbed(list, {
        ...providerRunnerOps,
        ...runnerOps,
      });
    },
    getMetadata(id) {
      return getSpecificId(list, id);
    },
    listSources() {
      return getAllSourceMetaSorted(list);
    },
    listEmbeds() {
      return getAllEmbedMetaSorted(list);
    },
  };
}
