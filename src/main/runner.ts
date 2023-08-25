import { Fetcher } from '@/fetchers/types';
import { FullScraperEvents } from '@/main/events';
import { ScrapeMedia } from '@/main/media';
import { Stream } from '@/providers/streams';

export type RunOutput = {
  sourceId: string;
  embedId?: string;
  stream: Stream;
};

export type SourceRunOutput = {
  sourceId: string;
  stream?: Stream;
  embeds: [];
};

export type EmbedRunOutput = {
  embedId: string;
  stream?: Stream;
};

export type ProviderRunnerOptions = {
  fetcher: Fetcher;
  proxiedFetcher: Fetcher;
  sourceOrder?: string[];
  embedOrder?: string[];
  events?: FullScraperEvents;
  media: ScrapeMedia;
};

export async function runAllProviders(_ops: ProviderRunnerOptions): Promise<RunOutput | null> {
  return {
    sourceId: '123',
    stream: {
      type: 'file',
      qualities: {},
    },
  };
}
