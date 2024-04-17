# `ProviderControls.runSourceScraper`

Run a specific source scraper and get its emitted streams.

## Example

```ts
import { ScrapeMedia , SourcererOutput, NotFoundError } from '@movie-web/providers';

// media from TMDB
const media : ScrapeMedia = {
  type: 'movie',
  title: 'Hamilton',
  releaseYear: 2020,
  tmdbId: '556574'
}

// scrape a stream from flixhq
let output: SourcererOutput;
try {
  output = await providers.runSourceScraper({
    id: 'flixhq',
    media: media,
  })
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('source does not have this media');
  } else {
    console.log('failed to scrape')
  }
  return;
}

if (!output.stream && output.embeds.length === 0) {
  console.log('no streams found');
}
```

## Type

```ts
function runSourceScraper(runnerOps: SourceRunnerOptions): Promise<SourcererOutput>;

interface SourceRunnerOptions {
  // object of event functions
  events?: IndividualScraperEvents;

  // the media you want to see sources from
  media: ScrapeMedia;

  // ID of the source scraper you want to scrape from
  id: string;
}

type SourcererOutput = {
  // list of embeds that the source scraper found.
  // embed ID is a reference to an embed scraper
  embeds: {
    embedId: string;
    url: string;
  }[];

  // the stream that the scraper found
  stream?: Stream;
};
```
