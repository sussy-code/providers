import { Embed, Sourcerer } from '@/providers/base';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { mp4uploadScraper } from '@/providers/embeds/mp4upload';
import { streambucketScraper } from '@/providers/embeds/streambucket';
import { streamsbScraper } from '@/providers/embeds/streamsb';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { upstreamScraper } from '@/providers/embeds/upstream';
import { vidsrcembedScraper } from '@/providers/embeds/vidsrc';
import { flixhqScraper } from '@/providers/sources/flixhq/index';
import { goMoviesScraper } from '@/providers/sources/gomovies/index';
import { kissAsianScraper } from '@/providers/sources/kissasian/index';
import { remotestreamScraper } from '@/providers/sources/remotestream';
import { superStreamScraper } from '@/providers/sources/superstream/index';
import { vidsrcScraper } from '@/providers/sources/vidsrc';
import { zoechipScraper } from '@/providers/sources/zoechip';

export function gatherAllSources(): Array<Sourcerer> {
  // all sources are gathered here
  return [
    flixhqScraper,
    remotestreamScraper,
    kissAsianScraper,
    superStreamScraper,
    goMoviesScraper,
    zoechipScraper,
    vidsrcScraper,
  ];
}

export function gatherAllEmbeds(): Array<Embed> {
  // all embeds are gathered here
  return [
    upcloudScraper,
    mp4uploadScraper,
    streamsbScraper,
    upstreamScraper,
    mixdropScraper,
    vidsrcembedScraper,
    streambucketScraper,
  ];
}
