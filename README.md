# @movie-web/providers

package that holds all providers of movie-web.
Feel free to use for your own projects.

features:
 - scrape popular streaming websites
 - works in both browser and server-side

> **This package is still WIP**

Todos:
 - add tests
   - ProviderControls.runAll()
     - are events called?
     - custom source or embed order
     - are fetchers called?
     - is proxiedFetcher properly defaulted back to normal fetcher?
   - ProviderControls.runSourceScraper()
     - is source scraper called?
     - does it return as expected?
     - does it error when invalid type or id?
   - ProviderControls.runEmbedScraper()
     - is embed scraper called?
     - does it return as expected?
     - does it error when invalid id?
   - makeStandardFetcher()
     - do all parameters get passed to real fetch as expected?
     - does serialisation work as expected? (formdata + json + string)
     - does json responses get automatically parsed?
 - add all real providers
 - fetcher for MW's simple-proxy
 - make default fetcher maker thing work with both undici and node-fetch

Future todos:
 - docs: examples for nodejs + browser
 - docs: how to use + usecases
 - docs: examples for custom fetcher
 - docs: example with tmdb search
 - feature: choose an output environment (for browser or for native)
 - feature: flixhq show support
