# @movie-web/providers

package that holds all providers of movie-web.
Feel free to use for your own projects.

features:
 - scrape popular streaming websites
 - works in both browser and server-side

> This package is still WIP

Todos:
 - add tests
   - ProviderControls.runAll()
     - are events called?
     - custom source or embed order
     - are fetchers called?
     - is proxiedFetcher properly defaulted back to normal fetcher?
   - makeStandardFetcher()
     - do all parameters get passed to real fetch as expected?
     - does serialisation work as expected? (formdata + json + string)
     - does json responses get automatically parsed?
 - running individual scrapers
 - finish fetchers:
   - automatically parse json
 - error logging for failed scrapers
 - add all real providers

Future todos:
 - docs: examples for nodejs + browser
 - docs: how to use + usecases
 - docs: examples for custom fetcher
 - choose an output environment (for browser or for native)
 - flixhq show support
