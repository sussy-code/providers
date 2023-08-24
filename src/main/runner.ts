import { Fetcher } from '@/fetchers/types';
import { FullScraperEvents } from '@/main/events';
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
};

export async function runAllProviders(_ops: ProviderRunnerOptions, _cbs: FullScraperEvents): Promise<RunOutput | null> {
  return {
    sourceId: '123',
    stream: {
      type: 'file',
      qualities: {},
    },
  };
}
