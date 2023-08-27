import { makeFullFetcher } from '@/fetchers/common';
import { Fetcher } from '@/fetchers/types';
import { FullScraperEvents } from '@/main/events';
import { ScrapeMedia } from '@/main/media';
import { MetaOutput, getAllEmbedMetaSorted, getAllSourceMetaSorted, getSpecificId } from '@/main/meta';
import { RunOutput, runAllProviders } from '@/main/runner';
import { getProviders } from '@/providers/all';

export interface ProviderBuilderOptions {
  // fetcher, every web request gets called through here
  fetcher: Fetcher;

  // proxied fetcher, if the scraper needs to access a CORS proxy. this fetcher will be called instead
  // of the normal fetcher. Defaults to the normal fetcher.
  proxiedFetcher?: Fetcher;
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

export interface ProviderControls {
  // Run all providers one by one. in order of rank (highest first)
  // returns the stream, or null if none found
  runAll(runnerOps: RunnerOptions): Promise<RunOutput | null>;

  // get meta data about a source or embed.
  getMetadata(id: string): MetaOutput | null;

  // return all sources. sorted by rank (highest first)
  listSources(): MetaOutput[];

  // return all embed scrapers. sorted by rank (highest first)
  listEmbeds(): MetaOutput[];
}

export function makeProviders(ops: ProviderBuilderOptions): ProviderControls {
  const list = getProviders();
  const providerRunnerOps = {
    fetcher: makeFullFetcher(ops.fetcher),
    proxiedFetcher: makeFullFetcher(ops.proxiedFetcher ?? ops.fetcher),
  };

  return {
    runAll(runnerOps: RunnerOptions) {
      return runAllProviders(list, {
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
