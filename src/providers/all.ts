import { Embed, Sourcerer } from '@/providers/base';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { flixhqScraper } from '@/providers/sources/flixhq/index';
import { remotreamScraper } from '@/providers/sources/remotestream/index';

export function gatherAllSources(): Array<Sourcerer> {
  // all sources are gathered here
  return [flixhqScraper, remotreamScraper];
}

export function gatherAllEmbeds(): Array<Embed> {
  // all embeds are gathered here
  return [upcloudScraper];
}
