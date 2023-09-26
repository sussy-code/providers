import nodeFetch from 'node-fetch';
import { prompt } from 'enquirer';
import Spinnies from 'spinnies';
import { program } from 'commander';
import dotenv from 'dotenv';
import { makeProviders, targets, makeStandardFetcher, MovieMedia, ShowMedia, ProviderControls, MetaOutput } from '.';

dotenv.config();

type ProviderSourceAnswers = {
  id: string;
  type: string;
};

type EmbedSourceAnswers = {
  url: string;
};

type CommonAnswers = {
  fetcher: string;
  source: string;
};

type ShowAnswers = {
  season: string;
  episode: string;
};

type CommandLineArguments = {
  fetcher: string;
  sourceId: string;
  tmdbId: string;
  type: string;
  season: string;
  episode: string;
  url: string;
};

const TMDB_API_KEY = process.env.MOVIE_WEB_TMDB_API_KEY;

const sources = getAllSources();

function getAllSources() {
  // * The only way to get a list of all sources is to
  // * create all these things. Maybe this should change
  const nativeSources = makeProviders({
    fetcher: makeStandardFetcher(nodeFetch),
    target: targets.NATIVE
  }).listSources();

  const browserSources = makeProviders({
    fetcher: makeStandardFetcher(nodeFetch),
    target: targets.BROWSER
  }).listSources();

  const nativeEmbeds = makeProviders({
    fetcher: makeStandardFetcher(nodeFetch),
    target: targets.NATIVE
  }).listEmbeds();

  const browserEmbeds = makeProviders({
    fetcher: makeStandardFetcher(nodeFetch),
    target: targets.BROWSER
  }).listEmbeds();

  const combined = [
    ...nativeSources, ...browserSources,
    ...nativeEmbeds, ...browserEmbeds
  ];

  // * Remove dupes
  const map = new Map(combined.map(source => [source.id, source]));

  return [...map.values()]
}

async function getMovieMediaDetails(id: string): Promise<MovieMedia> {
  const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  });
  const movie = await response.json();

  if (movie.success === false) {
    throw new Error(movie.status_message);
  }

  return {
    type: 'movie',
    title: movie.title,
    releaseYear: Number(movie.release_date.split('-')[0]),
    tmdbId: id
  };
}

