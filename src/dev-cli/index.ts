/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

import { program } from 'commander';
import dotenv from 'dotenv';
import { prompt } from 'enquirer';

import { runScraper } from '@/dev-cli/scraper';
import { processOptions } from '@/dev-cli/validate';

import { getBuiltinEmbeds, getBuiltinSources } from '..';

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

const sourceScrapers = getBuiltinSources().sort((a, b) => b.rank - a.rank);
const embedScrapers = getBuiltinEmbeds().sort((a, b) => b.rank - a.rank);
const sources = [...sourceScrapers, ...embedScrapers];

function joinMediaTypes(mediaTypes: string[] | undefined) {
  if (mediaTypes) {
    const formatted = mediaTypes
      .map((type: string) => {
        return `${type[0].toUpperCase() + type.substring(1).toLowerCase()}s`;
      })
      .join(' / ');

    return `(${formatted})`;
  }
  return ''; // * Embed sources pass through here too
}

async function runQuestions() {
  const options = {
    fetcher: 'node-fetch',
    sourceId: '',
    tmdbId: '',
    type: 'movie',
    season: '0',
    episode: '0',
    url: '',
  };

  const answers = await prompt<CommonAnswers>([
    {
      type: 'select',
      name: 'fetcher',
      message: 'Select a fetcher mode',
      choices: [
        {
          message: 'Native',
          name: 'native',
        },
        {
          message: 'Node fetch',
          name: 'node-fetch',
        },
        {
          message: 'Browser',
          name: 'browser',
        },
      ],
    },
    {
      type: 'select',
      name: 'source',
      message: 'Select a source',
      choices: sources.map((source) => ({
        message: `[${source.type.toLocaleUpperCase()}] ${source.name} ${joinMediaTypes(source.mediaTypes)}`.trim(),
        name: source.id,
      })),
    },
  ]);

  options.fetcher = answers.fetcher;
  options.sourceId = answers.source;

  const source = sources.find(({ id }) => id === answers.source);

  if (!source) {
    throw new Error(`No source with ID ${answers.source} found`);
  }

  if (source.type === 'embed') {
    const sourceAnswers = await prompt<EmbedSourceAnswers>([
      {
        type: 'input',
        name: 'url',
        message: 'Embed URL',
      },
    ]);

    options.url = sourceAnswers.url;
  } else {
    const sourceAnswers = await prompt<ProviderSourceAnswers>([
      {
        type: 'input',
        name: 'id',
        message: 'TMDB ID',
      },
      {
        type: 'select',
        name: 'type',
        message: 'Media type',
        choices: [
          {
            message: 'Movie',
            name: 'movie',
          },
          {
            message: 'TV Show',
            name: 'show',
          },
        ],
      },
    ]);

    options.tmdbId = sourceAnswers.id;
    options.type = sourceAnswers.type;

    if (sourceAnswers.type === 'show') {
      const seriesAnswers = await prompt<ShowAnswers>([
        {
          type: 'input',
          name: 'season',
          message: 'Season',
        },
        {
          type: 'input',
          name: 'episode',
          message: 'Episode',
        },
      ]);

      options.season = seriesAnswers.season;
      options.episode = seriesAnswers.episode;
    }
  }

  const { providerOptions, source: validatedSource, options: validatedOps } = await processOptions(sources, options);
  await runScraper(providerOptions, validatedSource, validatedOps);
}

async function runCommandLine() {
  program
    .option('-f, --fetcher <fetcher>', "Fetcher to use. Either 'native' or 'node-fetch'", 'node-fetch')
    .option('-sid, --source-id <id>', 'ID for the source to use. Either an embed or provider', '')
    .option('-tid, --tmdb-id <id>', 'TMDB ID for the media to scrape. Only used if source is a provider', '')
    .option('-t, --type <type>', "Media type. Either 'movie' or 'show'. Only used if source is a provider", 'movie')
    .option('-s, --season <number>', "Season number. Only used if type is 'show'", '0')
    .option('-e, --episode <number>', "Episode number. Only used if type is 'show'", '0')
    .option('-u, --url <embed URL>', 'URL to a video embed. Only used if source is an embed', '');

  program.parse();

  const {
    providerOptions,
    source: validatedSource,
    options: validatedOps,
  } = await processOptions(sources, program.opts());
  await runScraper(providerOptions, validatedSource, validatedOps);
}

if (process.argv.length === 2) {
  runQuestions()
    .catch(() => console.error('Exited.'))
    .finally(() => process.exit(0));
} else {
  runCommandLine()
    .catch(() => console.error('Exited.'))
    .finally(() => process.exit(0));
}
