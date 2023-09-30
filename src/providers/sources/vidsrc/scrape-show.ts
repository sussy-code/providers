import { ShowContext } from '@/providers/sources/vidsrc/common';
import { getVidSrcShowSources } from '@/providers/sources/vidsrc/scrape';

export async function scrapeShow(ctx: ShowContext) {
  return {
    embeds: await getVidSrcShowSources(ctx),
  };
}
