# @movie-web/providers

package that holds all providers of movie-web.
Feel free to use for your own projects.

features:
 - scrape popular streaming websites
 - works in both browser and server-side

> **This package is still WIP**

Todos:
 - make default fetcher maker thing work with both undici and node-fetch


providers need to be ported to the new provider repo:

* [ ]  superstream
* [x]  flixhq
* [ ]  gomovies
* [ ]  kissasian
* [x]  remotestream

embeds:

* [x]  upcloud
* [x]  mp4upload
* [x]  streamsb

providers that will not be ported:

* 2embed (disabled)
* gdriveplayer (disabled)
* hdwatched (disabled)
* m4ufree (disabled)
* netfilm (disabled)
* sflix (disabled)
* playm4u (never worked)
* streamm4u (never worked, throws 403)
* streamflix (uses flixhq, we already have the content)
