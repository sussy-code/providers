import nodeFetch from 'node-fetch';

import { Embed, Sourcerer } from '@/providers/base';

import { ProviderMakerOptions, makeStandardFetcher, targets } from '..';

export type CommandLineArguments = {
  fetcher: string;
  sourceId: string;
  tmdbId: string;
  type: string;
  season: string;
  episode: string;
  url: string;
};

export async function processOptions(sources: Array<Embed | Sourcerer>, options: CommandLineArguments) {
  const fetcherOptions = ['node-fetch', 'native', 'browser'];
  if (!fetcherOptions.includes(options.fetcher)) {
    throw new Error(`Fetcher must be any of: ${fetcherOptions.join()}`);
  }

  if (!options.sourceId.trim()) {
    throw new Error('Source ID must be provided');
  }

  const source = sources.find(({ id }) => id === options.sourceId);

  if (!source) {
    throw new Error('Invalid source ID. No source found');
  }

  if (source.type === 'embed' && !options.url.trim()) {
    throw new Error('Must provide an embed URL for embed sources');
  }

  if (source.type === 'source') {
    if (!options.tmdbId.trim()) {
      throw new Error('Must provide a TMDB ID for provider sources');
    }

    if (Number.isNaN(Number(options.tmdbId)) || Number(options.tmdbId) < 0) {
      throw new Error('TMDB ID must be a number greater than 0');
    }

    if (!options.type.trim()) {
      throw new Error('Must provide a type for provider sources');
    }

    if (options.type !== 'movie' && options.type !== 'show') {
      throw new Error("Invalid media type. Must be either 'movie' or 'show'");
    }

    if (options.type === 'show') {
      if (!options.season.trim()) {
        throw new Error('Must provide a season number for TV shows');
      }

      if (!options.episode.trim()) {
        throw new Error('Must provide an episode number for TV shows');
      }

      if (Number.isNaN(Number(options.season)) || Number(options.season) <= 0) {
        throw new Error('Season number must be a number greater than 0');
      }

      if (Number.isNaN(Number(options.episode)) || Number(options.episode) <= 0) {
        throw new Error('Episode number must be a number greater than 0');
      }
    }
  }

  let fetcher;

  if (options.fetcher === 'native') {
    fetcher = makeStandardFetcher(fetch);
  } else {
    fetcher = makeStandardFetcher(nodeFetch);
  }

  const providerOptions: ProviderMakerOptions = {
    fetcher,
    target: targets.ANY,
    consistentIpForRequests: true,
  };

  return {
    providerOptions,
    options,
    source,
  };
}
