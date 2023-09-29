# @movie-web/providers

package that holds all providers of movie-web.
Feel free to use for your own projects.

features:
- scrape popular streaming websites
- works in both browser and server-side

Visit documentation here: https://providers.docs.movie-web.app/

## Development
To make testing scrapers easier during development a CLI tool is available to run specific sources. To run the CLI testing tool, use `npm run test:dev`. The script supports 2 execution modes

- CLI Mode, for passing in arguments directly to the script
- Question Mode, where the script asks you questions about which source you wish to test

The following CLI Mode arguments are available

| Argument      | Alias  | Description                                                             | Default      |
|---------------|--------|-------------------------------------------------------------------------|--------------|
| `--fetcher`   | `-f`   | Fetcher type. Either `node-fetch` or `native`                           | `node-fetch` |
| `--source-id` | `-sid` | Source ID for the source to be tested                                   |              |
| `--tmdb-id`   | `-tid` | TMDB ID for the media to scrape. Only used if source is a provider      |              |
| `--type`      | `-t`   | Media type. Either `movie` or `show`. Only used if source is a provider | `movie`      |
| `--season`    | `-s`   | Season number. Only used if type is `show`                              | `0`          |
| `--episode`   | `-e`   | Episode number. Only used if type is `show`                             | `0`          |
| `--url`       | `-u`   | URL to a video embed. Only used if source is an embed                   |              |
| `--help`      | `-h`   | Shows help for the command arguments                                    |              |

Example testing the FlixHQ source on the movie "Spirited Away"

```bash
npm run test:dev -- -sid flixhq -tid 129 -t movie
```
