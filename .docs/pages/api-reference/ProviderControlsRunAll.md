# `ProviderControls.runAll`

Run all providers one by one in order of their built-in ranking.
You can attach events if you need to know what is going on while it is processing.

## Example

```ts
import { ScrapeMedia, targets } from '@movie-web/providers';

// media from TMDB
const media : ScrapeMedia = {
  type: 'movie',
  title: 'Hamilton',
  releaseYear: 2020,
  tmdbId: '556574'
}

// scrape a stream
const stream = await providers.runAll({
  media: media,
})

// scrape a stream, but prioritize flixhq above all
// (other scrapers are still run if flixhq fails, it just has priority)
const flixhqStream = await providers.runAll({
  media: media,
  sourceOrder: ['flixhq']
})
```

## Type

```ts
function runAll(runnerOps: RunnerOptions): Promise<RunOutput | null>;

interface RunnerOptions {
  // overwrite the order of sources to run. List of IDs
  // any omitted IDs are added to the end in order of rank (highest first)
  sourceOrder?: string[];

  // overwrite the order of embeds to run. List of IDs
  // any omitted IDs are added to the end in order of rank (highest first)
  embedOrder?: string[];

  // object of event functions
  events?: FullScraperEvents;

  // the media you want to see sources from
  media: ScrapeMedia;
}

type RunOutput = {
  // source scraper ID
  sourceId: string;

  // if from an embed, this is the embed scraper ID
  embedId?: string;

  // the emitted stream
  stream: Stream;
};
```
