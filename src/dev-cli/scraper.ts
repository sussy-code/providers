/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

import Spinnies from 'spinnies';

import { logDeepObject } from '@/dev-cli/logging';
import { getMovieMediaDetails, getShowMediaDetails } from '@/dev-cli/tmdb';
import { CommandLineArguments } from '@/dev-cli/validate';

import { MetaOutput, ProviderMakerOptions, makeProviders } from '..';

async function runActualScraping(
  providerOptions: ProviderMakerOptions,
  source: MetaOutput,
  options: CommandLineArguments,
) {
  const providers = makeProviders(providerOptions);

  if (source.type === 'embed') {
    return providers.runEmbedScraper({
      url: options.url,
      id: source.id,
    });
  }

  if (source.type === 'source') {
    let media;

    if (options.type === 'movie') {
      media = await getMovieMediaDetails(options.tmdbId);
    } else {
      media = await getShowMediaDetails(options.tmdbId, options.season, options.episode);
    }

    return providers.runSourceScraper({
      media,
      id: source.id,
    });
  }

  throw new Error('Invalid source type');
}

export async function runScraper(
  providerOptions: ProviderMakerOptions,
  source: MetaOutput,
  options: CommandLineArguments,
) {
  const spinnies = new Spinnies();

  spinnies.add('scrape', { text: `Running ${source.name} scraper` });
  try {
    const result = await runActualScraping(providerOptions, source, options);
    spinnies.succeed('scrape', { text: 'Done!' });
    logDeepObject(result);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    spinnies.fail('scrape', { text: `ERROR: ${message}` });
    console.error(error);
  }
}
