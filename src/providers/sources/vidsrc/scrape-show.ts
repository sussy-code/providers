import { getVidSrcShowSources } from '@/providers/sources/vidsrc/scrape';
import { ShowScrapeContext } from '@/utils/context';

export async function scrapeShow(ctx: ShowScrapeContext) {
  return {
    embeds: await getVidSrcShowSources(ctx),
  };
}
