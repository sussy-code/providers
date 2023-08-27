# @movie-web/providers

package that holds all providers of movie-web.
Feel free to use for your own projects.

features:
 - scrape popular streaming websites
 - works in both browser and server-side

> This package is still WIP

Todos:
 - add tests (integration, unit tests)
 - running individual scrapers
 - finish fetchers:
   - make baseUrl param work
   - proper serialization (with content-type headers) for standard fetcher
   - automatically parse json
 - error logging for failed scrapers
 - make the lib not compile into one file, keep dependency structure

Future todos:
 - docs: examples for nodejs + browser
 - docs: how to use + usecases
 - docs: examples for custom fetcher
 - choose an output environment (for browser or for native)
 - flixhq show support