async function getShowMediaDetails(id: string, seasonNumber: string, episodeNumber: string): Promise<ShowMedia> {
  // * TV shows require the TMDB ID for the series, season, and episode
  // * and the name of the series. Needs multiple requests
  let response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  });
  const series = await response.json();

  if (series.success === false) {
    throw new Error(series.status_message);
  }

  response = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  });
  const season = await response.json();

  if (season.success === false) {
    throw new Error(season.status_message);
  }

  response = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${TMDB_API_KEY}`, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  });
  const episode = await response.json();

  if (episode.success === false) {
    throw new Error(episode.status_message);
  }

  return {
    type: 'show',
    title: series.name,
    releaseYear: Number(series.first_air_date.split('-')[0]), // * Is this really what should go here?
    tmdbId: id,
    episode: {
      number: episode.episode_number,
      tmdbId: episode.id
    },
    season: {
      number: season.season_number,
      tmdbId: season.id
    }
  };
}

function joinMediaTypes(mediaTypes: string[] | undefined) {
  if (mediaTypes) {
    const formatted = mediaTypes.map((type: string) => {
      type = type[0].toUpperCase() + type.substring(1).toLowerCase();
      return `${type}s`;
    }).join(' / ');

    return `(${formatted})`;
  } else {
    return ''; // * Embed sources pass through here too
  }
}

async function runQuestions() {
  const options = {
    fetcher: 'node-fetch',
    sourceId: '',
    tmdbId: '',
    type: 'movie',
    season: '0',
    episode: '0',
    url: ''
  };

  const answers = await prompt<CommonAnswers>([
    {
      type: 'select',
      name: 'fetcher',
      message: 'Select a fetcher',
      choices: [
        {

          message: 'Native',
          name: 'native'
        },
        {
          message: 'Node fetch',
          name: 'node-fetch'
        }
      ]
    },
    {
      type: 'select',
      name: 'source',
      message: 'Select a source',
      choices: sources.map(source => ({
        message: `[${source.type.toLocaleUpperCase()}] ${source.name} ${joinMediaTypes(source.mediaTypes)}`.trim(),
        name: source.id
      }))
    }
  ]);

  options.fetcher = answers.fetcher;
  options.sourceId = answers.source;

  const source = sources.find(source => source.id === answers.source)!;

  if (source.type === 'embed') {
    const sourceAnswers = await prompt<EmbedSourceAnswers>([
      {
        type: 'input',
        name: 'url',
        message: 'Embed URL'
      }
    ]);

    options.url = sourceAnswers.url;
  } else {
    const sourceAnswers = await prompt<ProviderSourceAnswers>([
      {
        type: 'input',
        name: 'id',
        message: 'TMDB ID'
      },
      {
        type: 'select',
        name: 'type',
        message: 'Media type',
        choices: [
          {
            message: 'Movie',
            name: 'movie'
          },
          {
            message: 'TV Show',
            name: 'show'
          }
        ]
      }
    ]);

    options.tmdbId = sourceAnswers.id;
    options.type = sourceAnswers.type;

    if (sourceAnswers.type === 'show') {
      const seriesAnswers = await prompt<ShowAnswers>([
        {
          type: 'input',
          name: 'season',
          message: 'Season'
        },
        {
          type: 'input',
          name: 'episode',
          message: 'Episode'
        }
      ]);

      options.season = seriesAnswers.season;
      options.episode = seriesAnswers.episode;
    }
  }

  await processOptions(options);
}

async function runCommandLine() {
  program
    .option('-f, --fetcher <fetcher>', 'Fetcher to use. Either \'native\' or \'node-fetch\'', 'node-fetch')
    .option('-sid, --source-id <id>', 'ID for the source to use. Either an embed or provider', '')
    .option('-tid, --tmdb-id <id>', 'TMDB ID for the media to scrape. Only used if source is a provider', '')
    .option('-t, --type <type>', 'Media type. Either \'movie\' or \'show\'. Only used if source is a provider', 'movie')
    .option('-s, --season <number>', 'Season number. Only used if type is \'show\'', '0')
    .option('-e, --episode <number>', 'Episode number. Only used if type is \'show\'', '0')
    .option('-u, --url <embed URL', 'URL to a video embed. Only used if source is an embed', '')

  program.parse();

  await processOptions(program.opts());
}

async function processOptions(options: CommandLineArguments) {
  if (options.fetcher !== 'node-fetch' && options.fetcher !== 'native') {
    throw new Error('Fetcher must be either \'native\' or \'node-fetch\'');
  }

  if (!options.sourceId.trim()) {
    throw new Error('Source ID must be provided');
  }

  const source = sources.find(source => source.id === options.sourceId);

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

    if (isNaN(Number(options.tmdbId)) || Number(options.tmdbId) < 0) {
      throw new Error('TMDB ID must be a number greater than 0');
    }

    if (!options.type.trim()) {
      throw new Error('Must provide a type for provider sources');
    }

    if (options.type !== 'movie' && options.type !== 'show') {
      throw new Error('Invalid media type. Must be either \'movie\' or \'show\'');
    }

    if (options.type === 'show') {
      if (!options.season.trim()) {
        throw new Error('Must provide a season number for TV shows');
      }

      if (!options.episode.trim()) {
        throw new Error('Must provide an episode number for TV shows');
      }

      if (isNaN(Number(options.season)) || Number(options.season) <= 0) {
        throw new Error('Season number must be a number greater than 0');
      }

      if (isNaN(Number(options.episode)) || Number(options.episode) <= 0) {
        throw new Error('Episode number must be a number greater than 0');
      }
    }
  }

  let fetcher;

  if (options.fetcher === 'native') {
    fetcher = makeStandardFetcher(fetch as any);
  } else {
    fetcher = makeStandardFetcher(nodeFetch);
  }

  const providers = makeProviders({
    fetcher: fetcher,
    target: targets.NATIVE
  });

  await runScraper(providers, source, options);
}

async function runScraper(providers: ProviderControls, source: MetaOutput, options: CommandLineArguments) {
  const spinnies = new Spinnies();

  if (source.type === 'embed') {
    spinnies.add('scrape', { text: `Running ${source.name} scraper on ${options.url}` });
    try {
      const result = await providers.runEmbedScraper({
        url: options.url,
        id: source.id
      });
      spinnies.succeed('scrape', { text: 'Done!' });
      console.log(result);
    } catch (error) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }

      spinnies.fail('scrape', { text: `ERROR: ${message}` });
    }
  } else {
    let media;

    if (options.type === 'movie') {
      media = await getMovieMediaDetails(options.tmdbId);
    } else {
      media = await getShowMediaDetails(options.tmdbId, options.season, options.episode);
    }

    spinnies.add('scrape', { text: `Running ${source.name} scraper on ${media.title}` });
    try {
      const result = await providers.runSourceScraper({
        media: media,
        id: source.id
      });
      spinnies.succeed('scrape', { text: 'Done!' });
      console.log(result);
    } catch (error) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }

      spinnies.fail('scrape', { text: `ERROR: ${message}` });
    }
  }
}

if (process.argv.length === 2) {
  runQuestions();
} else {
  runCommandLine();
}
