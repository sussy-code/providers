export type { EmbedOutput, SourcererOutput } from '@/providers/base';
export type { RunOutput } from '@/main/runner';
export type { MetaOutput } from '@/main/meta';
export type { FullScraperEvents } from '@/main/events';
export type { Targets, Flags } from '@/main/targets';
export type { MediaTypes, ShowMedia, ScrapeMedia, MovieMedia } from '@/main/media';
export type {
  ProviderBuilderOptions,
  ProviderControls,
  RunnerOptions,
  EmbedRunnerOptions,
  SourceRunnerOptions,
} from '@/main/builder';

export { NotFoundError } from '@/utils/errors';
export { makeProviders } from '@/main/builder';
export { makeStandardFetcher } from '@/fetchers/standardFetch';
export { makeSimpleProxyFetcher } from '@/fetchers/simpleProxy';
export { flags, targets } from '@/main/targets';
