import { makeFullFetcher } from '@/fetchers/common';
import { Fetcher } from '@/fetchers/types';
import { FullScraperEvents, IndividualScraperEvents } from '@/main/events';
import { scrapeIndividualEmbed, scrapeInvidualSource } from '@/main/individualRunner';
import { ScrapeMedia } from '@/main/media';
import { MetaOutput, getAllEmbedMetaSorted, getAllSourceMetaSorted, getSpecificId } from '@/main/meta';
import { RunOutput, runAllProviders } from '@/main/runner';
import { Targets, getTargetFeatures } from '@/main/targets';
import { EmbedOutput, SourcererOutput } from '@/providers/base';
import { getProviders } from '@/providers/get';

export interface ProviderBuilderOptions {
  // fetcher, every web request gets called through here
  fetcher: Fetcher;

  // proxied fetcher, if the scraper needs to access a CORS proxy. this fetcher will be called instead
  // of the normal fetcher. Defaults to the normal fetcher.
  proxiedFetcher?: Fetcher;

  // target of where the streams will be used
  target: Targets;
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

export function makeProviders(ops: ProviderBuilderOptions): ProviderControls {
  const features = getTargetFeatures(ops.target);
  const list = getProviders(features);
  const providerRunnerOps = {
    features,
    fetcher: makeFullFetcher(ops.fetcher),
    proxiedFetcher: makeFullFetcher(ops.proxiedFetcher ?? ops.fetcher),
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
