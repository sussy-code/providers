# `ProviderControls.runEmbedScraper`

Run a specific embed scraper and get its emitted streams.

## Example

```ts
import { SourcererOutput } from '@movie-web/providers';

// scrape a stream from upcloud
let output: EmbedOutput;
try {
  output = await providers.runEmbedScraper({
    id: 'upcloud',
    url: 'https://example.com/123',
  })
} catch (err) {
  console.log('failed to scrape')
  return;
}

// output.stream now has your stream
```

## Type

```ts
function runEmbedScraper(runnerOps: SourceRunnerOptions): Promise<EmbedOutput>;

interface EmbedRunnerOptions {
  // object of event functions
  events?: IndividualScraperEvents;

  // the embed URL
  url: string;

  // ID of the embed scraper you want to scrape from
  id: string;
}

type EmbedOutput = {
  stream: Stream;
};
```
